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
SECRET_KEY = "CLIPBOARD_SECRET_KEY_SHOULD_BE_LONG"
EMAIL_VERIFY_SECRET_KEY = "CLIPBOARD_EMAIL_VERIFY_SECRET_KEY_SHOULD_BE_LONG"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 360
REFRESH_TOKEN_EXPIRE_DAYS = 7
REFRESH_SECRET_KEY = "CLIPBOARD_REFRESH_SECRET_KEY_SHOULD_BE_LONG"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/clipboard/auth/login")




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
    token = request.cookies.get("token")

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

# JWT helpers
def create_access_token(data: dict, expires_minutes=ACCESS_TOKEN_EXPIRE_MINUTES):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)

def create_email_verification_token(email: str):
    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode = {"sub": email, "exp": expire}
    return jwt.encode(to_encode, EMAIL_VERIFY_SECRET_KEY, algorithm=ALGORITHM)

def verify_email_verification_token(token: str):
    from jose import JWTError, jwt
    try:
        payload = jwt.decode(token, EMAIL_VERIFY_SECRET_KEY, algorithms=[ALGORITHM])
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
        is_verified=True,
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