from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext

# ==================================================
# CONFIG (Unique for Clipboard App)
# ==================================================
SECRET_KEY = "CLIPBOARD_SECRET_KEY_SHOULD_BE_LONG"
EMAIL_VERIFY_SECRET_KEY = "CLIPBOARD_EMAIL_VERIFY_SECRET_KEY_SHOULD_BE_LONG"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# This points to clipboard login endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/clipboard/auth/login")

# ==================================================
# IN-MEMORY DATABASE (Replace with real DB later)
# ==================================================
clipboard_users = {}

"""
User structure:
{
  "email": str,
  "password_hash": str,
  "is_verified": bool,
  "verification_token": str | None
}
"""

# ==================================================
# PASSWORD HELPERS
# ==================================================
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)

# ==================================================
# JWT HELPERS
# ==================================================
def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_email_verification_token(email: str):
    expire = datetime.utcnow() + timedelta(minutes=30)
    data = {"sub": email, "exp": expire}
    return jwt.encode(data, EMAIL_VERIFY_SECRET_KEY, algorithm=ALGORITHM)


def verify_email_verification_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, EMAIL_VERIFY_SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


# ==================================================
# USER HELPERS
# ==================================================
def get_user(email: str):
    return clipboard_users.get(email)


def register_user(email: str, password: str):
    if email in clipboard_users:
        raise HTTPException(400, "User already exists")

    verification_token = create_email_verification_token(email)

    clipboard_users[email] = {
        "email": email,
        "password_hash": hash_password(password),
        "is_verified": False,
        "verification_token": verification_token,
    }

    return verification_token


def authenticate_user(email: str, password: str):
    user = get_user(email)
    if not user:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    if not user["is_verified"]:
        raise HTTPException(403, "Email not verified")
    return user


# ==================================================
# CURRENT USER DEPENDENCY
# ==================================================
def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = get_user(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user["is_verified"]:
        raise HTTPException(status_code=403, detail="Email not verified")

    return user
