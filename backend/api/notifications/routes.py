from fastapi import APIRouter
from api.notifications.service import notify

router = APIRouter()

@router.get("/")
def notifications():
    return {"message": "Hello from Notifications API"}


@router.get("/notify")
def notify_user():
    return notify()