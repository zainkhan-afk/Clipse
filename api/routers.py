from fastapi import APIRouter
from api.notifications.routes import router as notifications_router
from api.clipboard.routes import router as clipboard_router

router = APIRouter()

router.include_router(notifications_router, prefix="/notifications", tags=["notifications"])
router.include_router(clipboard_router, prefix="/clipboard", tags=["clipboard"])
