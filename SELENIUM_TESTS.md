# WarranTrack - Automated Selenium E2E Test Suite

This directory contains the complete automated **End-to-End (E2E) Selenium 4** test suite for WarranTrack, built using the **Page Object Model (POM)** pattern with **JUnit 5** and **Maven**.

---

## 1. Architecture & Design Pattern

The test suite is structured following Page Object Model principles for maintainability, readability, and separation of concerns:

```
backend/src/test/java/com/warrantrack/e2e/
├── config/
│   └── TestConfig.java             # Runtime options (base URL, browser, headless flag, timeouts)
├── base/
│   └── BaseE2ETest.java            # WebDriver setup, SeleniumManager integration, clean teardown
├── pages/                          # Encapsulated Page Objects (selectors & user actions)
│   ├── BasePage.java               # Reusable explicit wait helpers, click, type, and verification
│   ├── LandingPage.java            # Public hero, navigation, dark/light theme switcher
│   ├── LoginPage.java              # Authentication login form, session errors, links
│   ├── RegisterCustomerPage.java   # Customer registration & client validation
│   ├── RegisterRetailerPage.java   # Retailer merchant application & business info
│   ├── ForgotPasswordPage.java     # Email submission, 6-digit OTP verification & password reset
│   ├── CustomerDashboardPage.java  # Customer portal navigation, stat cards
│   ├── CustomerWarrantiesPage.java # Digital warranty cards & QR passport modal
│   ├── RetailerDashboardPage.java  # Retailer metrics and quick links
│   ├── RetailerPosPage.java        # POS Billing, customer lookup, serial numbers & invoice
│   ├── RetailerProductsPage.java   # Product catalog creation & management
│   ├── AdminDashboardPage.java     # Admin platform dashboard
│   └── PublicVerifyPage.java       # Public QR verification certificate (/verify/:token)
└── tests/                          # Automated Test Scenarios
    ├── AuthE2ETest.java            # Landing, Theme switching, Login, Register, Forgot Password
    ├── CustomerFlowE2ETest.java    # Protected routes & Customer portal workflows
    ├── RetailerFlowE2ETest.java    # Protected routes & Retailer POS/Products workflows
    ├── AdminFlowE2ETest.java       # Protected routes & Admin management workflows
    └── PublicVerifyE2ETest.java    # Public QR warranty verification screen
```

---

## 2. Prerequisites

1. **Frontend Running:**
   ```bash
   cd frontend
   npm run dev
   # Ensure frontend is reachable at http://localhost:5173
   ```
2. **Backend Running:**
   ```bash
   cd backend
   mvn spring-boot:run
   # Ensure backend is reachable at http://localhost:8080
   ```
3. **Browser Installed:** Google Chrome or Microsoft Edge (Selenium 4's built-in `SeleniumManager` will automatically manage driver binaries).

---

## 3. Running the Tests

### Run All Selenium E2E Tests (Headless by Default)
```bash
mvn test -f backend/pom.xml -P e2e
```

### Watch the Tests Live in a Visible Browser (`headless=false`)
```bash
mvn test -f backend/pom.xml -P e2e -De2e.headless=false
```

### Run a Specific Test Class
```bash
# Run Auth and Registration tests
mvn test -f backend/pom.xml -P e2e -Dtest=AuthE2ETest

# Run Customer Portal tests
mvn test -f backend/pom.xml -P e2e -Dtest=CustomerFlowE2ETest

# Run Retailer POS & Products tests
mvn test -f backend/pom.xml -P e2e -Dtest=RetailerFlowE2ETest

# Run Admin Platform tests
mvn test -f backend/pom.xml -P e2e -Dtest=AdminFlowE2ETest

# Run Public QR Verification tests
mvn test -f backend/pom.xml -P e2e -Dtest=PublicVerifyE2ETest
```

### Custom Configurations
You can override settings via CLI flags or environment variables:

| Flag | Default | Description |
| :--- | :--- | :--- |
| `-De2e.base.url=...` | `http://localhost:5173` | Target frontend URL (local or staging) |
| `-De2e.browser=...` | `chrome` | Browser choice (`chrome` or `edge`) |
| `-De2e.headless=...` | `true` | Run without GUI window (`true` or `false`) |
| `-De2e.explicit.wait.sec=...` | `12` | Explicit element wait timeout in seconds |

Example:
```bash
mvn test -f backend/pom.xml -P e2e -De2e.browser=edge -De2e.headless=false -De2e.base.url=http://localhost:5173
```

---

## 4. Running from an IDE (IntelliJ IDEA / VS Code / Eclipse)

Because tests are standard JUnit 5 test classes:
1. Open the project in your IDE.
2. Navigate to `backend/src/test/java/com/warrantrack/e2e/tests/`.
3. Right-click any test file (e.g. `AuthE2ETest.java`) and select **Run 'AuthE2ETest'**.
4. You can pass VM arguments (e.g. `-De2e.headless=false`) in your IDE's Run Configuration if you wish to see the browser window.
