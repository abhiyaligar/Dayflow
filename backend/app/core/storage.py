import os
import uuid
from fastapi import UploadFile
from app.core.config import settings

# Determine local upload directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STATIC_DIR = os.path.join(BASE_DIR, "static")
UPLOAD_DIR = os.path.join(STATIC_DIR, "uploads")


async def save_file(file: UploadFile) -> str:
    # Generate unique filename to avoid collisions
    ext = os.path.splitext(file.filename or "")[1]
    unique_filename = f"{uuid.uuid4()}{ext}"

    # Check if AWS settings are provided
    if (
        settings.AWS_ACCESS_KEY_ID
        and settings.AWS_SECRET_ACCESS_KEY
        and settings.AWS_S3_BUCKET_NAME
    ):
        import boto3

        s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )
        contents = await file.read()
        s3_client.put_object(
            Bucket=settings.AWS_S3_BUCKET_NAME,
            Key=unique_filename,
            Body=contents,
            ContentType=file.content_type or "application/octet-stream",
        )
        # Construct and return S3 bucket URL
        return f"https://{settings.AWS_S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{unique_filename}"
    else:
        # Fallback offline local storage
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        return f"/static/uploads/{unique_filename}"


async def delete_file(file_url: str) -> None:
    if not file_url:
        return

    # Check if it is a local relative URL
    if file_url.startswith("/static/uploads/"):
        filename = file_url.split("/")[-1]
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
    else:
        # Attempt to delete from S3
        if (
            settings.AWS_ACCESS_KEY_ID
            and settings.AWS_SECRET_ACCESS_KEY
            and settings.AWS_S3_BUCKET_NAME
        ):
            try:
                import boto3

                s3_client = boto3.client(
                    "s3",
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION,
                )
                filename = file_url.split("/")[-1]
                s3_client.delete_object(
                    Bucket=settings.AWS_S3_BUCKET_NAME, Key=filename
                )
            except Exception:
                # Silently ignore storage deletion errors to avoid crashing requests
                pass
