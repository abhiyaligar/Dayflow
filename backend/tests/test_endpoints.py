import os
from unittest.mock import MagicMock, patch
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
    # 1. Login as HR
    hr_login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": "hr@dayflow.com", "password": "AdminPassword123"},
    )
    hr_token = hr_login_res.json()["access_token"]
    hr_headers = {"Authorization": f"Bearer {hr_token}"}

    # HR tries to onboard an Employee - should succeed
    payload_employee = {
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane@dayflow.com",
        "joining_year": 2026,
        "designation": "Product Manager",
        "department": "Product",
        "joining_date": str(date.today()),
        "role": "Employee"
    }
    hr_emp_response = await client.post(
        "/api/v1/employees/onboard",
        json=payload_employee,
        headers=hr_headers
    )
    assert hr_emp_response.status_code == 201
    assert hr_emp_response.json()["login_id"] == "JASM2026001"

    # HR tries to onboard an Admin - should fail with 403 Forbidden
    payload_admin = payload_employee.copy()
    payload_admin["email"] = "admin_by_hr@dayflow.com"
    payload_admin["role"] = "Admin"
    hr_admin_response = await client.post(
        "/api/v1/employees/onboard",
        json=payload_admin,
        headers=hr_headers
    )
    assert hr_admin_response.status_code == 403
    assert "HR users can only onboard Employees" in hr_admin_response.json()["detail"]

    # HR tries to onboard an HR - should fail with 403 Forbidden
    payload_hr = payload_employee.copy()
    payload_hr["email"] = "hr_by_hr@dayflow.com"
    payload_hr["role"] = "HR"
    hr_hr_response = await client.post(
        "/api/v1/employees/onboard",
        json=payload_hr,
        headers=hr_headers
    )
    assert hr_hr_response.status_code == 403
    assert "HR users can only onboard Employees" in hr_hr_response.json()["detail"]

    # 2. Login as Admin
    admin_login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin@dayflow.com", "password": "AdminPassword123"},
    )
    admin_token = admin_login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin tries to onboard an Admin - should succeed
    payload_admin_success = payload_employee.copy()
    payload_admin_success["email"] = "admin_by_admin@dayflow.com"
    payload_admin_success["first_name"] = "Super"
    payload_admin_success["last_name"] = "Admin"
    payload_admin_success["role"] = "Admin"
    admin_admin_response = await client.post(
        "/api/v1/employees/onboard",
        json=payload_admin_success,
        headers=admin_headers
    )
    assert admin_admin_response.status_code == 201
    assert admin_admin_response.json()["login_id"] == "SUAD2026001"

    # Admin tries to onboard an HR - should succeed
    payload_hr_success = payload_employee.copy()
    payload_hr_success["email"] = "hr_by_admin@dayflow.com"
    payload_hr_success["first_name"] = "Manager"
    payload_hr_success["last_name"] = "HR"
    payload_hr_success["role"] = "HR"
    admin_hr_response = await client.post(
        "/api/v1/employees/onboard",
        json=payload_hr_success,
        headers=admin_headers
    )
    assert admin_hr_response.status_code == 201
    assert admin_hr_response.json()["login_id"] == "MAHR2026001"



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
    # 1. Login as Admin to onboard a new employee
    login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin@dayflow.com", "password": "AdminPassword123"},
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


