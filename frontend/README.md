# WarranTrack - Standalone Frontend

WarranTrack is a modern digital warranty and after-sales claim management platform built with React, TypeScript, Tailwind CSS, and Vite.

This frontend is **fully workable out-of-the-box without requiring any backend server**. All API endpoints, state transitions, transactions, authentication, and audits are handled locally via an in-browser mock backend with persistent `localStorage` storage.

---

## 🚀 Quick Start

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173/` in your browser.

---

## 🔑 Pre-Seeded 1-Click Demo Accounts

On the `/login` page, you can use the **1-Click Demo Login** buttons to immediately test any persona without typing:

| Role | Email | Password | Pre-loaded Data & Features |
|---|---|---|---|
| **Platform Administrator** | `admin@warrantrack.com` | `password123` | Multi-tenant analytics dashboard, pending retailer partner reviews & approvals, registered customers list, platform claims oversight & CSV export |
| **Authorized Retailer** | `retailer@techhub.com` | `password123` | Apex Tech Hub store dashboard, POS Billing Terminal, Product Catalog with stock management, Purchase registration, Warranty issuance, Claims review & service progress updates |
| **Verified Customer** | `customer@example.com` | `password123` | Active & expired digital warranty cards, QR code verification modals, Printable PDF certificate, Claim filing with photo upload, Live service progress tracking & 5-star reviews |

*Tip: You can also register a brand new customer or retailer account at any time!*

---

## ✨ Features Working in Standalone Mode

1. **Point of Sale (POS) Billing Terminal (`/retailer/pos`)**:
   - Add catalog products with real-time inventory validation.
   - Add custom line items with or without warranty.
   - Enter serial numbers (S/N) and customer information.
   - Calculate subtotal, discount, tax, and grand total.
   - Auto-issue tamper-evident digital warranty records and QR codes on checkout.
   - Print receipts with embedded QR warranty codes.

2. **Invoices & Billing History (`/retailer/bills`)**:
   - View past transactions and filter by customer or invoice number.
   - Re-open and print thermal/paper receipts.

3. **Public QR Warranty Verification (`/verify/:qrToken`)**:
   - Scan or click any warranty's QR code.
   - Verifies coverage status (Active vs. Expired), dates, authorized retailer, and terms snapshot without requiring login or exposing private customer information.

4. **Customer Warranty Claim Lifecycle (`/customer/claims` & `/retailer/claims`)**:
   - **Customer**: Submit claims with issue description and supporting photos.
   - **Retailer**: Start review (`UNDER_REVIEW`), request additional info from customer (`ADDITIONAL_INFO_REQUIRED`), customer can reply with details, approve for repair/replacement (`APPROVED`), add chronological service notes (`IN_PROGRESS`), and complete service (`COMPLETED`).
   - **Customer**: Rate completed service (1-5 stars) and leave customer reviews.
   - **Audit Trail**: Every state transition is recorded in chronological audit history.

5. **Customer Purchase Claiming via OTP (`/customer/claim-purchase`)**:
   - Claim unlinked purchases matching customer's email using a 6-digit verification code (`123456`).

6. **Reset Demo Data**:
   - Click the green **Standalone Mode** pill in the top navigation bar or the "Reset Data" link on the login page anytime to restore the mock database to its initial clean state.

---

## ⚙️ Connecting to a Real Backend (Optional)

If you ever wish to connect to a real backend server:

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:8080/api
VITE_USE_MOCK=false
```

When `VITE_USE_MOCK` is set to `false`, the frontend will bypass the in-memory mock engine and send genuine HTTP network requests via Axios to `VITE_API_URL`.
