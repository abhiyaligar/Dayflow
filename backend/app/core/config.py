import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_ENV: str = "development"
    DATABASE_URL: str

    # JWT Settings
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Initial Admin Settings
    INITIAL_ADMIN_EMAIL: str = "admin@dayflow.com"
    INITIAL_ADMIN_PASSWORD: str = "SecurePassword123!"
    INITIAL_ADMIN_ID: str = "DF-2026-0001"

    # AWS S3 Settings for Document Management
    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET_NAME: str | None = None


settings = Settings()
