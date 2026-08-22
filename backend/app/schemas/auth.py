import re
from pydantic import BaseModel, EmailStr, field_validator, Field


class Token(BaseModel):
    access_token: str
    token_type: str
    is_first_login: bool
    role: str


class TokenPayload(BaseModel):
    sub: str | None = None


class LoginPayload(BaseModel):
    username: str
    password: str


class ChangePasswordPayload(BaseModel):
    old_password: str
    new_password: str


class SignUpPayload(BaseModel):
    employee_id: str
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: str

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit.")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character.")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ["Employee", "HR"]:
            raise ValueError("Role must be either 'Employee' or 'HR'.")
        return v
