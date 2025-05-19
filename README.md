# Employee Onboarding Portal

A full-stack application for managing employee onboarding with self-service profiles, HR management, and microservice endpoints.

## Features

- 🔐 User authentication and role-based access control
- 👤 Employee profile creation and management
- 💰 Confidential information management (visible only to HR and managers)
- 🔌 Microservice endpoint for employee data retrieval
- 🚀 AWS deployment with Supabase database integration

## Tech Stack

### Frontend
- React 18 with TypeScript
- TanStack Query for data fetching
- Zod + react-hook-form for form validation
- shadcn/ui components (Tailwind CSS-based)

### Backend
- Python FastAPI
- SQLModel ORM
- Supabase PostgreSQL database
- JWT authentication

### Deployment
- AWS Amplify (frontend)
- AWS App Runner (backend)
- GitHub Actions for CI/CD

## Getting Started

See [Setup Guide](docs/SETUP.md) for detailed instructions on setting up the development environment.

## Architecture

See [Architecture Documentation](docs/ARCHITECTURE.md) for details on system design and components.

## Development Workflow

See [PR Process](docs/PR_PROCESS.md) for information on our PR approval workflow and coding standards.
