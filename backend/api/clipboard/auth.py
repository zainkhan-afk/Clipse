import os
import re
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException
from api.clipboard import models
from api.core.database import SessionLocal
from api.clipboard.service import create_clipboard
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
from fastapi import Request

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("SECRET_KEY", "CLIPBOARD_SECRET_KEY_SHOULD_BE_LONG")
EMAIL_VERIFY_SECRET_KEY = os.environ.get("EMAIL_VERIFY_SECRET_KEY", "CLIPBOARD_EMAIL_VERIFY_SECRET_KEY_SHOULD_BE_LONG")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SECONDS = 60*60
# 30 days. This slides forward on every /auth/refresh (see routes.py), so an
# actively-used account effectively stays logged in indefinitely — you'd have to
# not open the app for a full 30 days to be signed out.
REFRESH_TOKEN_EXPIRE_SECONDS = 60*60*24*30
REFRESH_SECRET_KEY = os.environ.get("REFRESH_SECRET_KEY", "CLIPBOARD_REFRESH_SECRET_KEY_SHOULD_BE_LONG")
PASSWORD_RESET_SECRET_KEY = os.environ.get("PASSWORD_RESET_SECRET_KEY", "CLIPBOARD_PASSWORD_RESET_SECRET_KEY_SHOULD_BE_LONG")

# When true (local/dev only), registration creates an already-verified account and
# sends no verification email. Never enable this in production.
SKIP_EMAIL_VERIFICATION = os.environ.get("SKIP_EMAIL_VERIFICATION", "").lower() in ("1", "true", "yes")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")




# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")

        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(models.User).filter(
        models.User.email == email
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")

    return user


# Password helpers
def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(password, hashed):
    return pwd_context.verify(password, hashed)

MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 72  # bcrypt only hashes the first 72 bytes

def password_problem(password: str):
    """Return a human-readable reason the password is unacceptable, or None if it's OK."""
    if not password or len(password) < MIN_PASSWORD_LENGTH:
        return f"Password must be at least {MIN_PASSWORD_LENGTH} characters."
    if len(password.encode("utf-8")) > MAX_PASSWORD_LENGTH:
        return f"Password must be at most {MAX_PASSWORD_LENGTH} characters."
    if not re.search(r"[A-Za-z]", password):
        return "Password must contain at least one letter."
    if not re.search(r"[0-9]", password):
        return "Password must contain at least one number."
    return None

def update_user_password(db: Session, user, new_password: str):
    # Receiving the reset email proves control of the address, so also mark the
    # account verified in case it never was.
    user.password_hash = hash_password(new_password)
    user.is_verified = True
    db.commit()

# JWT helpers
def create_access_token(data: dict, expires_seconds=ACCESS_TOKEN_EXPIRE_SECONDS):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(seconds=expires_seconds)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(seconds=REFRESH_TOKEN_EXPIRE_SECONDS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)

def create_email_verification_token(email: str):
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode = {"sub": email, "exp": expire}
    return jwt.encode(to_encode, EMAIL_VERIFY_SECRET_KEY, algorithm=ALGORITHM)

def verify_email_verification_token(token: str):
    from jose import JWTError, jwt
    try:
        payload = jwt.decode(token, EMAIL_VERIFY_SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None

def create_password_reset_token(email: str):
    expire = datetime.utcnow() + timedelta(hours=1)
    to_encode = {"sub": email, "exp": expire}
    return jwt.encode(to_encode, PASSWORD_RESET_SECRET_KEY, algorithm=ALGORITHM)

def verify_password_reset_token(token: str):
    try:
        payload = jwt.decode(token, PASSWORD_RESET_SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None

# User helpers
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def register_user(db: Session, email: str, password: str, first_name: str, last_name: str):
    user = get_user_by_email(db, email)
    if user:
        raise Exception("User already exists")
    
    verification_token = create_email_verification_token(email)
    new_user = models.User(
        email=email,
        password_hash=hash_password(password),
        first_name = first_name,
        last_name = last_name,
        verification_token=verification_token,
        is_verified=SKIP_EMAIL_VERIFICATION,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    clipboard = create_clipboard(db, user_id=new_user.id, name = "main")
    
    return new_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    if not user.is_verified:
        return None
    return user



def verify_refresh_token(token: str):
    try:
        payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None