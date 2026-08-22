from pydantic import BaseModel, EmailStr


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
