import os
from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile, Response, Request, Cookie, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from api.clipboard import auth
from api.clipboard.emailer import send_verification_email, send_password_reset_email
from api.clipboard.schemas import RegisterRequest, LoginRequest\
                                , MeResponse, ClipboardsResponse\
                                , CurrentClipboardData, ClipboardAddMessageRequest\
                                , ClipboardCreateRequest, ClipboardUpdateRequest\
                                , ResendVerificationRequest\
                                , ForgotPasswordRequest, ResetPasswordRequest


BACKEND_PUBLIC_URL = os.environ.get("BACKEND_PUBLIC_URL", "http://localhost:8000")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")


def _verify_url(token: str) -> str:
    return f"{BACKEND_PUBLIC_URL}/auth/verify?token={token}"



from api.clipboard.service import get_clipboards \
                                , get_all_current_clipboard_data \
                                , add_clipboard_data_text \
                                , add_clipboard_data_image \
                                , delete_message \
                                , delete_all_messages \
                                , delete_entire_clipboard \
                                , get_clipboard_for_user \
                                , update_clipboard \
                                , get_clipboard_image \
                                , purge_expired \
                                , create_clipboard

router = APIRouter()


@router.post("/auth/register")
def register(request: RegisterRequest, db: Session = Depends(auth.get_db)):
    try:
        user = auth.register_user(db, request.email, request.password, request.first_name, request.last_name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        send_verification_email(user.email, user.first_name, _verify_url(user.verification_token))
    except Exception:
        # Account is created; the email just didn't go out. The client can offer
        # "resend" so a transient SMTP hiccup or misconfig isn't a dead end.
        raise HTTPException(
            status_code=502,
            detail="Account created, but the verification email failed to send. Try resending.",
        )

    return {"message": "Verification email sent", "email": user.email}


@router.post("/auth/resend-verification")
def resend_verification(request: ResendVerificationRequest, db: Session = Depends(auth.get_db)):
    user = auth.get_user_by_email(db, request.email)
    # Only act for a real, still-unverified account, but always return the same
    # message so this can't be used to probe which emails are registered.
    if user and not user.is_verified:
        token = auth.create_email_verification_token(user.email)
        user.verification_token = token
        db.commit()
        try:
            send_verification_email(user.email, user.first_name, _verify_url(token))
        except Exception:
            pass
    return {"message": "If that account exists and isn't verified yet, a new link is on its way."}


@router.get("/auth/verify")
def verify_email(token: str, db: Session = Depends(auth.get_db)):
    email = auth.verify_email_verification_token(token)
    if not email:
        return RedirectResponse(f"{FRONTEND_URL}/login?verified=0", status_code=303)

    user = auth.get_user_by_email(db, email)
    if not user:
        return RedirectResponse(f"{FRONTEND_URL}/login?verified=0", status_code=303)

    if not user.is_verified:
        user.is_verified = True
        user.verification_token = None
        db.commit()

    return RedirectResponse(f"{FRONTEND_URL}/login?verified=1", status_code=303)


@router.post("/auth/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(auth.get_db)):
    user = auth.get_user_by_email(db, request.email)
    # Always return the same message so this can't be used to probe which emails
    # are registered.
    if user:
        token = auth.create_password_reset_token(user.email)
        reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
        try:
            send_password_reset_email(user.email, user.first_name, reset_url)
        except Exception:
            pass
    return {"message": "If an account exists for that email, a reset link is on its way."}


@router.post("/auth/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(auth.get_db)):
    email = auth.verify_password_reset_token(request.token)
    if not email:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired.")

    user = auth.get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired.")

    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    auth.update_user_password(db, user, request.password)
    return {"message": "Password updated. You can sign in now."}

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

@router.get("/auth/me", response_model=MeResponse)
def me(current_user=Depends(auth.get_current_user)):
    user_data = MeResponse(
                        id=current_user.id, 
                        email=current_user.email, 
                        first_name=current_user.first_name,
                        last_name=current_user.last_name,
                        is_verified=current_user.is_verified
                      )
    
    return user_data


@router.get("/clipboards", response_model=list[ClipboardsResponse])
def clipboards(current_user=Depends(auth.get_current_user), db: Session = Depends(auth.get_db)):
    all_clipboards = get_clipboards(db, current_user.id)
    return all_clipboards


@router.post("/clipboards/create")
def clipboards(data: ClipboardCreateRequest, current_user=Depends(auth.get_current_user), db: Session = Depends(auth.get_db)):
    new_clipboard = create_clipboard(db, current_user.id, name=data.name)
    if not new_clipboard:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Clipboard with this name already exists"
        )

    return {
        "message": "Clipboard successfully created",
        "id": new_clipboard.id
    }


@router.get("/clipboards/{slug}", response_model = CurrentClipboardData)
def clipboard_data(slug:int, current_user=Depends(auth.get_current_user), db: Session = Depends(auth.get_db)):
    all_clipboard_data = get_all_current_clipboard_data(db, user_id=current_user.id, clipboard_id=slug)
    return all_clipboard_data


@router.get("/cron/cleanup")
def cron_cleanup(request: Request, db: Session = Depends(auth.get_db)):
    # Invoked by Vercel Cron. Vercel sends `Authorization: Bearer $CRON_SECRET`.
    secret = os.environ.get("CRON_SECRET")
    if not secret or request.headers.get("authorization") != f"Bearer {secret}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    return {"deleted": purge_expired(db)}


@router.get("/images/{message_id}")
def clipboard_image(message_id: int, current_user=Depends(auth.get_current_user), db: Session = Depends(auth.get_db)):
    result = get_clipboard_image(db, current_user.id, message_id)
    if not result:
        raise HTTPException(status_code=404, detail="Image not found")

    content, media_type = result
    return Response(content=content, media_type=media_type)


@router.patch("/clipboards/{clipboard_id}")
def update_clipboard_settings(
        clipboard_id: int,
        data: ClipboardUpdateRequest,
        current_user=Depends(auth.get_current_user),
        db: Session = Depends(auth.get_db),
    ):
    clipboard = get_clipboard_for_user(db, current_user.id, clipboard_id)
    if not clipboard:
        raise HTTPException(status_code=404, detail="Clipboard not found")

    updated = update_clipboard(db, clipboard_id, data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Clipboard with this name already exists",
        )

    return updated.to_dict()


@router.delete("/clipboards/{clipboard_id}")
def delete_clipboard(clipboard_id: int, current_user=Depends(auth.get_current_user), db: Session = Depends(auth.get_db)):
    clipboard = get_clipboard_for_user(db, current_user.id, clipboard_id)
    if not clipboard:
        raise HTTPException(status_code=404, detail="Clipboard not found")

    return delete_entire_clipboard(db, clipboard_id)


@router.post("/auth/logout")
def logout(response: Response):

    response.delete_cookie(
        key="access_token",
        path="/",
        samesite="none",
        secure=True,  # must match how it was set
    )

    response.delete_cookie(
        key="refresh_token",
        path="/",
        samesite="none",
        secure=True,
    )

    return {"message": "Logged out"}


@router.post("/clipboards/{slug}")
def add_clipboard_message(slug: int,
        content_type: str = Form(...),
        content: str | None = Form(None),
        image: UploadFile | None = File(None),
        current_user = Depends(auth.get_current_user),
        db: Session = Depends(auth.get_db)
    ):

    clipboard = get_clipboard_for_user(db, current_user.id, slug)
    if not clipboard:
        raise HTTPException(status_code=404, detail="Clipboard not found")

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

    return new_message.to_dict()


@router.delete("/clipboards/{clipboard_id}/messages/{message_id}")
def delete_clipboard_message(
        clipboard_id: int,
        message_id: int,
        current_user = Depends(auth.get_current_user),
        db: Session = Depends(auth.get_db),
    ):

    clipboard = get_clipboard_for_user(db, current_user.id, clipboard_id)
    if not clipboard:
        raise HTTPException(status_code=404, detail="Clipboard not found")

    resp = delete_message(db, clipboard_id, message_id)
    if resp:
        return {"detail": "Message deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Message not found")


@router.delete("/clipboards/{clipboard_id}/messages")
def delete_all_clipboard_messages(clipboard_id: int, current_user=Depends(auth.get_current_user), db: Session = Depends(auth.get_db)):
    clipboard = get_clipboard_for_user(db, current_user.id, clipboard_id)
    if not clipboard:
        raise HTTPException(status_code=404, detail="Clipboard not found")

    return delete_all_messages(db, clipboard_id)