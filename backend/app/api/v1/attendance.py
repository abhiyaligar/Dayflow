from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_current_hr_user
from app.database import get_db
from app.models.user import User
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.schemas.attendance import AttendanceOut, TodayAttendanceOut

router = APIRouter()


def calculate_working_hours(
    check_in: datetime | None, check_out: datetime | None, breaks: list
) -> float:
    if not check_in or not check_out:
        return 0.0
    
    total_delta = check_out - check_in
    total_seconds = total_delta.total_seconds()

    # Subtract breaks
    break_seconds = 0.0
    for b in breaks:
        start_str = b.get("start")
        end_str = b.get("end")
        if start_str and end_str:
            try:
                start_dt = datetime.fromisoformat(start_str)
                end_dt = datetime.fromisoformat(end_str)
                break_seconds += (end_dt - start_dt).total_seconds()
            except ValueError:
                continue

    worked_seconds = max(0.0, total_seconds - break_seconds)
    return round(worked_seconds / 3600.0, 2)


@router.post("/check-in", response_model=AttendanceOut)
async def check_in(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Retrieve employee profile
    result = await db.execute(
        select(Employee).filter(Employee.user_id == current_user.id)
    )
    employee = result.scalars().first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found."
        )

    today = date.today()
    # Check if already logged today
    att_result = await db.execute(
        select(Attendance).filter(
            Attendance.employee_id == employee.id,
            Attendance.date == today
        )
    )
    attendance = att_result.scalars().first()

    if attendance:
        if attendance.check_in:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already checked-in today."
            )
        attendance.check_in = datetime.utcnow()
        attendance.status = "Present"
    else:
        attendance = Attendance(
            employee_id=employee.id,
            date=today,
            check_in=datetime.utcnow(),
            status="Present",
            breaks=[]
        )
        db.add(attendance)

    await db.commit()
    await db.refresh(attendance)

    return AttendanceOut(
        date=attendance.date,
        check_in=attendance.check_in,
        check_out=attendance.check_out,
        breaks=attendance.breaks or [],
        status=attendance.status,
        total_hours=0.0
    )


@router.post("/check-out", response_model=AttendanceOut)
async def check_out(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Employee).filter(Employee.user_id == current_user.id)
    )
    employee = result.scalars().first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found."
        )

    today = date.today()
    att_result = await db.execute(
        select(Attendance).filter(
            Attendance.employee_id == employee.id,
            Attendance.date == today
        )
    )
    attendance = att_result.scalars().first()

    if not attendance or not attendance.check_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must check-in first before checking-out."
        )

    if attendance.check_out:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already checked-out today."
        )

    attendance.check_out = datetime.utcnow()
    await db.commit()
    await db.refresh(attendance)

    total_hours = calculate_working_hours(
        attendance.check_in, attendance.check_out, attendance.breaks or []
    )

    return AttendanceOut(
        date=attendance.date,
        check_in=attendance.check_in,
        check_out=attendance.check_out,
        breaks=attendance.breaks or [],
        status=attendance.status,
        total_hours=total_hours
    )


@router.get("/me", response_model=list[AttendanceOut])
async def get_my_attendance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Employee).filter(Employee.user_id == current_user.id)
    )
    employee = result.scalars().first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found."
        )

    # Filter for the current ongoing month
    today = date.today()
    start_of_month = date(today.year, today.month, 1)
    
    att_result = await db.execute(
        select(Attendance)
        .filter(
            Attendance.employee_id == employee.id,
            Attendance.date >= start_of_month,
            Attendance.date <= today
        )
        .order_by(Attendance.date.asc())
    )
    logs = att_result.scalars().all()

    return [
        AttendanceOut(
            date=log.date,
            check_in=log.check_in,
            check_out=log.check_out,
            breaks=log.breaks or [],
            status=log.status,
            total_hours=calculate_working_hours(log.check_in, log.check_out, log.breaks or [])
        )
        for log in logs
    ]


@router.get("/today", response_model=list[TodayAttendanceOut])
async def get_today_present_employees(
    current_user: User = Depends(get_current_hr_user),
    db: AsyncSession = Depends(get_db)
):
    today = date.today()
    # Find all employees and load their attendance logs for today
    result = await db.execute(
        select(Employee)
    )
    employees = result.scalars().all()

    output = []
    for emp in employees:
        att_res = await db.execute(
            select(Attendance).filter(
                Attendance.employee_id == emp.id,
                Attendance.date == today
            )
        )
        att = att_res.scalars().first()

        check_in = att.check_in if att else None
        check_out = att.check_out if att else None
        status_val = att.status if att else "Absent"

        output.append(
            TodayAttendanceOut(
                employee_id=emp.employee_id,
                first_name=emp.first_name,
                last_name=emp.last_name,
                check_in=check_in,
                check_out=check_out,
                status=status_val
            )
        )

    return output
