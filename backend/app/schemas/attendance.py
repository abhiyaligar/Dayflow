from datetime import datetime, date
from pydantic import BaseModel


class BreakInterval(BaseModel):
    start: datetime
    end: datetime | None = None


class AttendanceOut(BaseModel):
    date: date
    check_in: datetime | None = None
    check_out: datetime | None = None
    breaks: list = []
    status: str
    total_hours: float = 0.0


class TodayAttendanceOut(BaseModel):
    employee_id: str
    first_name: str
    last_name: str
    check_in: datetime | None = None
    check_out: datetime | None = None
    status: str
