import uuid
from datetime import datetime, date
from sqlalchemy import String, Text, Date, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )
    employee_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )
    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )
    address: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )
    profile_picture_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )
    designation: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )
    department: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )
    company_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        default="Odoo India"
    )
    joining_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="employee"
    )
    documents: Mapped[list["Document"]] = relationship(
        "Document",
        back_populates="employee",
        cascade="all, delete-orphan"
    )
