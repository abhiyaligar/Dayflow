import uuid
from datetime import datetime
from sqlalchemy import String, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class SalaryStructure(Base):
    __tablename__ = "salary_structures"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("employees.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )
    wage_type: Mapped[str] = mapped_column(
        String(50),
        default="Fixed",
        nullable=False
    )
    defined_wage: Mapped[float] = mapped_column(
        Numeric(12, 2),
        default=0.00,
        nullable=False
    )
    basic_salary: Mapped[float] = mapped_column(
        Numeric(12, 2),
        default=0.00,
        nullable=False
    )
    hra: Mapped[float] = mapped_column(
        Numeric(12, 2),
        default=0.00,
        nullable=False
    )
    standard_allowance: Mapped[float] = mapped_column(
        Numeric(12, 2),
        default=0.00,
        nullable=False
    )
    lta: Mapped[float] = mapped_column(
        Numeric(12, 2),
        default=0.00,
        nullable=False
    )
    performance_bonus: Mapped[float] = mapped_column(
        Numeric(12, 2),
        default=0.00,
        nullable=False
    )
    fixed_allowance: Mapped[float] = mapped_column(
        Numeric(12, 2),
        default=0.00,
        nullable=False
    )
    pf_rate: Mapped[float] = mapped_column(
        Numeric(5, 4),
        default=0.1200,
        nullable=False
    )
    professional_tax: Mapped[float] = mapped_column(
        Numeric(12, 2),
        default=200.00,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    employee = relationship("Employee")
