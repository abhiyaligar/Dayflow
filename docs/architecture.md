# System Architecture: Dayflow HRMS

This document outlines the architectural design, directory structures, and tech stack configurations for both the Frontend and Backend of the Dayflow HRMS.

---

## 1. High-Level System Architecture

Dayflow uses a client-server architecture with a clear separation of concerns between the user interface and the business logic/persistence layer:

*   **Frontend**: A Single Page Application (SPA) built with React, TypeScript, and Tailwind CSS. It communicates with the backend via a RESTful API.
*   **Backend**: A REST API application built with FastAPI (Python 3.10+), using SQLAlchemy for Object-Relational Mapping (ORM) and Alembic for relational database migrations.
*   **Database**: PostgreSQL is used as the relational database.
*   **Object Storage**: AWS S3 compatible object storage (integrated via Supabase storage API S3 endpoints) handles document uploads (such as certificates, resumes, and text payslips).

---

## 2. Backend Architecture (FastAPI & PostgreSQL)

The backend follows a modular layer architecture to ensure maintainability, scalability, and ease of testing.

### 2.1 Technology Stack
*   **Language**: Python 3.10+
*   **Framework**: FastAPI
*   **ORM**: SQLAlchemy (async-compatible ORM)
*   **Database Migrations**: Alembic
*   **Authentication**: Custom JWT-based authentication (OAuth2 Password Bearer flow)
*   **Database**: PostgreSQL
*   **File Storage**: Boto3 client pointing to Supabase S3.

### 2.2 Core Backend Workflows & Logic

#### 2.2.1 Onboarding & ID Auto-Generation
1. **Endpoint**: `POST /api/v1/employees/onboard` (Restricted to HR/Admin roles).
2. **Login ID Generation Algorithm**:
   *   Take the first 2 letters of `first_name` and the first 2 letters of `last_name` in uppercase.
   *   Append the `joining_year` (4 digits).
   *   Determine the sequential joining count for that year (e.g. 001, 002) and append it.
   *   *Formula*: `UPPER(first_name[:2]) + UPPER(last_name[:2]) + str(joining_year) + f"{serial_count:03d}"`
3. **Password Initialization**:
   *   Generate a secure, random string.
   *   Store the hashed password in the `users` table.
   *   Return the plaintext generated credentials to the onboarding HR/Admin (to be shared securely with the employee).
4. **First Login & Password Change**:
   *   Users log in with their generated Login ID and temporary password.
   *   A change-password endpoint (`PATCH /api/v1/auth/change-password`) is used by employees to set a custom password.

#### 2.2.2 Salary Calculation Pipeline
1. **Inputs**: Total Fixed Wage amount (`wage`), customized computation variables (e.g., `performance_bonus` if any).
2. **Component Formulas**:
   *   $\text{Basic} = \text{wage} \times 0.50$
   *   $\text{HRA} = \text{Basic} \times 0.50$
   *   $\text{Standard Allowance} = \text{wage} \times 0.0833$
   *   $\text{LTA} = \text{wage} \times 0.0833$
   *   $\text{Fixed Allowance} = \text{wage} - (\text{Basic} + \text{HRA} + \text{Standard Allowance} + \text{LTA} + \text{Performance Bonus})$
3. **Deductions**:
   *   $\text{Provident Fund (PF)} = \text{Basic} \times 0.12$
   *   $\text{Professional Tax (PT)} = 200.00$ (Fixed)
4. **Validation**: Validate that $\text{Basic} + \text{HRA} + \text{Standard} + \text{LTA} + \text{Bonus} \le \text{wage}$. The `Fixed Allowance` dynamically absorbs the variance to match the overall total wage.

#### 2.2.3 Attendance & Payroll Integration
1. **Attendance Tracking**:
   *   Log `check_in`, `check_out`, and break intervals daily.
2. **Payslip Generation Integration**:
   *   When compiling payslips, the payroll service queries the attendance repository for a given month and employee.
   *   `Payable Days = Total Working Days in Month - Unpaid Leaves - Missing Attendance Days`.
   *   Calculates salary deductions based on missing days and applies it to the final payout calculations.

#### 2.2.4 Object Storage Integration & CORS
1. **Service Class**: `app/core/storage.py` encapsulates file operations utilizing `boto3.client("s3")`.
2. **Supabase AWS S3 integration**: Documents are safely backed up in a secure bucket on Supabase S3 storage.
3. **CORS Handling**: Backend endpoints are configured with strict FastAPI CORS origin configurations to safely allow communication between `http://localhost:5173` and the backend `http://localhost:8000` while preventing fetch block exceptions.

---

## 3. Frontend Architecture (React, TSX, Tailwind CSS)

### 3.1 Design System & Aesthetic Structure
Dayflow implements a strict, elegant **Swiss Minimalist aesthetic** to maximize legibility and user-friendliness:
*   **Palette limitation**: Strictly restricted to White, Dark Near-Black, and Slate Steel borders.
*   **Flat Components**: Absence of neon, heavy drop shadows, glowing effects, and gradients.
*   **Indicators**:
    *   🟢 **Present Status Badge**: `#2F855A` (Forest Green text) on `#F0FDF4` bg.
    *   ✈️ **On Leave Status Badge**: `#2B6CB0` (Steel Blue text) on `#EBF8FF` bg.
    *   🟡 **Absent Status Badge**: `#C53030` (Muted Red text) on `#FFF5F5` bg.
*   **Forms & Modals**: Clean labels, border outlines (`border-[#E2E8F0]`), and flat input backgrounds (`bg-[#F8F9FA]`).

### 3.2 Key Components
*   **TopBar / Sidebar**: Integrated with minimal breadcrumbs, a simplified workspace check-in panel, and responsive layouts.
*   **Dashboard**: Shows attendance trends and summaries using basic, dynamic inline SVG charts.
*   **Time Off Module**: Leaves request tables and modal request flows styled with flat badge status lists.
*   **My Profile**: Tab-based user workspace incorporating direct file upload features to S3.
