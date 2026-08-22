import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core import security
from app.models.user import User
from app.models.employee import Employee

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed_initial_admin(db: AsyncSession) -> None:
    """
    Seeds the initial Admin/HR user into the database if not present.
    """
    # Check if any user with admin email or ID exists
    result = await db.execute(
        select(User).filter(
            (User.email == settings.INITIAL_ADMIN_EMAIL) | 
            (User.login_id == settings.INITIAL_ADMIN_ID)
        )
    )
    admin_user = result.scalars().first()

    if admin_user:
        logger.info("Initial Admin/HR user already exists. Skipping seed.")
        return

    logger.info("Seeding initial Admin/HR user...")
    
    # Create User
    new_admin = User(
        login_id=settings.INITIAL_ADMIN_ID,
        email=settings.INITIAL_ADMIN_EMAIL,
        hashed_password=security.get_password_hash(settings.INITIAL_ADMIN_PASSWORD),
        role="HR",
        is_verified=True,
        is_first_login=False
    )
    db.add(new_admin)
    await db.flush()  # Obtain new_admin.id for relationship

    # Create Employee profile
    new_employee = Employee(
        user_id=new_admin.id,
        employee_id=settings.INITIAL_ADMIN_ID,
        first_name="Admin",
        last_name="HR",
        designation="HR Manager",
        department="Human Resources"
    )
    db.add(new_employee)
    await db.commit()
    
    logger.info("Successfully seeded initial Admin/HR user!")
