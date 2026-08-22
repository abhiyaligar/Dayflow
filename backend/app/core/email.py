import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, html_content: str):
    if not settings.SMTP_HOST or not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.warning(
            f"SMTP is not fully configured. Email to {to_email} with subject '{subject}' was not sent."
        )
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME}>"
        msg["To"] = to_email

        part = MIMEText(html_content, "html")
        msg.attach(part)

        # Connect to SMTP server
        if settings.SMTP_SSL:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            if settings.SMTP_TLS:
                server.starttls()

        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME, to_email, msg.as_string())
        server.quit()
        logger.info(f"Successfully sent email to {to_email} with subject: {subject}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")


def send_onboarding_email(email: str, login_id: str, temp_password: str, first_name: str):
    subject = "Welcome to Dayflow - Your Onboarding Credentials"
    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to Dayflow</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f6f8;
            color: #333333;
            margin: 0;
            padding: 0;
        }}
        .container {{
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }}
        .header {{
            background-color: #1e3a8a;
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 24px;
        }}
        .content {{
            padding: 40px 30px;
            line-height: 1.6;
        }}
        .welcome-text {{
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
        }}
        .credentials-box {{
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            padding: 20px;
            margin: 25px 0;
        }}
        .credential-row {{
            margin: 10px 0;
            font-size: 16px;
        }}
        .label {{
            font-weight: bold;
            color: #1e3a8a;
            display: inline-block;
            width: 180px;
        }}
        .value {{
            font-family: 'Courier New', Courier, monospace;
            background-color: #ffffff;
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid #d1d5db;
        }}
        .button-container {{
            text-align: center;
            margin-top: 30px;
        }}
        .button {{
            background-color: #2563eb;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 30px;
            font-size: 16px;
            font-weight: bold;
            border-radius: 6px;
            display: inline-block;
        }}
        .footer {{
            background-color: #f9fafb;
            color: #6b7280;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Dayflow</h1>
        </div>
        <div class="content">
            <div class="welcome-text">Hello {first_name},</div>
            <p>Welcome to the team! Your employee profile has been successfully onboarded into Dayflow Human Resource Management System.</p>
            <p>Please find your temporary login credentials below:</p>
            
            <div class="credentials-box">
                <div class="credential-row">
                    <span class="label">Employee ID / User ID:</span>
                    <span class="value">{login_id}</span>
                </div>
                <div class="credential-row">
                    <span class="label">Company Email:</span>
                    <span class="value">{email}</span>
                </div>
                <div class="credential-row">
                    <span class="label">Temporary Password:</span>
                    <span class="value">{temp_password}</span>
                </div>
            </div>
            
            <p><strong>Note:</strong> For security reasons, you will be prompted to change this temporary password during your first login.</p>
            
            <div class="button-container">
                <a href="http://localhost:5173" class="button">Log In to Dayflow</a>
            </div>
        </div>
        <div class="footer">
            &copy; 2026 Dayflow HRMS. All rights reserved.<br>
            This is an automated system email. Please do not reply to this address.
        </div>
    </div>
</body>
</html>
"""
    send_email(email, subject, html_content)
