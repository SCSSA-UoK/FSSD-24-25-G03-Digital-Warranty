# Technology Stack

## Backend
- Language: Java 17
- Framework: Spring Boot 3.2.5
- Build: Maven
- Persistence: Spring Data MongoDB
- Database: MongoDB; database name `warrantrack_db`
- Security: Spring Security, JWT via JJWT 0.12.5
- Password encoding: BCrypt
- Validation: Jakarta/Spring validation
- Email: Spring Boot Mail; SMTP defaults to Gmail
- Testing: Spring Boot Test, Spring Security Test
- Browser testing: Selenium Java 4.54.0
- Scheduler: Spring `@Scheduled`

## Frontend
- Language: TypeScript 5.7.3
- UI: React 18.3.1
- Routing: React Router DOM 6.29.0
- Build/dev server: Vite 6.2.0
- Styling: Tailwind CSS 4.0.8
- HTTP: Axios 1.8.1
- Date utilities: date-fns 4.1.0
- Icons: Lucide React 0.475.0
- QR rendering: qrcode.react 4.2.0
- Lint: oxlint 0.15.11

## Runtime/configuration
- Backend port: 8080
- Frontend dev port: 5173
- MongoDB URI: `${SPRING_DATA_MONGODB_URI}`
- JWT secret: `${JWT_SECRET}`
- JWT expiration: 86400000 ms
- Initial admin password: `${INITIAL_ADMIN_PASSWORD}`
- OTP expiry: 5 minutes
- OTP attempts: 5
- OTP resend cooldown: 60 seconds
- Warranty reminder cron: `${WARRANTY_REMINDER_CRON:0 0 9 * * ?}`
- Multipart limits: 10 MB per file/request
- CORS allowlist: `http://localhost:5173`

## Build evidence
- Backend `pom.xml` sets Java source and target to 17.
- Frontend build script: `tsc -b && vite build`.
- Backend surefire excludes the `e2e` test group by default and provides an `e2e` Maven profile.
