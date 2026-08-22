import uuid
from datetime import datetime, date
from sqlalchemy import String, Date, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

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
    leave_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )  # "Paid" | "Sick" | "Unpaid"
    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )
    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )
    remarks: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(50),
        default="Pending",
        nullable=False
    )  # "Pending" | "Approved" | "Rejected"
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True
    )
    admin_comments: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )
    requested_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    # Relationships
    employee = relationship("Employee", foreign_keys=[employee_id])
    reviewer = relationship("Employee", foreign_keys=[reviewed_by])
