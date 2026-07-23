from fastapi import APIRouter
from api.clipboard.routes import router as clipboard_router

router = APIRouter()

router.include_router(clipboard_router, tags=["clipboard"])
