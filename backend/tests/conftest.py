import asyncio
import pytest
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.core import security
from app.core.config import settings
from app.models.user import User
from app.models.employee import Employee

# Ensure offline test isolation by disabling live AWS S3 settings during tests
settings.AWS_ACCESS_KEY_ID = None
settings.AWS_SECRET_ACCESS_KEY = None
settings.AWS_S3_BUCKET_NAME = None

# Create in-memory SQLite async engine
DATABASE_URL = "sqlite+aiosqlite:///:memory:"
engine = create_async_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)



@pytest.fixture(scope="session", autouse=True)
async def init_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


from sqlalchemy import delete
from app.models.attendance import Attendance
from app.models.leave import LeaveRequest
from app.models.salary import SalaryStructure
from app.models.document import Document


@pytest.fixture(autouse=True)
async def clear_db(db: AsyncSession):
    yield
    await db.execute(delete(User))
    await db.execute(delete(Employee))
    await db.execute(delete(Attendance))
    await db.execute(delete(LeaveRequest))
    await db.execute(delete(SalaryStructure))
    await db.execute(delete(Document))
    await db.commit()


@pytest.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session


# Override DB dependency
async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://testserver"
    ) as ac:
        yield ac


@pytest.fixture
async def seeded_users(db: AsyncSession):
    # Seed HR User
    hr_pwd = security.get_password_hash("AdminPassword123")
    hr_user = User(
        login_id="DF-2026-0001",
        email="hr@dayflow.com",
        hashed_password=hr_pwd,
        role="HR",
        is_verified=True,
        is_first_login=False
    )
    db.add(hr_user)
    await db.flush()

    hr_employee = Employee(
        user_id=hr_user.id,
        employee_id="DF-2026-0001",
        first_name="Admin",
        last_name="HR",
        designation="HR Manager",
        department="Human Resources"
    )
    db.add(hr_employee)

    # Seed Employee User
    emp_pwd = security.get_password_hash("EmpPassword123")
    emp_user = User(
        login_id="JODO2026001",
        email="john@dayflow.com",
        hashed_password=emp_pwd,
        role="Employee",
        is_verified=True,
        is_first_login=True
    )
    db.add(emp_user)
    await db.flush()

    emp_employee = Employee(
        user_id=emp_user.id,
        employee_id="JODO2026001",
        first_name="John",
        last_name="Doe",
        designation="Software Engineer",
        department="Engineering"
    )
    db.add(emp_employee)
    
    await db.commit()

    return {
        "hr_user": hr_user,
        "emp_user": emp_user,
        "hr_employee": hr_employee,
        "emp_employee": emp_employee,
    }
