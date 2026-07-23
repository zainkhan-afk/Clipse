import os
import smtplib
import ssl
from email.message import EmailMessage

APP_NAME = "Clipse"

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASS = os.environ.get("SMTP_PASS")
SMTP_FROM = os.environ.get("SMTP_FROM") or SMTP_USER


def send_email(to: str, subject: str, text: str, html: str):
    if not (SMTP_USER and SMTP_PASS):
        raise RuntimeError("SMTP is not configured (set SMTP_USER and SMTP_PASS)")

    msg = EmailMessage()
    msg["From"] = f"{APP_NAME} <{SMTP_FROM}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")

    context = ssl.create_default_context()
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
        server.starttls(context=context)
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)


def send_verification_email(to: str, first_name: str, verify_url: str):
    name = first_name or "there"
    subject = f"Confirm your email for {APP_NAME}"
    text = (
        f"Hi {name},\n\n"
        f"Confirm your email to activate your {APP_NAME} account:\n{verify_url}\n\n"
        "This link expires in 24 hours. If you didn't sign up, you can ignore this email."
    )
    html = f"""\
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="margin:0 0 8px">Confirm your email</h2>
  <p style="color:#555;margin:0 0 20px">Hi {name}, tap the button below to activate your {APP_NAME} account.</p>
  <a href="{verify_url}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">Verify email</a>
  <p style="color:#888;font-size:13px;margin:20px 0 0">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
  <p style="color:#aaa;font-size:12px;margin:12px 0 0;word-break:break-all">{verify_url}</p>
</div>"""
    send_email(to, subject, text, html)