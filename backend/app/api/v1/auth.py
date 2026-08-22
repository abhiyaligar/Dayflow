from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core import security
from app.core.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.auth import Token, ChangePasswordPayload, LoginPayload
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    payload: LoginPayload | None = None,
    form_data: OAuth2PasswordRequestForm = Depends(None),
    db: AsyncSession = Depends(get_db)
):
    """
    OAuth2 compatible token login, supporting both application/json and application/x-www-form-urlencoded.
    """
    username = None
    password = None

    if payload is not None:
        username = payload.username
        password = payload.password
    elif form_data is not None:
        username = form_data.username
        password = form_data.password

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
