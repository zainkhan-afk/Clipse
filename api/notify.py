from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def notify():
    return {"message": "Hello from API"}
