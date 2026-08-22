import calendar
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_current_hr_or_admin_user
from app.database import get_db
from app.models.user import User
from app.models.employee import Employee
from app.models.salary import SalaryStructure
from app.models.attendance import Attendance
from app.models.leave import LeaveRequest
from app.schemas.salary import SalaryStructureDefine, SalaryStructureOut, PayslipOut

router = APIRouter()


@router.put("/{employee_id}", response_model=SalaryStructureOut)
async def define_salary_structure(
    employee_id: str,
    payload: SalaryStructureDefine,
    current_user: User = Depends(get_current_hr_or_admin_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch employee profile
    emp_result = await db.execute(
        select(Employee).filter(Employee.employee_id == employee_id)
    )
    employee = emp_result.scalars().first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found."
        )

    # Calculate components
    wage = payload.defined_wage
    basic = round(wage * 0.50, 2)
    hra = round(basic * 0.50, 2)
    standard = round(wage * 0.0833, 2)
    lta = round(wage * 0.0833, 2)
    bonus = round(payload.performance_bonus, 2)

    if (basic + hra + standard + lta + bonus) > wage:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The sum of Basic, HRA, Standard, LTA and Bonus exceeds the defined wage."
        )

    fixed_allowance = round(wage - (basic + hra + standard + lta + bonus), 2)

    # Update or Create SalaryStructure
    sal_result = await db.execute(
        select(SalaryStructure).filter(SalaryStructure.employee_id == employee.id)
    )
    salary = sal_result.scalars().first()

    if salary:
        salary.wage_type = payload.wage_type
        salary.defined_wage = wage
        salary.basic_salary = basic
        salary.hra = hra
        salary.standard_allowance = standard
        salary.lta = lta
        salary.performance_bonus = bonus
        salary.fixed_allowance = fixed_allowance
    else:
        salary = SalaryStructure(
            employee_id=employee.id,
            wage_type=payload.wage_type,
            defined_wage=wage,
            basic_salary=basic,
            hra=hra,
            standard_allowance=standard,
            lta=lta,
            performance_bonus=bonus,
            fixed_allowance=fixed_allowance
        )
        db.add(salary)

    await db.commit()
    await db.refresh(salary)

    return SalaryStructureOut(
        defined_wage=salary.defined_wage,
        wage_type=salary.wage_type,
        basic_salary=salary.basic_salary,
        hra=salary.hra,
        standard_allowance=salary.standard_allowance,
        lta=salary.lta,
        performance_bonus=salary.performance_bonus,
        fixed_allowance=salary.fixed_allowance,
        pf_rate=salary.pf_rate,
        professional_tax=salary.professional_tax
    )


@router.get("/{employee_id}/payslip", response_model=PayslipOut)
async def generate_payslip(
    employee_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Restriction: non-HR/Admin employees can only access their own payslip
    if current_user.role not in ["HR", "Admin"] and current_user.login_id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view other employee payslips."
        )

    # Fetch employee profile
    emp_result = await db.execute(
        select(Employee).filter(Employee.employee_id == employee_id)
    )
    employee = emp_result.scalars().first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found."
        )

    # Fetch salary structure
    sal_result = await db.execute(
        select(SalaryStructure).filter(SalaryStructure.employee_id == employee.id)
    )
    salary = sal_result.scalars().first()
    if not salary:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Salary structure is not defined for this employee yet. Please define it first."
        )

    # Calculate days in the current ongoing month
    today = date.today()
    month_name = today.strftime("%B %Y")
    total_days_in_month = calendar.monthrange(today.year, today.month)[1]

    # Query attendance records for current month
    start_of_month = date(today.year, today.month, 1)
    att_result = await db.execute(
        select(Attendance).filter(
            Attendance.employee_id == employee.id,
            Attendance.date >= start_of_month,
            Attendance.date <= today
        )
    )
    attendance_records = att_result.scalars().all()

    # Calculate unexcused absences and unpaid leaves
    absent_days = sum(1 for att in attendance_records if att.status == "Absent")
    
    # Query approved unpaid leaves for current month
    leave_result = await db.execute(
        select(LeaveRequest).filter(
            LeaveRequest.employee_id == employee.id,
            LeaveRequest.status == "Approved",
            LeaveRequest.leave_type == "Unpaid",
            LeaveRequest.start_date >= start_of_month,
            LeaveRequest.end_date <= today
        )
    )
    unpaid_leaves = leave_result.scalars().all()
    unpaid_leave_days = sum((leave.end_date - leave.start_date).days + 1 for leave in unpaid_leaves)

    deductible_days = absent_days + unpaid_leave_days
    payable_days = max(0, total_days_in_month - deductible_days)

    # Calculate payroll figures
    base_wage = salary.defined_wage
    daily_rate = base_wage / total_days_in_month
    unpaid_leave_deduction = round(daily_rate * deductible_days, 2)

    gross_pay = round(max(0.00, base_wage - unpaid_leave_deduction) + salary.performance_bonus, 2)
    pf_deduction = round(salary.basic_salary * salary.pf_rate, 2)
    pt_deduction = salary.professional_tax
    net_pay = round(max(0.00, gross_pay - pf_deduction - pt_deduction), 2)

    return PayslipOut(
        employee_id=employee_id,
        first_name=employee.first_name,
        last_name=employee.last_name,
        month=month_name,
        total_days_in_month=total_days_in_month,
        payable_days=payable_days,
        base_wage=base_wage,
        gross_pay=gross_pay,
        pf_deduction=pf_deduction,
        pt_deduction=pt_deduction,
        unpaid_leave_deduction=unpaid_leave_deduction,
        net_pay=net_pay
    )
