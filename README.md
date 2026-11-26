# WarranTrack — Smart Digital Warranty & After-Sales Service Platform
### Final Year University Project | Full-Stack Web Application

---

## 📖 1. Project Abstract & Motivation

In traditional retail and consumer commerce, warranty management relies heavily on paper receipts, physical warranty cards, and manual claims handling. This conventional model suffers from critical pain points:
- **Receipt Degradation & Loss**: Thermal paper receipts fade over time or get misplaced, leading to rejected valid warranty claims.
- **Fraud & Falsification**: Physical documents are susceptible to forgery and date tampering.
- **Dispute Inefficiencies**: Retailers and service centers face high administrative friction verifying authentic purchase dates, serial numbers, and policy snapshots.
- **Privacy Risks**: Traditional receipts expose full customer phone numbers, addresses, and payment details to anyone inspecting the document.

**WarranTrack** resolves these challenges by introducing a centralized, multi-tenant digital warranty platform. Built with **Spring Boot** and **React**, it enables authorized retailers to register sales and POS transactions with instant stock deduction, generate tamper-resistant digital warranty cards with dynamic QR verification codes, and manage an auditable, state-machine-driven claim lifecycle. Customers access a unified wallet of all their warranties across multiple participating merchants through a single global account.

---

## 🏛️ 2. System Architecture & Design Patterns

The platform implements a clean, layered monolithic architecture following industry-standard design patterns:

```
WarranTrack/
├── backend/                               # Spring Boot 3.2.5 (Java 17+)
│   ├── src/main/java/com/warrantrack/
│   │   ├── config/                        # SecurityConfig, MongoConfig, DataInitializer
│   │   ├── controller/                    # RESTful API Endpoints (/api/*)
│   │   ├── dto/                           # Request & Response Data Transfer Objects
│   │   ├── exception/                     # Centralized GlobalExceptionHandler
│   │   ├── model/                         # MongoDB Document Entities & Enums
│   │   ├── repository/                    # Spring Data MongoDB Repositories
│   │   ├── security/                      # JWT Token Provider, Filters, UserPrincipal
│   │   ├── service/                       # Business Logic & State Machine Services
│   │   └── util/                          # DateCalculator, EmailNormalizer, OtpUtil
│   └── src/main/resources/
│       └── application.yml                # Configuration Profiles & Database URI
│
└── frontend/                              # React 18 + TypeScript (Vite + Tailwind CSS)
    └── src/
        ├── api/                           # Centralized Axios Client & JWT Interceptor
        ├── components/                    # Layout, Navbar, Sidebar, ProtectedRoute
        ├── context/                       # AuthContext & NotificationContext
        ├── pages/
        │   ├── admin/                     # Dashboard, Retailer Applications, Customer Management
        │   ├── auth/                      # Login, Registration, OTP Verification, Password Reset
        │   ├── customer/                  # Digital Warranties, Claim Purchase, Submit Claim, Tracking
        │   ├── public/                    # Landing Page, Public QR Verification View
        │   └── retailer/                  # POS Billing, Invoice History, Products, Claims & Service
        └── types/                         # TypeScript Domain Interfaces & Enums
```

### Applied Software Design Patterns:
1. **Layered Architecture (Separation of Concerns)**: Clear boundaries between Presentation (Controllers), Business Logic (Services), Data Access (Repositories), and Persistence (MongoDB).
2. **Stateless Authentication (JWT + Spring Security)**: Secure, token-based authentication using cryptographically signed HMAC-SHA256 tokens (`jjwt`).
3. **Finite State Machine (FSM)**: Strict, deterministic lifecycle management for warranty claims preventing invalid state transitions.
4. **Data Transfer Object (DTO) Pattern**: Decouples internal database entities from external client API contracts to prevent mass assignment vulnerabilities.
5. **Observer / Scheduled Polling**: Proactive daily cron jobs for expiration alerts alongside client-side notification polling.
6. **Data Masking & Privacy Shielding**: Sensitive purchase details (serial numbers, invoice IDs) are shielded from view until email ownership is proven via OTP.

---

## 👥 3. User Roles & Functional Modules

### 🛡️ Module 1: System Administrator
- **Default Bootstrapping**: Default admin account (`admin@warrantrack.com` / `admin123`) is provisioned on system startup via `DataInitializer`.
- **Merchant Verification (KYC)**: Inspect retailer business details (Tax Registration Number, business email, physical address) and approve, reject (with mandatory reason), or suspend merchant accounts.
- **Platform Analytics**: Real-time aggregated metrics across total merchants, customers, catalog inventory, issued warranties, and platform claim volume.
- **Audit Logging**: Sensitive administrative actions are recorded in the `auditLogs` collection with actor identity and timestamps.

