# Dayflow - Human Resource Management System

Dayflow is a modern, custom-built Human Resource Management System (HRMS) designed to streamline employee onboarding, profiles, daily/weekly attendance logs, leave management, and salary reviews.

---

## 🚀 Tech Stack & Design Language

*   **Design Paradigm**: Premium, flat **Swiss Minimalist Layout**.
    *   *Off-White Canvas*: `#F8F9FA` standard background, clean `#FFFFFF` card blocks.
    *   *High-Contrast Text*: Stark near-black `#111111` headings and labels.
    *   *Steel Borders*: Elegant fine outlines `#E2E8F0` with zero glows or neons.
    *   *Stable Accents*: Forest green (`#2F855A` / Present), Steel blue (`#2B6CB0` / On Leave), and Muted red (`#C53030` / Absent).
*   **Frontend**: React SPA (TypeScript & TSX) styled with Tailwind CSS (v3).
*   **Backend**: FastAPI (Python 3.10+) utilizing SQLAlchemy.
*   **Database**: PostgreSQL with schema management and migrations via **Alembic**.
*   **Storage Integration**: Integrated with Supabase S3 bucket wrapper for secure employee resume, medical certificate, and payslip uploads with correct CORS policies.
*   **Authentication**: Custom JWT authentication and authorization.

---

## 📂 Project Directory Structure

```text
dayflow/
├── backend/                    # FastAPI Backend & Database Migrations
├── frontend/                   # React + TypeScript + Tailwind CSS Frontend
├── docs/                       # Technical Project Documentation
│   ├── architecture.md         # High-level architecture, S3 integrations and backend workflows
│   ├── database_architecture.md# PostgreSQL relational schema and indexes architecture
│   ├── api_reference.md        # Endpoint documentation & role access matrix
│   └── prd.md                  # Product Requirements & Feature workflows
└── README.md                   # Root repository documentation (this file)
```

---

## 📖 Project Documentation

Detailed plans and architectures are stored within the [`docs/`](./docs) directory:

1.  **[Product Requirements Document (PRD)](./docs/prd.md)**: Product details, workflows, user stories, and features.
2.  **[System Architecture](./docs/architecture.md)**: Folder structures, execution paths, modules, S3 integration, and API guidelines.
3.  **[Database Architecture](./docs/database_architecture.md)**: PostgreSQL schemas, relationships, constraints, indexes, and Alembic setup.
4.  **[API Reference](./docs/api_reference.md)**: Details on endpoints, parameters, requests, responses, and authorization tiers.

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
   AWS_S3_ENDPOINT_URL=https://<your-supabase-id>.storage.supabase.co/storage/v1/s3
   AWS_ACCESS_KEY_ID=your-s3-access-key-id
   AWS_SECRET_ACCESS_KEY=your-s3-secret-key
   AWS_BUCKET_NAME=your-bucket-name
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
