# System Architecture: Dayflow HRMS

This document outlines the architectural design, directory structures, and tech stack configurations for both the Frontend and Backend of the Dayflow HRMS.

---

## 1. High-Level System Architecture

Dayflow uses a client-server architecture with a clear separation of concerns between the user interface and the business logic/persistence layer:

*   **Frontend**: A Single Page Application (SPA) built with React, TypeScript, and Tailwind CSS. It communicates with the backend via a RESTful API.
*   **Backend**: A REST API application built with FastAPI (Python 3.10+), using SQLAlchemy for Object-Relational Mapping (ORM) and Alembic for relational database migrations.
*   **Database**: PostgreSQL is used as the relational database.

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

---

## 3. Frontend Architecture (React, TSX, Tailwind CSS)

### 3.1 Components & UI Flow
*   **Status Indicators**:
    *   Employee cards query the daily attendance state from the backend.
    *   If present -> displays a Green dot.
    *   If approved leave exists -> displays an Airplane icon.
    *   If no check-in and no approved leave exists -> displays a Yellow dot.
*   **Salary Configuration Panel**:
    *   Responsive form under the Admin tab. Editing the "Wage" input triggers state hooks to instantly recalculate and display the read-only component breakdowns (Basic, HRA, Standard, LTA, Fixed Allowance, PF, and PT) before saving.
*   **Attendance Page**:
    *   Employees see a calendar view of the current ongoing month by default showing day-wise check-in/out times, total hours worked, and break durations.
*   **Admin Views**:
    *   Real-time dashboard showing present employees for the current day.
