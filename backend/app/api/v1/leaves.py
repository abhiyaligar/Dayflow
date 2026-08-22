from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_current_hr_user
from app.database import get_db
from app.models.user import User
from app.models.employee import Employee
from app.models.leave import LeaveRequest
from app.models.attendance import Attendance
from app.schemas.leave import LeaveRequestCreate, LeaveRequestOut, LeaveReviewPayload

router = APIRouter()


@router.post("/request", response_model=LeaveRequestOut, status_code=status.HTTP_201_CREATED)
async def apply_for_leave(
    payload: LeaveRequestCreate,
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

    if payload.start_date > payload.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date cannot be after end date."
        )

    new_leave = LeaveRequest(
        employee_id=employee.id,
        leave_type=payload.leave_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        remarks=payload.remarks,
        status="Pending"
    )
    db.add(new_leave)
    await db.commit()
    await db.refresh(new_leave)

    return LeaveRequestOut(
        id=new_leave.id,
        employee_id=employee.employee_id,
        leave_type=new_leave.leave_type,
        start_date=new_leave.start_date,
        end_date=new_leave.end_date,
        remarks=new_leave.remarks,
        status=new_leave.status,
        admin_comments=new_leave.admin_comments,
        requested_at=new_leave.requested_at
    )


@router.patch("/{leave_id}/review", response_model=LeaveRequestOut)
async def review_leave_request(
    leave_id: str,
    payload: LeaveReviewPayload,
    current_user: User = Depends(get_current_hr_user),
    db: AsyncSession = Depends(get_db)
):
    import uuid
    try:
        leave_uuid = uuid.UUID(leave_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Leave Request ID format."
        )

    # Fetch leave request
    leave_result = await db.execute(
        select(LeaveRequest)
        .filter(LeaveRequest.id == leave_uuid)
        .options(selectinload(LeaveRequest.employee))
    )
    leave = leave_result.scalars().first()
    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found."
        )

    # Fetch reviewer employee profile
    reviewer_result = await db.execute(
        select(Employee).filter(Employee.user_id == current_user.id)
    )
    reviewer = reviewer_result.scalars().first()
    if not reviewer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reviewer employee profile not found."
        )

    leave.status = payload.status
    leave.admin_comments = payload.admin_comments
    leave.reviewed_by = reviewer.id
    leave.reviewed_at = datetime.utcnow()

    db.add(leave)

    # Propagate immediately to attendance table if APPROVED
    if payload.status == "Approved":
        current_date = leave.start_date
        while current_date <= leave.end_date:
            # Check if attendance entry already exists
            att_result = await db.execute(
                select(Attendance).filter(
                    Attendance.employee_id == leave.employee_id,
                    Attendance.date == current_date
                )
            )
            attendance = att_result.scalars().first()

            if attendance:
                attendance.status = "Leave"
                db.add(attendance)
            else:
                new_attendance = Attendance(
                    employee_id=leave.employee_id,
                    date=current_date,
                    status="Leave"
                )
                db.add(new_attendance)

            current_date += timedelta(days=1)

    await db.commit()
    await db.refresh(leave)

    return LeaveRequestOut(
        id=leave.id,
        employee_id=leave.employee.employee_id,
        leave_type=leave.leave_type,
        start_date=leave.start_date,
        end_date=leave.end_date,
        remarks=leave.remarks,
        status=leave.status,
        admin_comments=leave.admin_comments,
        requested_at=leave.requested_at
    )