### 🏪 Module 2: Retailer & Point-of-Sale (POS)
- **Merchant Onboarding**: Retailers register their business and remain in `PENDING` review until approved by an administrator.
- **Product Catalog Management**: Define products with selling prices, current stock inventory, warranty duration (in Days, Months, or Years), and terms.
- **POS Billing & Checkout Terminal** (`/retailer/pos`):
  - Ring up multi-item orders supporting both warranty and non-warranty catalog goods.
  - Automatic stock validation preventing sales of out-of-stock items.
  - Real-time tax, discount, and subtotal calculation.
  - Automatically provisions `Purchase` and active `Warranty` records within an atomic database transaction.
  - Generates official invoices with printable, responsive receipts and embedded digital warranty QR passports.
- **After-Sales Service Desk**:
  - Review customer defect submissions and uploaded photo evidence.
  - Start review, request additional details, or issue formal decisions (Approve for `REPAIR` or `REPLACEMENT`, or Reject with reason).
  - Add progress service updates (`IN_PROGRESS`) and finalize with completion notes (`COMPLETED`).

### 👤 Module 3: Customer Portal
- **Single Global Account**: One login across all participating merchants.
- **Purchase Claiming & Email Verification** (`/customer/claim-purchase`):
  - When retailers record customer email at checkout, unverified purchases appear in the customer's portal with sensitive details masked.
  - The customer verifies email ownership via a **single-use, 6-digit OTP (5-minute expiry)** to link the purchase and warranty card.
- **Digital Warranty Wallet** (`/customer/warranties`):
  - Displays dynamic warranty cards with visual validity progress bars and remaining days countdown.
  - Includes a printable official **Digital Warranty Certificate** and dynamic QR modal.
- **Claim Submission & Feedback**:
  - Submit defect claims with image/file evidence directly on active warranties (inclusive expiry check).
  - Cancel pending claims while in review.
  - Rate completed repairs/replacements and provide merchant service feedback.

### 🌐 Module 4: Public QR Verification
- **URL**: `/verify/:qrToken`
- Allows service technicians or third-party buyers to scan a warranty's QR code and verify product authenticity, coverage validity dates, and authorized issuing merchant **without exposing the customer's personal contact information or internal database IDs**.

---

## ⚙️ 4. Finite State Machine (Claim Lifecycle)

Warranty claims strictly enforce a deterministic finite state machine implemented in `ClaimService.java`:

```
               ┌─────────────┐
               │  SUBMITTED  │
               └──────┬──────┘
                      │
            ┌─────────┴─────────┐
            │                   │
            ▼                   ▼
    ┌──────────────┐     ┌─────────────┐
    │ UNDER_REVIEW │     │  CANCELLED  │
    └───────┬──────┘     └─────────────┘
            │
    ┌───────┼──────────────────────────────┐
    │       │                              │
    ▼       ▼                              ▼
┌───────┐ ┌──────────────────────────┐ ┌──────────┐
│REJECTED│ │ ADDITIONAL_INFO_REQUIRED │ │ APPROVED │
└───────┘ └─────────────┬────────────┘ └────┬─────┘
                        │                   │
                        ▼ (Customer replies)│
                 [UNDER_REVIEW]             │
                                            ▼
                                     ┌─────────────┐
                                     │ IN_PROGRESS │
                                     └──────┬──────┘
                                            │
                                            ▼
                                     ┌─────────────┐
                                     │  COMPLETED  │
                                     └─────────────┘
```

**Transition Rules**:
- `SUBMITTED` &rarr; `UNDER_REVIEW` or `CANCELLED`
- `UNDER_REVIEW` &rarr; `APPROVED`, `REJECTED`, `ADDITIONAL_INFO_REQUIRED`, or `CANCELLED`
- `ADDITIONAL_INFO_REQUIRED` &rarr; `UNDER_REVIEW` (when customer submits requested evidence)
- `APPROVED` &rarr; `IN_PROGRESS` or `COMPLETED`
- `IN_PROGRESS` &rarr; `COMPLETED`

---

## 🗄️ 5. Database Schema & Collections

| Collection | Key Fields | Purpose |
| :--- | :--- | :--- |
| **`users`** | `name`, `email`, `emailNormalized` (unique), `passwordHash`, `role`, `emailVerified`, `accountStatus` | System user credentials, identity, and role access control |
| **`retailers`** | `userId` (unique), `businessName`, `registrationNumber`, `approvalStatus`, `contactEmail`, `address` | Merchant profiles and KYC approval status |
| **`products`** | `retailerId`, `name`, `brand`, `model`, `warrantyDuration`, `warrantyUnit`, `stockQuantity`, `price` | Retail product catalog and inventory levels |
| **`purchases`** | `retailerId`, `purchaseReference` (compound unique), `serialNumber`, `invoiceNumber`, `customerEmailNormalized` | Unified sales ledger across all transactions |
| **`warranties`** | `purchaseId` (unique), `retailerId`, `customerId`, `startDate`, `expiryDate`, `qrToken` (unique), `termsSnapshot` | Digital warranty cards and cryptographic QR tokens |
| **`bills`** | `invoiceNumber` (unique), `retailerId`, `customerEmail`, `items[]`, `subtotal`, `taxAmount`, `grandTotal` | Official retail tax invoices and POS receipts |
| **`claims`** | `warrantyId`, `purchaseId`, `retailerId`, `customerId`, `currentStatus`, `resolutionType`, `serviceNotes[]` | Defect repair/replacement claims and dispute tracking |
| **`claimStatusHistories`** | `claimId`, `previousStatus`, `newStatus`, `changedBy`, `note`, `changedAt` | Immutable chronological audit timeline of all claim transitions |
| **`notifications`** | `userId`, `type`, `message`, `relatedEntityId`, `isRead`, `createdAt` | Real-time alerts for customers and merchants |
| **`auditLogs`** | `actorId`, `actorEmail`, `action`, `targetType`, `targetId`, `details`, `timestamp` | Security and administrative audit log |