@pytest.mark.asyncio
async def test_document_management_flow(client: AsyncClient, seeded_users):
    # 1. Login as HR
    hr_login = await client.post(
        "/api/v1/auth/login",
        data={"username": "hr@dayflow.com", "password": "AdminPassword123"},
    )
    hr_token = hr_login.json()["access_token"]
    hr_headers = {"Authorization": f"Bearer {hr_token}"}

    # 2. Login as Employee (John Doe - JODO2026001)
    emp_login = await client.post(
        "/api/v1/auth/login",
        json={"username": "JODO2026001", "password": "EmpPassword123"},
    )
    emp_token = emp_login.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}

    # 3. HR uploads a document for a non-existent employee -> Should be 404
    non_existent_files = {"file": ("contract.pdf", b"pdf-content", "application/pdf")}
    res_non_existent = await client.post(
        "/api/v1/employees/NONEXISTENT/documents",
        headers=hr_headers,
        files=non_existent_files
    )
    assert res_non_existent.status_code == 404
    assert "Employee profile not found" in res_non_existent.json()["detail"]

    # 4. HR uploads a document for JODO2026001 -> Should be 201
    hr_files = {"file": ("contract.pdf", b"contract-pdf-content", "application/pdf")}
    res_upload_hr = await client.post(
        "/api/v1/employees/JODO2026001/documents",
        headers=hr_headers,
        files=hr_files
    )
    assert res_upload_hr.status_code == 201
    doc_hr = res_upload_hr.json()
    assert doc_hr["name"] == "contract.pdf"
    assert doc_hr["file_url"].startswith("/static/uploads/")

    # Derive local file path of contract.pdf
    local_filename_hr = doc_hr["file_url"].split("/")[-1]
    local_filepath_hr = os.path.join("static", "uploads", local_filename_hr)
    assert os.path.exists(local_filepath_hr)

    # 5. Employee uploads a document for themselves (JODO2026001) -> Should be 201
    emp_files = {"file": ("certificate.pdf", b"certificate-pdf-content", "application/pdf")}
    res_upload_emp = await client.post(
        "/api/v1/employees/JODO2026001/documents",
        headers=emp_headers,
        files=emp_files
    )
    assert res_upload_emp.status_code == 201
    doc_emp = res_upload_emp.json()
    assert doc_emp["name"] == "certificate.pdf"
    assert doc_emp["file_url"].startswith("/static/uploads/")

    local_filename_emp = doc_emp["file_url"].split("/")[-1]
    local_filepath_emp = os.path.join("static", "uploads", local_filename_emp)
    assert os.path.exists(local_filepath_emp)

    # 6. Employee tries to upload to another employee id (JASM2026001) -> Should be 403 Forbidden
    res_unauth_upload = await client.post(
        "/api/v1/employees/JASM2026001/documents",
        headers=emp_headers,
        files=emp_files
    )
    assert res_unauth_upload.status_code == 403

    # 7. Employee lists their own documents -> Should return both documents (contract.pdf, certificate.pdf)
    res_list = await client.get(
        "/api/v1/employees/JODO2026001/documents",
        headers=emp_headers
    )
    assert res_list.status_code == 200
    docs = res_list.json()
    assert len(docs) == 2
    filenames = [d["name"] for d in docs]
    assert "contract.pdf" in filenames
    assert "certificate.pdf" in filenames

    # 8. Employee deletes contract.pdf (doc_hr["id"]) -> Should be 200 OK
    res_delete = await client.delete(
        f"/api/v1/employees/JODO2026001/documents/{doc_hr['id']}",
        headers=emp_headers
    )
    assert res_delete.status_code == 200
    assert "deleted successfully" in res_delete.json()["message"]

    # Verify physical file deletion of contract.pdf
    assert not os.path.exists(local_filepath_hr)
    # Ensure certificate.pdf still exists physically
    assert os.path.exists(local_filepath_emp)

    # 9. Employee lists their documents again -> Should only contain certificate.pdf
    res_list_after = await client.get(
        "/api/v1/employees/JODO2026001/documents",
        headers=emp_headers
    )
    assert res_list_after.status_code == 200
    docs_after = res_list_after.json()
    assert len(docs_after) == 1
    assert docs_after[0]["name"] == "certificate.pdf"

    # 10. Delete invalid format UUID -> Should be 400 Bad Request
    res_delete_invalid = await client.delete(
        "/api/v1/employees/JODO2026001/documents/not-a-uuid",
        headers=emp_headers
    )
    assert res_delete_invalid.status_code == 400

    # 11. Delete non-existent UUID -> Should be 404 Not Found
    non_existent_uuid = "00000000-0000-0000-0000-000000000000"
    res_delete_notfound = await client.delete(
        f"/api/v1/employees/JODO2026001/documents/{non_existent_uuid}",
        headers=emp_headers
    )
    assert res_delete_notfound.status_code == 404

    # Cleanup leftover local test files
    if os.path.exists(local_filepath_emp):
        os.remove(local_filepath_emp)


@pytest.mark.asyncio
async def test_document_management_s3_upload(client: AsyncClient, seeded_users):
    # 1. Login as HR
    hr_login = await client.post(
        "/api/v1/auth/login",
        data={"username": "hr@dayflow.com", "password": "AdminPassword123"},
    )
    hr_token = hr_login.json()["access_token"]
    hr_headers = {"Authorization": f"Bearer {hr_token}"}

    # 2. Temporarily set AWS settings to simulate live S3 configuration
    from app.core.config import settings
    with patch.object(settings, "AWS_ACCESS_KEY_ID", "mock_key"), \
         patch.object(settings, "AWS_SECRET_ACCESS_KEY", "mock_secret"), \
         patch.object(settings, "AWS_REGION", "us-east-1"), \
         patch.object(settings, "AWS_S3_BUCKET_NAME", "mock_bucket"):

        # 3. Mock boto3 client
        mock_s3 = MagicMock()
        with patch("boto3.client", return_value=mock_s3) as mock_boto:
            hr_files = {"file": ("contract.pdf", b"contract-pdf-content", "application/pdf")}
            res = await client.post(
                "/api/v1/employees/JODO2026001/documents",
                headers=hr_headers,
                files=hr_files
            )
            assert res.status_code == 201
            data = res.json()
            assert "mock_bucket.s3.us-east-1.amazonaws.com" in data["file_url"]

            # Verify boto3 was called correctly
            mock_boto.assert_called_once_with(
                "s3",
                aws_access_key_id="mock_key",
                aws_secret_access_key="mock_secret",
                region_name="us-east-1"
            )
            mock_s3.put_object.assert_called_once()

            # Now test deleting it from mock S3
            doc_id = data["id"]
            res_delete = await client.delete(
                f"/api/v1/employees/JODO2026001/documents/{doc_id}",
                headers=hr_headers
            )
            assert res_delete.status_code == 200
            mock_s3.delete_object.assert_called_once()


