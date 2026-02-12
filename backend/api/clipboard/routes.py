from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile, Response, Request, Cookie
from sqlalchemy.orm import Session
from api.clipboard import auth
from api.clipboard.schemas import RegisterRequest, LoginRequest\
                                , MeResponse, ClipboardsResponse\
                                , CurrentClipboardData, ClipboardAddMessageRequest\
                                

from api.clipboard.service import get_clipboards \
                                , get_all_current_clipboard_data \
                                , add_clipboard_data_text \
                                , add_clipboard_data_image \
                                , delete_message

router = APIRouter()


@router.get("/")
def clipboard_root():
    return {"clipboard-root" : "Working"}

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
def login(request: LoginRequest, response: Response, db: Session = Depends(auth.get_db)):
    user = auth.authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials or email not verified")
    token = auth.create_access_token({"sub": request.email})
    refresh_token = auth.create_refresh_token({"sub": request.email})
    
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=auth.ACCESS_TOKEN_EXPIRE_SECONDS,
        path="/"
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=auth.REFRESH_TOKEN_EXPIRE_SECONDS,
        path="/"
    )
    
    return {"access_token": token, "token_type": "bearer"}

@router.post("/auth/refresh")
def refresh_token(
    refresh_token: str,
    db: Session = Depends(auth.get_db)
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    payload = auth.verify_refresh_token(refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    email = payload.get("sub")
    user = auth.get_user_by_email(db, email)

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access_token = auth.create_access_token({"sub": email})

    return {"access_token": new_access_token}


@router.post("/auth/refresh")
def refresh(response: Response, refresh_token: str = Cookie(None)):

    if not refresh_token:
        raise HTTPException(status_code=401)

    payload = auth.verify_refresh_token(refresh_token)
    if not payload:
        raise HTTPException(status_code=401)

    new_access_token = auth.create_access_token({"sub": payload["sub"]})

    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        samesite="none",
        secure=True,
        max_age=auth.ACCESS_TOKEN_EXPIRE_SECONDS,
    )

    return {"message": "refreshed"}


# ==========================
# PROTECTED ROUTE
# ==========================

# @router.get("/auth/me")
# def me(request: Request):
#     print("request", request)
#     token = request.cookies.get("token")
#     print("token", token)
#     return {"email": "zain@example.com"}

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


# @router.post("/clipboards/{slug}")
# def add_clipboard_message(slug:int, request: ClipboardAddMessageRequest, current_user=Depends(auth.get_current_user), db: Session = Depends(auth.get_db)):
    
#     new_message = add_clipboard_data(db, clipboard_id=slug, message = request)

#     if not new_message:
#         raise HTTPException(status_code=401, detail="Unable to add new message")
    
#     return new_message

# @router.post("/clipboards/{slug}")
# async def add_clipboard_message(slug: int,
#         content_type: str = Form(...),
#         content: str | None = Form(None),
#         image: UploadFile | None = File(None),
#         # req: Request
#     ):
#     # print(await req.json())
#     return {"asd" : "asd"}

@router.post("/clipboards/{slug}")
def add_clipboard_message(slug: int,
        content_type: str = Form(...),
        content: str | None = Form(None),
        image: UploadFile | None = File(None),
        current_user = Depends(auth.get_current_user),
        db: Session = Depends(auth.get_db)
    ):

    if content_type == "text":
        if not content:
            raise HTTPException(400, "Text content is required")
        
        content_message = ClipboardAddMessageRequest(content_type=content_type, content=content)

        new_message = add_clipboard_data_text(
            db,
            clipboard_id=slug,
            message = content_message
        )

    elif content_type == "image":
        if not image:
            raise HTTPException(400, "Image file is required")

        new_message = add_clipboard_data_image(
            db,
            clipboard_id=slug,
            image=image,
        )


    else:
        raise HTTPException(400, "Invalid content type")
    

@router.delete("/clipboards/{clipboard_id}/messages/{message_id}")
def delete_clipboard_message(
        clipboard_id: int,
        message_id: int,
        current_user = Depends(auth.get_current_user),
        db: Session = Depends(auth.get_db),
    ):


    resp = delete_message(db, clipboard_id, message_id)
    if resp:
        return {"detail": "Message deleted successfully"}
    else:
        raise HTTPException(400, "Invalid content type")