---

## 🚀 6. Step-by-Step Installation & Setup

### Prerequisites
- **Java Development Kit (JDK) 17+**
- **Apache Maven 3.8+**
- **Node.js 18+** & **npm**
- **MongoDB Atlas** (cloud database)

### Step 1: Clone & Configure Backend
```bash
cd backend
```
Configure the MongoDB Atlas URI in `backend/.env` using the template in `backend/.env.example`. The backend requires `SPRING_DATA_MONGODB_URI` and does not connect to a local MongoDB instance.

To enable the natural-language WarranTrack chatbot, set these variables in `backend/.env`:

```env
OPENAI_API_URL=https://api.openai.com/v1/chat/completions
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-4o-mini
```

The assistant uses an OpenAI-compatible chat completions API, reads only account-scoped WarranTrack data, restricts tools by user role, and requires confirmation before executing mutations. The user's chat messages and the minimum account context needed for a request are sent to the configured AI provider; do not enter passwords, OTPs, or payment details.

### Step 2: Run Spring Boot Backend
```bash
mvn spring-boot:run
```
- The backend server will start at: **`http://localhost:8080`**
- Automatic seed data initializes the administrator:
  - **Email**: `admin@warrantrack.com`
  - **Password**: `admin123`

> **Note on OTP Delivery (Demo vs. SMTP)**:
> External email credentials are not required for demonstration. Verification OTP codes are **logged directly in the backend terminal console** (`🔐 VERIFICATION OTP FOR ...: XXXXXX`) and displayed in the frontend with a 1-click **"Auto-fill Code"** button.

### Step 3: Run React Frontend
```bash
cd frontend
npm install
npm run dev
```
- The client application will be accessible at: **`http://localhost:5173`**

---

## 🎓 7. Project Defense / Viva Voce Q&A Guide

### Q1: Why did you choose MongoDB instead of a traditional relational database (MySQL/PostgreSQL)?
**Answer**: Warranties require **immutable snapshots of terms and product attributes at the exact time of purchase**. In a relational schema, if a merchant later edits a product's price, warranty policy, or description, historical warranties risk being retroactively altered unless complex audit tables are maintained. MongoDB's document model allows us to embed a complete terms snapshot and line-item details directly inside the `Warranty` and `Bill` documents. Additionally, MongoDB easily accommodates varying product categories and attributes without requiring frequent schema migrations.

### Q2: Why use JWT stateless authentication instead of traditional HTTP Sessions?
**Answer**: HTTP sessions require the server to store session state in memory or in a shared session store (like Redis), creating horizontal scaling bottlenecks. JSON Web Tokens (JWT) are self-contained and cryptographically signed using HMAC-SHA256. The server validates the token on every request via `JwtAuthenticationFilter` without database lookups for session validation, making the architecture stateless, scalable, and ideal for decoupled Single Page Applications (React + Spring Boot REST).

### Q3: How is multi-tenancy and data isolation enforced between different retailers?
**Answer**: Multi-tenancy is enforced at both the security layer and the service layer. Rather than trusting the `retailerId` sent in request bodies (which could be spoofed), the backend extracts the authenticated user ID directly from the validated JWT `UserPrincipal` inside Spring Security's context. Service queries always scope database operations by the verified `retailerId`, ensuring a merchant cannot view, modify, or approve claims belonging to another business.

### Q4: How does the system prevent duplicate claims on the same item?
**Answer**: When a customer submits a claim, `ClaimService` checks if any claim currently exists for that `warrantyId` with an active status (`SUBMITTED`, `UNDER_REVIEW`, `ADDITIONAL_INFO_REQUIRED`, `APPROVED`, or `IN_PROGRESS`). If an active claim is already underway, subsequent submissions are blocked with a `400 Bad Request` until the existing claim is resolved or cancelled.

### Q5: How is customer privacy safeguarded during public QR verification?
**Answer**: Each warranty record generates a unique, non-sequential UUID `qrToken`. The public verification endpoint (`/api/public/warranties/verify/{qrToken}`) returns a specialized DTO (`PublicWarrantyResponse`) that exposes only non-sensitive validity information: product brand, model, coverage start date, expiry date, current validity status, and retailer business name. The customer's full name, email, phone number, invoice number, and internal database IDs are strictly omitted from this response.
