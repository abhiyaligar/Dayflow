# Dayflow - Human Resource Management System

Dayflow is a modern, custom-built Human Resource Management System (HRMS) designed to streamline employee onboarding, profiles, daily/weekly attendance logs, leave management, and salary reviews.

---

## 🚀 Tech Stack

*   **Frontend**: React (with TypeScript & TSX) styled with Tailwind CSS (Stable v3).
*   **Backend**: FastAPI (Python 3.10+) utilizing SQLAlchemy.
*   **Database**: PostgreSQL with schema management via **Alembic**.
*   **Authentication**: Custom JWT authentication and authorization.

---

## 📂 Project Directory Structure

```text
dayflow/
├── backend/                    # FastAPI Backend & Database Migrations
│   ├── alembic/                # Database migration scripts and configuration
│   │   ├── versions/           # Versioned schema migration files
│   │   ├── env.py              # Alembic environment and connection setup
│   │   └── script.py.mako      # Template for generating new migrations
│   ├── app/                    # Main FastAPI Application
│   │   ├── api/                # API Endpoints & Route Definitions
│   │   │   ├── v1/             # Version 1 API routers
│   │   │   │   ├── attendance.py  # Check-in, check-out, and break logging
│   │   │   │   ├── auth.py        # Login, logout, and password management
│   │   │   │   ├── employees.py   # Employee profiles, onboarding, and details
│   │   │   │   ├── leaves.py      # Leave requests, applications, and status updates
│   │   │   │   └── payroll.py     # Payroll calculation pipelines & payslips
│   │   │   └── deps.py         # FastAPI dependency injections (DB session, security)
│   │   ├── core/               # App Configuration & Utilities
│   │   │   ├── config.py       # Pydantic environment configurations & DB url parser
│   │   │   ├── security.py     # Password hashing (bcrypt) and JWT auth token helpers
│   │   │   └── storage.py      # AWS S3 wrapper for document management (onboarding files)
│   │   ├── db/                 # Database utilities
│   │   │   └── seed.py         # DB seeding script for default master roles and admin
│   │   ├── models/             # SQLAlchemy ORM Data Models
│   │   │   ├── attendance.py   # Attendance schema model
│   │   │   ├── document.py     # Onboarding document schema model
│   │   │   ├── employee.py     # Detailed profile schema model
│   │   │   ├── leave.py        # Leave request schema model
│   │   │   ├── salary.py       # Salary component structure schema model
│   │   │   └── user.py         # Login user schema model
│   │   ├── schemas/            # Pydantic Schemas (Request/Response validation)
│   │   │   ├── attendance.py   # Attendance payload schemas
│   │   │   ├── auth.py         # Login & credentials validation schemas
│   │   │   ├── document.py     # Document payload schemas
│   │   │   ├── employee.py     # Onboarding and profile payload schemas
│   │   │   ├── leave.py        # Leave request payload schemas
│   │   │   └── salary.py       # Salary structure components & calculations schemas
│   │   ├── database.py         # Database engine setup and local session generator
│   │   └── main.py             # FastAPI App Entrypoint (Middleware, routers, CORS)
│   ├── tests/                  # Backend Pytest Test Suite
│   │   ├── conftest.py         # Isolated database configuration & test fixtures
│   │   └── test_endpoints.py   # Integration tests for endpoints
│   ├── alembic.ini             # Alembic migration script setup
│   ├── pytest.ini              # Pytest configuration definitions
│   ├── requirements.txt        # Python pip package dependencies
│   └── runtime.txt             # Deployment target runtime (Python version)
├── frontend/                   # React + TypeScript + Tailwind CSS Frontend
│   ├── public/                 # Static assets directory
│   ├── src/                    # Source React application
│   │   ├── assets/             # SVG and image assets
│   │   ├── App.css             # Tailwind UI components and custom animations
│   │   ├── App.tsx             # Core app router, state handling, & dashboards
│   │   ├── index.css           # Global CSS and Tailwind imports
│   │   └── main.tsx            # Vite root entrypoint rendering the virtual DOM
│   ├── package.json            # Node project configuration & dependencies
│   ├── postcss.config.js       # PostCSS plugins configuration (Autoprefixer)
│   ├── tailwind.config.js      # Tailwind CSS utilities configuration
│   └── vite.config.ts          # Vite builder configurations
├── docs/                       # Technical Project Documentation
│   ├── architecture.md         # High-level architecture and backend workflows
│   ├── database_architecture.md# PostgreSQL relational schema and indexes architecture
│   ├── api_reference.md        # Endpoint documentation & role access matrix
│   └── prd.md                  # Product Requirements & Feature workflows
├── README.md                   # Root repository documentation (this file)
└── Dayflow - Human Resource Management System.pdf # System specification guide document
```

---

## 📖 Project Documentation

Detailed plans and architectures are stored within the [`docs/`](file:///C:/Users/91974/desktop/dayflow/docs) directory:

1.  **[Product Requirements Document (PRD)](file:///C:/Users/91974/desktop/dayflow/docs/prd.md)**: Product details, workflows, user stories, and features.
2.  **[System Architecture](file:///C:/Users/91974/desktop/dayflow/docs/architecture.md)**: Folder structures, execution paths, modules, and API guidelines.
3.  **[Database Architecture](file:///C:/Users/91974/desktop/dayflow/docs/database_architecture.md)**: PostgreSQL schemas, relationships, constraints, indexes, and Alembic setup.
4.  **[API Reference](file:///C:/Users/91974/desktop/dayflow/docs/api_reference.md)**: Details on endpoints, parameters, requests, responses, and authorization tiers.


---

## ⚙️ Quick Start

### 1. Prerequisites
*   Node.js (v18+) & npm/pnpm/yarn
*   Python (v3.10+) & virtualenv
*   A running PostgreSQL instance

### 2. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables (create a `.env` file):
   ```env
   DATABASE_URL=postgresql+asyncpg://<username>:<password>@<host>:<port>/<dbname>
   SECRET_KEY=your-jwt-signing-secret
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ```
5. Apply database migrations:
   ```bash
   alembic upgrade head
   ```
6. Run the integration test suite:
    ```bash
    # Run tests on an isolated in-memory SQLite database
    python -m pytest -v
    ```
7. Start the development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *Documentation will be accessible at `http://127.0.0.1:8000/docs`.*

### 3. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (create a `.env` file):
   ```env
   VITE_API_URL=http://127.0.0.1:8000/api/v1
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser.*
