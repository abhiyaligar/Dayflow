import pytest
from httpx import AsyncClient
from datetime import date, timedelta


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, seeded_users):
    # Test form data login
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "hr@dayflow.com", "password": "AdminPassword123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "HR"

    # Test JSON login
    json_response = await client.post(
        "/api/v1/auth/login",
        json={"username": "JODO2026001", "password": "EmpPassword123"},
    )
    assert json_response.status_code == 200
    json_data = json_response.json()
    assert "access_token" in json_data
    assert json_data["is_first_login"] is True


@pytest.mark.asyncio
async def test_onboard_employee(client: AsyncClient, seeded_users):
    # Login as HR
    login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": "hr@dayflow.com", "password": "AdminPassword123"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Onboard Jane Smith
    payload = {
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane@dayflow.com",
        "joining_year": 2026,
        "designation": "Product Manager",
        "department": "Product",
        "joining_date": str(date.today()),
        "role": "Employee"
    }
    response = await client.post(
        "/api/v1/employees/onboard",
        json=payload,
        headers=headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["login_id"] == "JASM2026001"  # first sequential ID for JASM in 2026
    assert "temporary_password" in data


@pytest.mark.asyncio
async def test_check_in_out(client: AsyncClient, seeded_users):
    # Login as Employee
    login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": "JODO2026001", "password": "EmpPassword123"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Check In
    in_res = await client.post("/api/v1/attendance/check-in", headers=headers)
    assert in_res.status_code == 200
    in_data = in_res.json()
    assert in_data["status"] == "Present"
    assert in_data["check_in"] is not None

    # Check Out
    out_res = await client.post("/api/v1/attendance/check-out", headers=headers)
    assert out_res.status_code == 200
    out_data = out_res.json()
    assert out_data["check_out"] is not None


@pytest.mark.asyncio
async def test_leave_request_approval(client: AsyncClient, seeded_users):
    # Login as Employee to request leave
    emp_login = await client.post(
        "/api/v1/auth/login",
        data={"username": "john@dayflow.com", "password": "EmpPassword123"},
    )
    emp_token = emp_login.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}

    start_date = date.today() + timedelta(days=1)
    end_date = date.today() + timedelta(days=2)

    # Request unpaid leave
    leave_payload = {
        "leave_type": "Unpaid",
        "start_date": str(start_date),
        "end_date": str(end_date),
        "remarks": "Need personal time-off"
    }
    leave_res = await client.post(
        "/api/v1/leaves/request",
        json=leave_payload,
        headers=emp_headers
    )
    assert leave_res.status_code == 201
    leave_data = leave_res.json()
    leave_id = leave_data["id"]

    # Login as HR to review leave
    hr_login = await client.post(
        "/api/v1/auth/login",
        data={"username": "hr@dayflow.com", "password": "AdminPassword123"},
    )
    hr_token = hr_login.json()["access_token"]
    hr_headers = {"Authorization": f"Bearer {hr_token}"}

    review_payload = {
        "status": "Approved",
        "admin_comments": "Approved. Stay safe."
    }
    review_res = await client.patch(
        f"/api/v1/leaves/{leave_id}/review",
        json=review_payload,
        headers=hr_headers
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "Approved"


@pytest.mark.asyncio
async def test_payroll_calculation(client: AsyncClient, seeded_users):
    # Login as HR
    hr_login = await client.post(
        "/api/v1/auth/login",
        data={"username": "hr@dayflow.com", "password": "AdminPassword123"},
    )
    hr_token = hr_login.json()["access_token"]
    hr_headers = {"Authorization": f"Bearer {hr_token}"}

    # Define Salary structure for Employee John Doe
    salary_payload = {
        "defined_wage": 12000.00,
        "wage_type": "Fixed",
        "performance_bonus": 500.00
    }
    sal_res = await client.put(
        "/api/v1/payroll/JODO2026001",
        json=salary_payload,
        headers=hr_headers
    )
    assert sal_res.status_code == 200
    sal_data = sal_res.json()
    assert sal_data["basic_salary"] == 6000.00
    assert sal_data["hra"] == 3000.00

    # Retrieve Payslip
    payslip_res = await client.get(
        "/api/v1/payroll/JODO2026001/payslip",
        headers=hr_headers
    )
    assert payslip_res.status_code == 200
    payslip_data = payslip_res.json()
    assert payslip_data["base_wage"] == 12000.00
    assert "net_pay" in payslip_data


@pytest.mark.asyncio
async def test_signup_flow(client: AsyncClient, seeded_users):
    # 1. Login as HR to onboard a new employee
    login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": "hr@dayflow.com", "password": "AdminPassword123"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Onboard Alice Wood
    onboard_payload = {
        "first_name": "Alice",
        "last_name": "Wood",
        "email": "alice@dayflow.com",
        "joining_year": 2026,
        "designation": "QA Analyst",
        "department": "Engineering",
        "joining_date": str(date.today()),
        "role": "Employee"
    }
    onboard_res = await client.post(
        "/api/v1/employees/onboard",
        json=onboard_payload,
        headers=headers
    )
    assert onboard_res.status_code == 201
    emp_id = onboard_res.json()["login_id"]

    # 2. Try to signup with an invalid/weak password (violates length constraint)
    weak_payload_1 = {
        "employee_id": emp_id,
        "email": "alice@dayflow.com",
        "password": "short",
        "role": "Employee"
    }
    res_weak_1 = await client.post("/api/v1/auth/signup", json=weak_payload_1)
    assert res_weak_1.status_code == 422

    # Try to signup with a weak password (violates uppercase/number/special constraints)
    weak_payload_2 = {
        "employee_id": emp_id,
        "email": "alice@dayflow.com",
        "password": "weakpasswordnoextra",
        "role": "Employee"
    }
    res_weak_2 = await client.post("/api/v1/auth/signup", json=weak_payload_2)
    assert res_weak_2.status_code == 422

    # 3. Signup with correct strong password
    strong_payload = {
        "employee_id": emp_id,
        "email": "alice@dayflow.com",
        "password": "AlicePassword123!",
        "role": "Employee"
    }
    res_strong = await client.post("/api/v1/auth/signup", json=strong_payload)
    assert res_strong.status_code == 201
    assert "Registration successful" in res_strong.json()["message"]

    # 4. Try signing up again (should fail)
    res_retry = await client.post("/api/v1/auth/signup", json=strong_payload)
    assert res_retry.status_code == 400
    assert "already registered" in res_retry.json()["detail"]

    # 5. Verify the newly signed-up user can log in with their password
    login_alice = await client.post(
        "/api/v1/auth/login",
        json={"username": "alice@dayflow.com", "password": "AlicePassword123!"}
    )
    assert login_alice.status_code == 200
    assert login_alice.json()["role"] == "Employee"
