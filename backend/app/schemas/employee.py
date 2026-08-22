import uuid
from datetime import date
from pydantic import BaseModel, EmailStr


class EmployeeOnboard(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    joining_year: int
    designation: str
    department: str
    joining_date: date
    role: str = "Employee"  # "Employee" or "HR"


class EmployeeOnboardResponse(BaseModel):
    id: uuid.UUID
    login_id: str
    temporary_password: str
    email: EmailStr
    first_name: str
    last_name: str


class EmployeeOut(BaseModel):
    id: uuid.UUID
    employee_id: str
    first_name: str
    last_name: str
    designation: str | None = None
    department: str | None = None
    current_status: str = "Absent"  # "Present" | "Absent" | "On Leave"


class EmployeeProfileOut(BaseModel):
    id: uuid.UUID
    employee_id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: str | None = None
    address: str | None = None
    profile_picture_url: str | None = None
    designation: str | None = None
    department: str | None = None
    joining_date: date | None = None
    role: str


class EmployeeProfileUpdate(BaseModel):
    phone: str | None = None
    address: str | None = None
    profile_picture_url: str | None = None
    designation: str | None = None
    department: str | None = None
    joining_date: date | None = None
