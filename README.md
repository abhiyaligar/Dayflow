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
├── backend/            # FastAPI Backend & Database Migrations
├── frontend/           # React + TypeScript + Tailwind CSS Frontend
├── docs/               # Technical Documentation
│   ├── architecture.md
│   ├── database_architecture.md
│   ├── api_reference.md
│   └── prd.md
└── README.md           # Root repository guide (this file)
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
6. Start the development server:
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
