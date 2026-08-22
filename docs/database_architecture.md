# Database Architecture: Dayflow HRMS

This document describes the schema design, tables, fields, relationships, and migration strategies for the PostgreSQL database powering the Dayflow HRMS.

---

## 1. Overview
Dayflow utilizes a relational **PostgreSQL** database. 
*   **Migrations**: Handled entirely via **Alembic** to track database version history and apply schema upgrades cleanly.
*   **ORM**: SQLAlchemy handles object-relational mapping.
*   **Authentication**: Custom tables and password hashing are implemented directly in the database (no third-party auth services).

---

## 2. Entity-Relationship Diagram
```mermaid
erDiagram
    users ||--|| employees : "has_profile"
    employees ||--o{ attendance : "logs"
    employees ||--o{ leave_requests : "requests"
    employees ||--|| salary_structures : "has_salary"

    users {
        UUID id PK
        VARCHAR login_id UK "Generated: [FI][LA][YEAR][SEQ]"
        VARCHAR email UK
        VARCHAR hashed_password
        VARCHAR role "Employee | HR"
        BOOLEAN is_verified
        BOOLEAN is_first_login "Default: true"
        TIMESTAMP created_at
    }

    employees {
        UUID id PK
        UUID user_id FK
        VARCHAR employee_id UK "Matches users.login_id"
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR phone
        TEXT address
        VARCHAR profile_picture_url
        VARCHAR designation
        VARCHAR department
        DATE joining_date
        TIMESTAMP updated_at
    }

    attendance {
        UUID id PK
        UUID employee_id FK
        DATE date
        TIMESTAMP check_in
        TIMESTAMP check_out
        JSONB breaks "Array of {start: ISO, end: ISO}"
        VARCHAR status "Present | Absent | Half-day | Leave"
        TIMESTAMP created_at
    }

    leave_requests {
        UUID id PK
        UUID employee_id FK
        VARCHAR leave_type "Paid | Sick | Unpaid"
        DATE start_date
        DATE end_date
        TEXT remarks
        VARCHAR status "Pending | Approved | Rejected"
        UUID reviewed_by FK "references employees(id)"
        TEXT admin_comments
        TIMESTAMP requested_at
        TIMESTAMP reviewed_at
    }

    salary_structures {
        UUID id PK
        UUID employee_id FK
        VARCHAR wage_type "Default: Fixed"
        NUMERIC defined_wage "Total defined base salary"
        NUMERIC basic_salary "50% of defined_wage"
        NUMERIC hra "50% of basic_salary"
        NUMERIC standard_allowance "8.33% of defined_wage"
        NUMERIC lta "8.33% of defined_wage"
        NUMERIC performance_bonus "Fixed or percentage based"
        NUMERIC fixed_allowance "Residual calculation"
        NUMERIC pf_rate "Default: 0.12 (12% of basic)"
        NUMERIC professional_tax "Default: 200.00"
        TIMESTAMP updated_at
    }
```

---

## 3. Schema Definitions

### 3.1 `users` Table
Stores login credentials and authorization status.
*   `id`: `UUID` (Primary Key, default: `uuid_generate_v4()`)
*   `login_id`: `VARCHAR(100)` (Unique, Indexed, Not Null) - E.g., `JODO2026001`
*   `email`: `VARCHAR(255)` (Unique, Indexed, Not Null)
*   `hashed_password`: `VARCHAR(255)` (Not Null)
*   `role`: `VARCHAR(50)` (Not Null, values: `Employee`, `HR`)
*   `is_verified`: `BOOLEAN` (Default: `false`)
*   `is_first_login`: `BOOLEAN` (Default: `true`) - Triggers password reset flow upon first login.
*   `created_at`: `TIMESTAMP` (Default: `CURRENT_TIMESTAMP`)

### 3.2 `employees` Table
Stores the profile and organizational details of each employee.
*   `id`: `UUID` (Primary Key, default: `uuid_generate_v4()`)
*   `user_id`: `UUID` (Foreign Key -> `users.id`, Unique, Cascade Delete)
*   `employee_id`: `VARCHAR(100)` (Unique, Indexed, Not Null, matches `users.login_id`)
*   `first_name`: `VARCHAR(100)` (Not Null)
*   `last_name`: `VARCHAR(100)` (Not Null)
*   `phone`: `VARCHAR(20)` (Nullable)
*   `address`: `TEXT` (Nullable)
*   `profile_picture_url`: `VARCHAR(500)` (Nullable)
*   `designation`: `VARCHAR(100)` (Nullable)
*   `department`: `VARCHAR(100)` (Nullable)
*   `joining_date`: `DATE` (Nullable)
*   `updated_at`: `TIMESTAMP` (Default: `CURRENT_TIMESTAMP` on update)

