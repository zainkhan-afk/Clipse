from pydantic import BaseModel, EmailStr, AfterValidator
from datetime import datetime, timezone
from typing import Annotated


def _as_utc(value: datetime | None):
    """Stored timestamps are naive UTC; tag them as UTC so they serialize with a
    +00:00 offset and clients don't misread them as local time."""
    if value is not None and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


UtcDatetime = Annotated[datetime, AfterValidator(_as_utc)]

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: str

class UpdateProfileRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class MeResponse(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    is_verified: bool
    

class ClipboardsResponse(BaseModel):
    id: int
    name: str
    persistance: int|None
    color: str|None = None
    created_at: UtcDatetime|None = None

class ClipboardData(BaseModel):
    id: int
    content_type: str
    content: str
    created_at: UtcDatetime

class CurrentClipboardData(BaseModel):
    clipboard: ClipboardsResponse
    clipboard_data: list[ClipboardData]


class ClipboardAddMessageRequest(BaseModel):
    content_type: str
    content: str

class ClipboardCreateRequest(BaseModel):
    name: str

class ClipboardUpdateRequest(BaseModel):
    name: str|None = None
    persistance: int|None = None
    color: str|None = None