import uuid
from datetime import datetime, date
from pydantic import BaseModel


class LeaveRequestCreate(BaseModel):
    leave_type: str  # "Paid" | "Sick" | "Unpaid"
    start_date: date
    end_date: date
    remarks: str | None = None


class LeaveReviewPayload(BaseModel):
    status: str  # "Approved" | "Rejected"
    admin_comments: str | None = None


class LeaveRequestOut(BaseModel):
    id: uuid.UUID
    employee_id: str
    leave_type: str
    start_date: date
    end_date: date
    remarks: str | None = None
    status: str
    admin_comments: str | None = None
    requested_at: datetime
