# Project Structure

## Project type
Full-stack monorepo-style web application with separate backend and frontend applications.

## Top-level modules
- `backend/`: Spring Boot 3.2.5 REST API and MongoDB persistence.
- `frontend/`: React 18 single-page application built with Vite and TypeScript.
- `DESIGN.md`, `README.md`, `SELENIUM_TESTS.md`: project specification, setup, and test documentation.
- `.github/modernize/rearchitecture/artifacts/`: architecture analysis outputs.

## Backend layers
- Entry point: `backend/src/main/java/com/warrantrack/WarranTrackApplication.java`
- Config: `backend/src/main/java/com/warrantrack/config/`
- Controllers: `backend/src/main/java/com/warrantrack/controller/`
- DTOs: `backend/src/main/java/com/warrantrack/dto/`
- Services: `backend/src/main/java/com/warrantrack/service/`
- Repositories: `backend/src/main/java/com/warrantrack/repository/`
- MongoDB documents: `backend/src/main/java/com/warrantrack/model/`
- Security: `backend/src/main/java/com/warrantrack/security/`
- Exceptions: `backend/src/main/java/com/warrantrack/exception/`
- Utilities: `backend/src/main/java/com/warrantrack/util/`

Source counts: approximately 156 Java/source/resource files under `backend/src`, with 13 controller classes and 16 service classes.

## Frontend layers
- Entry point: `frontend/src/main.tsx`
- Application routes: `frontend/src/App.tsx`
- API client: `frontend/src/api/client.ts`
- Context providers: `frontend/src/context/`
- Shared components: `frontend/src/components/`
- Role pages: `frontend/src/pages/admin/`, `frontend/src/pages/retailer/`, `frontend/src/pages/customer/`, `frontend/src/pages/auth/`, `frontend/src/pages/public/`
- Domain types: `frontend/src/types/index.ts`
- Utilities: `frontend/src/utils/`

Source count: 51 files under `frontend/src`.

## Functional areas
- Authentication and account lifecycle
- Retailer onboarding and KYC status
- Product catalog and stock management
- POS purchase, bill, warranty creation
- Customer purchase discovery and email linking
- Digital warranty wallet and public QR verification
- Claim submission and retailer service workflow
- Notifications and audit logging
- Platform and retailer analytics
- Scheduled warranty expiration reminders

## Runtime entry points
- Backend Spring application starts from `WarranTrackApplication`.
- Frontend starts from `main.tsx` and mounts `App`.
- Scheduled reminders are discovered by Spring annotation scanning from `@Scheduled`.
- JWT authentication is wired in `SecurityConfig` and `JwtAuthenticationFilter`.
