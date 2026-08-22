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
        import re

        endpoint_url = settings.AWS_S3_ENDPOINT_URL
        aws_access_key_id = settings.AWS_ACCESS_KEY_ID
        aws_secret_access_key = settings.AWS_SECRET_ACCESS_KEY

        # Extra fallback: if AWS_ACCESS_KEY_ID was mistakenly set to the endpoint URL, treat it as endpoint
        if aws_access_key_id and (aws_access_key_id.startswith("http://") or aws_access_key_id.startswith("https://")):
            if not endpoint_url:
                endpoint_url = aws_access_key_id

        client_kwargs = {
            "aws_access_key_id": aws_access_key_id,
            "aws_secret_access_key": aws_secret_access_key,
            "region_name": settings.AWS_REGION,
        }
        if endpoint_url:
            client_kwargs["endpoint_url"] = endpoint_url

        s3_client = boto3.client("s3", **client_kwargs)
        contents = await file.read()
        s3_client.put_object(
            Bucket=settings.AWS_S3_BUCKET_NAME,
            Key=unique_filename,
            Body=contents,
            ContentType=file.content_type or "application/octet-stream",
        )
        
        # Construct and return Supabase or standard S3 bucket URL
        if endpoint_url and "supabase.co" in endpoint_url:
            match = re.search(r"https://([^.]+)\.(?:storage\.)?supabase\.co", endpoint_url)
            if match:
                project_ref = match.group(1)
                return f"https://{project_ref}.supabase.co/storage/v1/object/public/{settings.AWS_S3_BUCKET_NAME}/{unique_filename}"
            else:
                return f"{endpoint_url.rstrip('/')}/object/public/{settings.AWS_S3_BUCKET_NAME}/{unique_filename}"

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

                endpoint_url = settings.AWS_S3_ENDPOINT_URL
                aws_access_key_id = settings.AWS_ACCESS_KEY_ID
                aws_secret_access_key = settings.AWS_SECRET_ACCESS_KEY

                # Extra fallback: if AWS_ACCESS_KEY_ID was mistakenly set to the endpoint URL, treat it as endpoint
                if aws_access_key_id and (aws_access_key_id.startswith("http://") or aws_access_key_id.startswith("https://")):
                    if not endpoint_url:
                        endpoint_url = aws_access_key_id

                client_kwargs = {
                    "aws_access_key_id": aws_access_key_id,
                    "aws_secret_access_key": aws_secret_access_key,
                    "region_name": settings.AWS_REGION,
                }
                if endpoint_url:
                    client_kwargs["endpoint_url"] = endpoint_url

                s3_client = boto3.client("s3", **client_kwargs)
                filename = file_url.split("/")[-1]
                s3_client.delete_object(
                    Bucket=settings.AWS_S3_BUCKET_NAME, Key=filename
                )
            except Exception:
                # Silently ignore storage deletion errors to avoid crashing requests
                pass