### 3.3 `attendance` Table
Logs daily check-in, check-out, and break events.
*   `id`: `UUID` (Primary Key, default: `uuid_generate_v4()`)
*   `employee_id`: `UUID` (Foreign Key -> `employees.id`, Not Null)
*   `date`: `DATE` (Indexed, Not Null)
*   `check_in`: `TIMESTAMP` (Nullable)
*   `check_out`: `TIMESTAMP` (Nullable)
*   `breaks`: `JSONB` (Nullable, default: `[]`) - Logs array of break intervals: `[{"start": "2026-08-22T13:00:00", "end": "2026-08-22T13:45:00"}]`
*   `status`: `VARCHAR(50)` (Not Null, default: `Present`, values: `Present`, `Absent`, `Half-day`, `Leave`)
*   `created_at`: `TIMESTAMP` (Default: `CURRENT_TIMESTAMP`)
*   *Unique Constraint*: Unique pair `(employee_id, date)` to enforce a single attendance log entry per day.

### 3.4 `leave_requests` Table
Tracks time-off submissions and reviews.
*   `id`: `UUID` (Primary Key)
*   `employee_id`: `UUID` (Foreign Key -> `employees.id`, Not Null)
*   `leave_type`: `VARCHAR(50)` (Not Null, values: `Paid`, `Sick`, `Unpaid`)
*   `start_date`: `DATE` (Not Null)
*   `end_date`: `DATE` (Not Null)
*   `remarks`: `TEXT` (Nullable)
*   `status`: `VARCHAR(50)` (Not Null, default: `Pending`, values: `Pending`, `Approved`, `Rejected`)
*   `reviewed_by`: `UUID` (Foreign Key -> `employees.id` references the HR personnel who approved/rejected it, Nullable)
*   `admin_comments`: `TEXT` (Nullable)
*   `requested_at`: `TIMESTAMP` (Default: `CURRENT_TIMESTAMP`)
*   `reviewed_at`: `TIMESTAMP` (Nullable)

### 3.5 `salary_structures` Table
Configures monthly salary breakdown parameters.
*   `id`: `UUID` (Primary Key)
*   `employee_id`: `UUID` (Foreign Key -> `employees.id`, Unique, Not Null)
*   `wage_type`: `VARCHAR(50)` (Not Null, default: `Fixed`)
*   `defined_wage`: `NUMERIC(12, 2)` (Not Null, default: `0.00`)
*   `basic_salary`: `NUMERIC(12, 2)` (Not Null, default: `0.00`)
*   `hra`: `NUMERIC(12, 2)` (Not Null, default: `0.00`)
*   `standard_allowance`: `NUMERIC(12, 2)` (Not Null, default: `0.00`)
*   `lta`: `NUMERIC(12, 2)` (Not Null, default: `0.00`)
*   `performance_bonus`: `NUMERIC(12, 2)` (Not Null, default: `0.00`)
*   `fixed_allowance`: `NUMERIC(12, 2)` (Not Null, default: `0.00`)
*   `pf_rate`: `NUMERIC(5, 4)` (Not Null, default: `0.1200`) - 12% PF rate.
*   `professional_tax`: `NUMERIC(12, 2)` (Not Null, default: `200.00`)
*   `updated_at`: `TIMESTAMP` (Default: `CURRENT_TIMESTAMP` on update)

---

## 4. Migration Strategy using Alembic
To maintain a clean migration sequence and align with best practices:
1.  **Setup**: Initialize alembic configuration using `alembic init alembic`.
2.  **Target Metadata**: Import and bind `Base` metadata from models in `alembic/env.py`.
3.  **Auto-generation**: Generate migrations using:
    ```bash
    alembic revision --autogenerate -m "Initial schema setup"
    ```
4.  **Execution**: Apply schema changes securely using:
    ```bash
    alembic upgrade head
    ```
