# Employee Onboarding Portal

**Project Overview**: A full-stack application to streamline employee onboarding, featuring self-service profiles, HR management tools, and an MCP-like microservice endpoint.

## Live Application URLs

You can access the application via the primary AWS deployment or the original Vercel deployment:

**AWS Deployment (Primary)**:
* **Frontend**: [https://main.dxa09zw2vspkc.amplifyapp.com/](https://main.dxa09zw2vspkc.amplifyapp.com/)
* **Backend API**: [https://afjv3mpzaq.us-east-1.awsapprunner.com/](https://afjv3mpzaq.us-east-1.awsapprunner.com/)

**Vercel Deployment (Original/Alternative)**:
* **Frontend**: [https://miq-assessment.vercel.app/](https://miq-assessment.vercel.app/)
* **Backend API**: [https://backend-eight-ivory-36.vercel.app/](https://backend-eight-ivory-36.vercel.app/)

*(Note: The project specification preferred AWS deployment, which is now the primary deployment. The Vercel deployment was used initially and is kept for reference or alternative access.)*

## 1. Core Functionalities Implemented
(As per "US Developer - Panel Project.docx")

* **Employee Profile Management**: Page for new employees to create/edit their profiles (personal info, job title, department, contact details).
* **Login Page**: Secure user authentication.
* **Employee Landing Page**: Displays the employee's personal details.
* **HR Confidential Information Page**: Allows HR to update salary, visible only to authorized roles (HR, employee, manager line).
* **HR Non-Confidential Information Page**: Allows HR to create/edit other employee details.
* **Microservice Endpoint**:
    * Retrieves employee details by ID or name.
    * Designed with an MCP-like architecture for internal integrations/agentic workflows.
    * Includes a frontend demo page (`/mcp-demo`) for this endpoint.

## 2. Tech Stack Utilized

* **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, React Router, Zod, React Hook Form.
* **Backend**: Python 3.11, FastAPI, Pydantic, Supabase (PostgreSQL), `supabase-python`, JWT (`python-jose`), `passlib[bcrypt]`.
* **Database**: Supabase (PostgreSQL).
* **Deployment Platforms**:
    * AWS: Amplify Hosting (Frontend), App Runner (Backend).
    * Vercel: Frontend & Backend (Python serverless functions).
* **Version Control**: Git & GitHub.

## 3. Development Environment Setup Guide

### Prerequisites
* Node.js (v18+), npm (v9+)
* Python 3.11 (see `backend/runtime.txt`)
* Git
* Supabase Account & Project

### Backend Setup
1.  Clone repository: `git clone <your-repo-url>`
2.  Navigate: `cd employee-onboarding-portal/backend`
3.  Create venv: `python -m venv venv && source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
4.  Install deps: `pip install -r requirements.txt`
5.  Environment Vars: Copy `backend/.env.example` to `backend/.env`. Fill in:
    * `SUPABASE_URL` & `SUPABASE_KEY` (service_role key recommended)
    * `JWT_SECRET` (a strong, unique key)
    * `ALLOWED_ORIGINS="http://localhost:5173,https://main.dxa09zw2vspkc.amplifyapp.com,https://miq-assessment.vercel.app"` (Update with your frontend URLs)
6.  Run: `uvicorn app.main:app --reload --port 8000`

### Frontend Setup
1.  Navigate: `cd employee-onboarding-portal/frontend`
2.  Install deps: `npm install`
3.  Environment Vars: Create `frontend/.env.local` (or `.env`). Add:
    * For AWS Backend: `VITE_API_BASE_URL=https://afjv3mpzaq.us-east-1.awsapprunner.com`
    * For Vercel Backend: `VITE_API_BASE_URL=https://backend-eight-ivory-36.vercel.app`
    * For Local Development: `VITE_API_BASE_URL=http://localhost:8000`
4.  Run: `npm run dev` (Usually available at `http://localhost:5173`)

### Supabase Database Setup
1.  Create a new project on [Supabase](https://supabase.com/).
2.  Use the SQL Editor in Supabase to create the `employees` table. Schema example:
    ```sql
    CREATE TABLE employees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        job_title TEXT NOT NULL,
        department TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'employee', -- e.g., 'employee', 'hr', 'manager', 'admin'
        salary NUMERIC(10, 2),
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    -- Optional: Trigger for updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$BEGIN NEW.updated_at = now(); RETURN NEW; END;$$ language 'plpgsql';
    CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    -- Consider Row Level Security (RLS) for fine-grained access control if using client-side Supabase calls,
    -- though this project primarily handles authorization in the backend API.
    ```
3.  Retrieve your Supabase Project URL and API keys for the `.env` files.

## 4. Architectural Design Highlights

* **Full-Stack Application**: Decoupled frontend (React/Vite) and backend (Python/FastAPI).
* **API-Driven**: Frontend interacts with the backend via RESTful APIs.
* **MCP-like Microservice**: The `/employees/api/mcp` endpoint uses a Model-Context-Protocol approach for structured inter-service communication, detailed in `backend/app/models/mcp.py` and `backend/app/routers/employees.py`.
* **Authentication**: JWT-based token authentication managed by the backend.
* **Database**: Supabase (PostgreSQL) serves as the data store.

## 5. Deployment Platforms

### AWS (Primary Deployment)
* **Frontend**: AWS Amplify Hosting, connected to the GitHub repository for CI/CD.
* **Backend**: AWS App Runner, deploying a containerized FastAPI application from an image stored in Amazon ECR (Elastic Container Registry).
    * The Dockerfile for backend containerization is located at `backend/Dockerfile`.
    * The GitHub Actions workflow in `.github/workflows/aws-deploy.yml` handles building the Docker image, pushing it to ECR, and triggering the App Runner deployment.

### Vercel (Original/Alternative Deployment)
* **Frontend & Backend**: Both deployed on Vercel.
    * Frontend build command: `npm run build`.
    * Backend: Deployed as Python serverless functions (see `backend/vercel.json`).
    * Vercel's GitHub integration handles CI/CD from the `main` branch for this deployment.

## 6. CI/CD Process

* **Source Control**: GitHub, feature-branch workflow.
* **Continuous Integration (CI)**: GitHub Actions triggered on PRs and pushes to the `main` branch.
    * Linting (ESLint for frontend, Python linters for backend).
    * Automated testing (`pytest` for backend; frontend tests planned).
* **Continuous Deployment (CD)**:
    * **AWS (Primary)**:
        * Frontend (AWS Amplify): Automatically deploys the `main` branch to the production URL. Pull Request previews are also automatically built and deployed by Amplify.
        * Backend (AWS App Runner): The GitHub Actions workflow (`.github/workflows/aws-deploy.yml`) builds and pushes the Docker image to ECR on pushes to `main`, then triggers a new deployment on AWS App Runner.
    * **Vercel (Alternative)**: Vercel's native GitHub integration deploys the `main` branch to its respective production URLs and creates preview deployments for PRs.
* **Goal**: Rapid, reliable delivery of features with quality assurance.

## 7. Coding Practices & Future Maintenance Plan

* **Modern Standards**: Adherence to established coding practices for Python (PEP 8 via formatters like Black) and TypeScript/React (ESLint rules, component-based architecture).
* **Linting & Formatting**: Automated checks in CI (GitHub Actions) and recommended pre-commit hooks. (Frontend ESLint: `frontend/eslint.config.js`).
* **Testing**: Backend API tests (`backend/tests/`) provide coverage for critical paths. Frontend testing planned.
* **Future Additions (with Vibe-Coding)**:
    1.  **Clear Specs**: Features well-defined before AI coding.
    2.  **Developer Oversight**: Human review and understanding of all AI-generated code is mandatory.
    3.  **Incremental Integration**: Use AI for specific tasks/boilerplate, not end-to-end features without scrutiny.
    4.  **Rigorous Testing & Linting**: AI-generated code held to the same (or higher) standards.
    5.  **Knowledge Sharing**: Team understanding of new patterns introduced by AI.

## 8. PR Approval Process

1.  **Feature Branch Development**: All work on separate branches.
2.  **Pull Request (PR) to `main`**: Include clear description and testing notes.
3.  **Automated CI Checks**: Linting, tests, and build must pass.
4.  **Peer Code Review**: At least one other developer reviews for correctness, clarity, security, and adherence to standards. AI-assisted code requires thorough explanation by the author.
5.  **Merge**: After CI passes and review approval. Prefer squash merges.
6.  **Automated Deployment**: Triggered by merge to `main` via AWS Amplify/GitHub Actions (for AWS) and Vercel integration (for Vercel).

## 9. Security Best Practices Implemented

* **Authentication**: JWTs with expiry, bcrypt password hashing.
* **Authorization**: Backend role-based access control for sensitive operations.
* **Input Validation**: Pydantic (backend) and Zod (frontend). [cite: 13, 14]
* **Secrets Management**: Environment variables for sensitive data (GitHub Actions secrets, Amplify/App Runner environment variables, Vercel environment variables).
* **CORS**: Configured on the backend (FastAPI) and via platform settings to restrict origins.
* **HTTPS**: Handled by AWS Amplify, AWS App Runner, and Vercel.
* **Dependency Awareness**: Regular updates are part of good practice.

## 10. Overall User Experience

* **Clarity**: Intuitive navigation and role-specific views.
* **Responsiveness**: Tailwind CSS for adaptability across devices. [cite: 5]
* **Feedback**: Loading indicators, success/error toasts (`sonner`), form validation.
* **Accessibility**: Foundational support via shadcn/ui components. [cite: 5]
