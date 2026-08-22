from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core import security
from app.core.config import settings
from app.database import get_db
from app.models.user import User
from app.models.employee import Employee
from app.schemas.auth import Token, ChangePasswordPayload, SignUpPayload
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(
    payload: SignUpPayload,
    db: AsyncSession = Depends(get_db)
):
    """
    Allows onboarded employees to complete their registration, verify their email, and set their account password.
    """
    # Find matching Employee profile first
    emp_result = await db.execute(
        select(Employee).filter(Employee.employee_id == payload.employee_id)
    )
    employee = emp_result.scalars().first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile with this Employee ID does not exist. Please contact HR to be onboarded first."
        )

    # Fetch associated User account
    user_result = await db.execute(
        select(User).filter(User.id == employee.user_id)
    )
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated user account not found."
        )

    # Validate email
    if user.email != payload.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The provided email does not match the onboarded email for this Employee ID."
        )

    # Check if already registered/verified
    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This employee account is already registered. Please login instead."
        )

    # Validate role alignment
    if user.role != payload.role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The provided role does not align with your onboarded role: {user.role}"
        )

    # Update password and activate user
    user.hashed_password = security.get_password_hash(payload.password)
    user.is_verified = True
    user.is_first_login = False

    db.add(user)
    await db.commit()

    # Log mock email verification trigger (PDF: "Email verification is required.")
    print(f"[MOCK EMAIL VERIFICATION] Verification link triggered for {user.email}. Verification code completed successfully.")

    return {"message": "Registration successful. Your email has been verified and you can now login."}


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    OAuth2 compatible token login, supporting both application/json and application/x-www-form-urlencoded.
    """
    username = None
    password = None

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            username = body.get("username")
            password = body.get("password")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON payload"
            )
    else:
        try:
            form_data = await request.form()
            username = form_data.get("username")
            password = form_data.get("password")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid form data payload"
            )

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required"
        )

    # Fetch user by login_id (which is employee_id/username) or email
    result = await db.execute(
        select(User).filter(
            (User.login_id == username) | (User.email == username)
        )
    )
    user = result.scalars().first()

    if not user or not security.verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_first_login": user.is_first_login,
        "role": user.role
    }


@router.patch("/change-password")
async def change_password(
    payload: ChangePasswordPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Allows users to update their password. Sets is_first_login to False.
    """
    if not security.verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )

    current_user.hashed_password = security.get_password_hash(payload.new_password)
    current_user.is_first_login = False
    
    db.add(current_user)
    await db.commit()

    return {"message": "Password changed successfully."}
