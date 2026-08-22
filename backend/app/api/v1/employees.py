import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_current_hr_user
from app.core import security
from app.database import get_db
from app.models.user import User
from app.models.employee import Employee
from app.schemas.employee import (
    EmployeeOnboard,
    EmployeeOnboardResponse,
    EmployeeOut,
    EmployeeProfileOut,
    EmployeeProfileUpdate,
)

router = APIRouter()


def generate_temporary_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))


async def generate_login_id(
    first_name: str, last_name: str, joining_year: int, db: AsyncSession
) -> str:
    """
    Generates a unique Login ID of the format: [FI][LA][YEAR][SEQ]
    Example: Jane Smith joining in 2026 -> JASM2026001
    """
    first_prefix = first_name[:2].upper().ljust(2, "X")
    last_prefix = last_name[:2].upper().ljust(2, "X")
    base_prefix = f"{first_prefix}{last_prefix}{joining_year}"

    # Query for all login_ids starting with the prefix to find the max sequential suffix
    result = await db.execute(
        select(User.login_id)
        .filter(User.login_id.like(f"{base_prefix}%"))
    )
    existing_ids = result.scalars().all()

    max_seq = 0
    for login_id in existing_ids:
        suffix = login_id[len(base_prefix):]
        if suffix.isdigit():
            max_seq = max(max_seq, int(suffix))

    next_seq = max_seq + 1
    return f"{base_prefix}{next_seq:03d}"


@router.post("/onboard", response_model=EmployeeOnboardResponse, status_code=status.HTTP_201_CREATED)
async def onboard_employee(
    payload: EmployeeOnboard,
    current_user: User = Depends(get_current_hr_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if user email already exists
    email_check = await db.execute(select(User).filter(User.email == payload.email))
    if email_check.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Generate credentials
    login_id = await generate_login_id(
        payload.first_name, payload.last_name, payload.joining_year, db
    )
    temp_password = generate_temporary_password()

    # Create User
    new_user = User(
        login_id=login_id,
        email=payload.email,
        hashed_password=security.get_password_hash(temp_password),
        role=payload.role,
        is_verified=False,
        is_first_login=True
    )
    db.add(new_user)
    await db.flush()

    # Create Employee
    new_employee = Employee(
        user_id=new_user.id,
        employee_id=login_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        designation=payload.designation,
        department=payload.department,
        joining_date=payload.joining_date
    )
    db.add(new_employee)
    await db.commit()

    return {
        "id": new_employee.id,
        "login_id": login_id,
        "temporary_password": temp_password,
        "email": payload.email,
        "first_name": payload.first_name,
        "last_name": payload.last_name
    }


@router.get("", response_model=list[EmployeeOut])
async def list_employees(
    current_user: User = Depends(get_current_hr_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Employee))
    employees = result.scalars().all()
    
    # Map employees to output schema (defaulting status to Absent for now; will update in Phase 4)
    return [
        EmployeeOut(
            id=emp.id,
            employee_id=emp.employee_id,
            first_name=emp.first_name,
            last_name=emp.last_name,
            designation=emp.designation,
            department=emp.department,
            current_status="Absent"
        )
        for emp in employees
    ]


@router.get("/{employee_id}", response_model=EmployeeProfileOut)
async def get_profile(
    employee_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Retrieve employee and load user relationship
    result = await db.execute(
        select(Employee)
        .filter(Employee.employee_id == employee_id)
        .options(selectinload(Employee.user))
    )
    employee = result.scalars().first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found"
        )

    # Restriction: non-HR employees can only view their own profile
    if current_user.role != "HR" and current_user.login_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view other employee profiles."
        )

    return EmployeeProfileOut(
        id=employee.id,
        employee_id=employee.employee_id,
        first_name=employee.first_name,
        last_name=employee.last_name,
        email=employee.user.email,
        phone=employee.phone,
        address=employee.address,
        profile_picture_url=employee.profile_picture_url,
        designation=employee.designation,
        department=employee.department,
        joining_date=employee.joining_date,
        role=employee.user.role
    )


@router.put("/{employee_id}", response_model=EmployeeProfileOut)
async def update_profile(
    employee_id: str,
    payload: EmployeeProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Employee)
        .filter(Employee.employee_id == employee_id)
        .options(selectinload(Employee.user))
    )
    employee = result.scalars().first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found"
        )

    # Restriction: non-HR employees can only update their own profile
    if current_user.role != "HR" and current_user.login_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit other employee profiles."
        )

    # Update common contact details
    if payload.phone is not None:
        employee.phone = payload.phone
    if payload.address is not None:
        employee.address = payload.address
    if payload.profile_picture_url is not None:
        employee.profile_picture_url = payload.profile_picture_url

    # HR only updates corporate/joining fields
    if current_user.role == "HR":
        if payload.designation is not None:
            employee.designation = payload.designation
        if payload.department is not None:
            employee.department = payload.department
        if payload.joining_date is not None:
            employee.joining_date = payload.joining_date
    else:
        # If a non-HR employee tried to modify restricted fields, raise a forbidden or ignore silently
        if any(v is not None for v in [payload.designation, payload.department, payload.joining_date]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only HR Admins can modify organizational fields (Designation, Department, Joining Date)."
            )

    db.add(employee)
    await db.commit()
    await db.refresh(employee)

    return EmployeeProfileOut(
        id=employee.id,
        employee_id=employee.employee_id,
        first_name=employee.first_name,
        last_name=employee.last_name,
        email=employee.user.email,
        phone=employee.phone,
        address=employee.address,
        profile_picture_url=employee.profile_picture_url,
        designation=employee.designation,
        department=employee.department,
        joining_date=employee.joining_date,
        role=employee.user.role
    )
