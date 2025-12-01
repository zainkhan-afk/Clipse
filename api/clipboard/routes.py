from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def clipboard():
    return {"message": "Hello from Clipboard API"}
