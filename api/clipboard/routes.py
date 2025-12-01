from fastapi import APIRouter, Depends
from api.clipboard.auth import (
    register_user,
    authenticate_user,
    create_access_token,
    get_current_user,
    verify_email_verification_token,
    clipboard_users,
)

router = APIRouter()

# ==========================
# REGISTER
# ==========================
@router.post("/auth/register")
def register(email: str, password: str):
    token = register_user(email, password)

    verification_link = f"http://localhost:8000/clipboard/auth/verify?token={token}"

    return {
        "message": "User registered. Please verify email.",
        "verification_link": verification_link,
    }

# ==========================
# VERIFY EMAIL
# ==========================
@router.get("/auth/verify")
def verify_email(token: str):
    email = verify_email_verification_token(token)
    if not email:
        return {"error": "Invalid or expired token"}

    user = clipboard_users.get(email)
    if not user:
        return {"error": "User not found"}

    user["is_verified"] = True
    user["verification_token"] = None

    return {"message": "Email verified successfully"}

# ==========================
# LOGIN
# ==========================
@router.post("/auth/login")
def login(email: str, password: str):
    user = authenticate_user(email, password)
    if not user:
        return {"error": "Invalid credentials"}

    token = create_access_token({"sub": email})
    return {"access_token": token, "token_type": "bearer"}

# ==========================
# PROTECTED ROUTE
# ==========================
@router.get("/auth/me")
def me(current_user=Depends(get_current_user)):
    return current_user
