# Employee Onboarding Portal

A full-stack application designed to streamline the employee onboarding process. It provides self-service profile management for new employees, an HR portal for managing employee data (including confidential information), and a microservice for internal data retrieval.

## Core Features

-   🔐 **User Authentication & Authorization:** Secure login system with JWT-based authentication and role-based access control (Employee, HR, Manager).
-   👤 **Employee Self-Service:**
    -   Create and manage personal profiles (contact details, job title, department).
    -   View personal details on a dedicated landing page.
-   🛠️ **HR Management Portal:**
    -   Create new employee accounts and manage roles.
    * Edit non-confidential information for any employee.
    * Update confidential salary information (with restricted visibility).
-   🔌 **Microservice Endpoint:**
    -   Retrieve comprehensive (non-confidential) employee details by employee ID or name for internal system integration.
-   🚀 **Cloud Deployment:**
    -   Application deployed to AWS, utilizing Supabase for the database backend.

## Tech Stack

### Frontend (Planned)
-   **Framework/Library:** React 18 with TypeScript
-   **UI Components:** Tailwind CSS & shadcn/ui
-   **State Management (Server):** TanStack Query (React Query)
-   **State Management (Client/Global):** Zustand or React Context (to be decided)
-   **Form Handling & Validation:** React Hook Form & Zod
-   **Routing:** React Router
-   **Build Tool:** Vite

### Backend
-   **Framework:** Python 3.11 with FastAPI
-   **Data Validation & Serialization:** Pydantic
-   **Database:** Supabase (PostgreSQL)
-   **Database Client:** `supabase-python`
-   **Authentication:** JWT (via `python-jose`) & Password Hashing (via `passlib[bcrypt]`)
-   **Configuration:** `pydantic-settings` with `.env` files
-   **Testing:** Pytest

### Deployment & DevOps
-   **Cloud Provider:** AWS
    -   **Frontend Deployment:** AWS Amplify Hosting (planned)
    -   **Backend Deployment:** AWS App Runner (or Amazon ECS + Fargate) (planned)
    -   **Container Registry:** Amazon ECR (for backend Docker image)
-   **CI/CD:** GitHub Actions (for linting, testing, and potentially automated deployments)
-   **Version Control:** Git & GitHub
