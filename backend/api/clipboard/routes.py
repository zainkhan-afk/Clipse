from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.clipboard import auth
from api.clipboard.schemas import RegisterRequest, LoginRequest\
                                , MeResponse, ClipboardsResponse\
                                , CurrentClipboardData, ClipboardAddMessageRequest\
                                

from api.clipboard.service import get_clipboards \
                                , get_all_current_clipboard_data \
                                , add_clipboard_data

router = APIRouter()

@router.post("/auth/register")
def register(request: RegisterRequest, db: Session = Depends(auth.get_db)):
    print(request)
    try:
        user = auth.register_user(db, request.email, request.password, request.first_name, request.last_name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    verification_link = f"http://localhost:8000/clipboard/auth/verify?token={user.verification_token}"
    return {"message": "Registered", "verification_link": verification_link}

@router.get("/auth/verify")
def verify_email(token: str, db: Session = Depends(auth.get_db)):
    email = auth.verify_email_verification_token(token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    user = auth.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        return {"message": "Email already verified"}

    user.is_verified = True
    user.verification_token = None
    db.commit()
    return {"message": "Email verified successfully"}

@router.post("/auth/login")
def login(request: LoginRequest, db: Session = Depends(auth.get_db)):
    user = auth.authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials or email not verified")
    token = auth.create_access_token({"sub": request.email})
    return {"access_token": token, "token_type": "bearer"}


# ==========================
# PROTECTED ROUTE
# ==========================
@router.get("/auth/me", response_model=MeResponse)
def me(current_user=Depends(auth.get_current_user)):
    user_data = MeResponse(
                        id=current_user.id, 
                        email=current_user.email, 
                        first_name=current_user.first_name,
                        last_name=current_user.last_name,
                        is_verified=current_user.is_verified
                      )
    
    print(user_data)
    return user_data
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "is_verified": current_user.is_verified
    }


@router.get("/clipboards", response_model=list[ClipboardsResponse])
def clipboards(current_user=Depends(auth.get_current_user), db: Session = Depends(auth.get_db)):
    all_clipboards = get_clipboards(db, current_user.id)
    return all_clipboards


@router.get("/clipboards/{slug}", response_model = CurrentClipboardData)
def clipboard_data(slug:int, current_user=Depends(auth.get_current_user), db: Session = Depends(auth.get_db)):
    all_clipboard_data = get_all_current_clipboard_data(db, user_id=current_user.id, clipboard_id=slug)
    return all_clipboard_data


@router.post("/clipboards/{slug}")
def add_clipboard_message(slug:int, request: ClipboardAddMessageRequest, current_user=Depends(auth.get_current_user), db: Session = Depends(auth.get_db)):
    
    new_message = add_clipboard_data(db, clipboard_id=slug, message = request)

    if not new_message:
        raise HTTPException(status_code=401, detail="Unable to add new message")
    
    return new_message