import uuid
from datetime import datetime, date
from sqlalchemy import String, Date, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Attendance(Base):
    __tablename__ = "attendance"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False
    )
    date: Mapped[date] = mapped_column(
        Date,
        index=True,
        nullable=False
    )
    check_in: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )
    check_out: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )
    breaks: Mapped[list | None] = mapped_column(
        JSONB,
        default=list,
        nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="Present",
        nullable=False
    )  # "Present" | "Absent" | "Half-day" | "Leave"
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Relationships
    employee = relationship("Employee")

    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="uq_employee_date"),
    )
