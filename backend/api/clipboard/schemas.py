from pydantic import BaseModel, EmailStr
from datetime import datetime

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

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

class ClipboardData(BaseModel):
    id: int
    content_type: str
    content: str
    created_at: datetime

class CurrentClipboardData(BaseModel):
    clipboard: ClipboardsResponse
    clipboard_data: list[ClipboardData]


class ClipboardAddMessageRequest(BaseModel):
    content_type: str
    content: str

class ClipboardCreateRequest(BaseModel):
    name: str