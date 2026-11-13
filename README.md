# Digital Warranty & After-Sales

A web-based warranty and after-sales management system developed as a university academic project. The system aims to help customers manage product warranties, allows retailers to register products and warranties, and enables administrators to manage the overall platform.

## 1. Project Overview

The **Digital Warranty & After-Sales** platform is designed to simplify the process of managing product warranties and after-sales services. Instead of maintaining paper warranty cards and manually tracking warranty periods, users will be able to manage warranty information through a single web application.

The platform is designed to provide separate dashboards and functionalities for three types of users:

- **Customer**
- **Retailer**
- **Administrator**

## 2. Project Objectives

- To provide a centralized platform for managing product warranties.
- To allow customers to register and track their product warranties.
- To enable retailers to manage product and warranty information.
- To allow administrators to monitor and manage platform activities.
- To reduce the use of paper-based warranty documents.
- To provide a simple and user-friendly interface.
- To improve warranty tracking and after-sales service management.

## 3. Project Development Status

This project is currently under development.

The Digital Warranty & After-Sales platform is planned to be developed using React.js for the frontend, Spring Boot for the backend, and MongoDB for database management.

### Development Progress

- [x] Project planning and requirement analysis
- [x] Low-fidelity wireframe design
- [x] Frontend development
- [ ] Backend development using Spring Boot
- [ ] MongoDB database integration
- [ ] Frontend and backend integration
- [ ] Authentication and authorization
- [ ] Testing and debugging
- [ ] Final deployment

**Note:** The above checklist represents the current development plan. Items should be marked as completed only after they have actually been implemented and tested. This README will be updated as the project progresses.

## 4. User Roles and Planned Functionalities

### Customer

- Register and log in to the platform.
- View customer dashboard.
- Manage personal profile.
- Register purchased products.
- View product details and warranty information.
- Track warranty expiration dates.
- Submit warranty claims.
- View claim status.

### Retailer

- Log in to the retailer dashboard.
- Manage retailer profile.
- Add and manage products.
- Register product sales.
- Generate or assign warranty information.
- View relevant warranty records.

### Administrator

- Log in to the administrator dashboard.
- View platform statistics.
- Manage customers.
- Manage retailers.
- Manage products.
- Monitor warranty records.
- Manage warranty claims.
- Monitor overall system activities.

*These are planned functionalities and may change during development.*

## 5. Technology Stack

The following technologies are planned for this project.

### Frontend

- React.js
- Vite
- JavaScript
- Tailwind CSS
- React Router DOM
- Axios
- React Hook Form
- Zod
- Recharts
- Lucide React

### Backend

- Java
- Spring Boot
- Spring Web
- Spring Security
- Spring Data MongoDB
- Spring Validation
- Spring Boot Mail
- JWT Authentication
- Maven

### Database

- MongoDB
- MongoDB Atlas (optional)

### Testing

- JUnit 5
- Mockito
- Spring Boot Test
- Vitest
- React Testing Library

## 6. Proposed System Architecture

The application is planned to follow a simple three-layer architecture.

```text
          USER
           |
           v
   REACT FRONTEND
           |
           | REST API (Axios)
           v
    SPRING BOOT BACKEND
           |
           v
       MONGODB
```

### Frontend Layer

Provides the user interface and will communicate with the backend through REST APIs.

### Backend Layer

Will handle business logic, authentication, authorization, validation, and API requests.

### Database Layer

Will store user accounts, product details, warranty information, claims, and other application data.

## 7. Proposed Project Folder Structure

### Frontend

```text
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── services/
│   ├── hooks/
│   ├── context/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── vite.config.js
```

### Backend

```text
backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── digitalwarranty/
│   │   │           ├── config/
│   │   │           ├── controller/
│   │   │           ├── dto/
│   │   │           ├── model/
│   │   │           ├── repository/
│   │   │           ├── security/
│   │   │           ├── service/
│   │   │           └── DigitalWarrantyApplication.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
├── pom.xml
└── mvnw
```

*These are proposed structures. The actual folder structure may change during implementation.*

## 8. Installation and Setup

### Prerequisites

The following software is expected to be required:

- Node.js and npm
- Java JDK 25
- Maven
- MongoDB
- Git
- Visual Studio Code or IntelliJ IDEA

### Step 1: Clone the Repository

```bash
git clone https://github.com/SCSSA-UoK/FSSD-24-25-G03-Digital-Warranty.git
```

Navigate to the project folder:

```bash
cd FSSD-24-25-G03-Digital-Warranty
```

### Step 2: Configure MongoDB

MongoDB integration is planned for the backend.

Once the backend is implemented, configure the database connection in the backend `application.properties` file.

Example configuration:

```properties
spring.data.mongodb.uri=${MONGODB_URI}
spring.data.mongodb.database=digital_warranty
```

### Step 3: Run the Backend

The Spring Boot backend is planned to be developed inside the `backend` folder.

After backend implementation, it can be started using:

```bash
cd backend
mvn spring-boot:run
```

### Step 4: Run the Frontend

Once the frontend setup is available, navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal to access the application.

*The above commands describe the planned setup. They will become usable after the corresponding project files and configurations are implemented.*

## 9. Environment Variables

Sensitive information should be stored in environment variables instead of hardcoding it in the source code.

Example backend environment variables:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_email_app_password
```

Example frontend environment variable:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

**Important:** Do not upload passwords, database credentials, JWT secrets, or other sensitive information to GitHub.

## 10. Planned Database Collections

The following MongoDB collections are proposed for the application:

| Collection      | Purpose                          |
| --------------- | -------------------------------- |
| users           | Store user account details       |
| products        | Store product information        |
| warranties      | Store warranty details           |
| warranty_claims | Store warranty claim information |
| retailers       | Store retailer details           |

The final collection structure will be determined during backend and database implementation.

## 11. Planned Security Features

The application is intended to include:

- JWT-based authentication.
- Spring Security for backend security.
- Role-based access control.
- Password encryption.
- Input validation.
- Protected API endpoints.
- Environment variables for sensitive configurations.

## 12. Testing

Testing will be carried out after the frontend and backend functionalities have been implemented.

Planned testing tools:

- JUnit 5
- Mockito
- Spring Boot Test
- Vitest
- React Testing Library

Testing instructions will be updated when the actual test configurations are available.

## 13. Future Enhancements

- QR code-based warranty registration.
- Email notifications for warranty expiration.
- Downloadable digital warranty certificates.
- Advanced warranty analytics.
- Mobile application support.
- Online retailer integration.

## 14. Project Purpose

This project is developed as a university academic software development project to demonstrate practical knowledge of frontend development, backend development, database management, REST API integration, and software engineering concepts.

## 15. Authors

**Project Name:** Digital Warranty & After-Sales

**Project Type:** University Academic Project

**Frontend:** React.js

**Backend:** Spring Boot

**Database:** MongoDB

---

**Project Status:** Currently Under Development.

**Note:** This README describes the proposed design, technologies, and development plan. It will be updated as the actual features are implemented, tested, and completed.
