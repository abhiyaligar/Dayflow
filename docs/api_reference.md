# API Reference: Dayflow HRMS

This document outlines the REST API endpoints provided by the Dayflow backend. All endpoints are prefixed with `/api/v1`.

---

## 1. Authentication & Authorization (`/auth`)

### 1.1 Sign In (Token Generation)
Authenticates a user and issues a JSON Web Token (JWT).
*   **Method**: `POST`
*   **URL**: `/auth/login`
*   **Content-Type**: `application/x-www-form-urlencoded` or `application/json`
*   **Payload (JSON)**:
    ```json
    {
      "username": "JODO2026001",
      "password": "TemporaryPassword123!"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "access_token": "eyJhbGciOi...",
      "token_type": "bearer",
      "is_first_login": true,
      "role": "Employee"
    }
    ```

### 1.2 Change Password (First Login or Manual)
Allows users to update their password.
*   **Method**: `PATCH`
*   **URL**: `/auth/change-password`
*   **Authentication Required**: Yes (Bearer Token)
*   **Payload**:
    ```json
    {
      "old_password": "TemporaryPassword123!",
      "new_password": "MyNewSecurePassword456$"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "message": "Password changed successfully."
    }
    ```

---

## 2. Employee Directory (`/employees`)

### 2.1 Onboard Employee (Admin/HR Only)
Creates a new user and employee profile, generating the username and temporary password.
*   **Method**: `POST`
*   **URL**: `/employees/onboard`
*   **Authentication Required**: Yes (HR/Admin only)
*   **Payload**:
    ```json
    {
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane.smith@dayflow.com",
      "joining_year": 2026,
      "designation": "Software Engineer",
      "department": "Engineering",
      "joining_date": "2026-08-22",
      "role": "Employee"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "id": "e43b17be-512c-4976-963d-4c3dbb9f1d02",
      "login_id": "JASM2026006",
      "temporary_password": "generated_plaintext_password_here",
      "email": "jane.smith@dayflow.com",
      "first_name": "Jane",
      "last_name": "Smith"
    }
    ```

### 2.2 Get Employee Directory (Admin/HR Only)
Lists all employees.
*   **Method**: `GET`
*   **URL**: `/employees`
*   **Authentication Required**: Yes (HR/Admin only)
*   **Response (200 OK)**:
    ```json
    [
      {
        "id": "e43b17be-512c-4976-963d-4c3dbb9f1d02",
        "employee_id": "JASM2026006",
        "first_name": "Jane",
        "last_name": "Smith",
        "designation": "Software Engineer",
        "department": "Engineering",
        "current_status": "Present"
      }
    ]
    ```

### 2.3 Get Profile
Retrieve a specific profile (Users can retrieve their own profile, Admins/HR can retrieve anyone's).
*   **Method**: `GET`
*   **URL**: `/employees/{employee_id}`
*   **Authentication Required**: Yes

### 2.4 Edit Profile
Allows employees to edit limited fields, or HR/Admin to edit all.
*   **Method**: `PUT`
*   **URL**: `/employees/{employee_id}`
*   **Authentication Required**: Yes

---

## 3. Attendance Logs (`/attendance`)

### 3.1 Check-In
*   **Method**: `POST`
*   **URL**: `/attendance/check-in`
*   **Authentication Required**: Yes

### 3.2 Check-Out
*   **Method**: `POST`
*   **URL**: `/attendance/check-out`
*   **Authentication Required**: Yes

### 3.3 Get My Attendance (Employee View)
Retrieves day-wise logs for the ongoing month.
*   **Method**: `GET`
*   **URL**: `/attendance/me`
*   **Authentication Required**: Yes

### 3.4 Get Daily Present Employees (Admin/HR Only)
*   **Method**: `GET`
*   **URL**: `/attendance/today`
*   **Authentication Required**: Yes (HR/Admin only)

---

## 4. Time-Off & Leaves (`/leaves`)

### 4.1 Apply for Leave
*   **Method**: `POST`
*   **URL**: `/leaves/request`
*   **Payload**:
    ```json
    {
      "leave_type": "Paid",
      "start_date": "2026-09-01",
      "end_date": "2026-09-05",
      "remarks": "Annual family trip"
    }
    ```

### 4.2 Review Leave Request (Admin/HR Only)
*   **Method**: `PATCH`
*   **URL**: `/leaves/{leave_id}/review`
*   **Payload**:
    ```json
    {
      "status": "Approved",
      "admin_comments": "Covered by department redundancy."
    }
    ```

---

## 5. Payroll Management (`/payroll`)

### 5.1 Define Salary Structure (Admin/HR Only)
Sets the base wage and triggers auto-component compilation.
*   **Method**: `PUT`
*   **URL**: `/payroll/{employee_id}`
*   **Payload**:
    ```json
    {
      "defined_wage": 120000.00,
      "wage_type": "Fixed",
      "performance_bonus": 5000.00
    }
    ```
