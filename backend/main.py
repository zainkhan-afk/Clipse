from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.routers import router as api_router

# from api.notifications import notify

app = FastAPI()
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
        ],  # Replace with specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/clipboard/uploads", StaticFiles(directory="uploads"), name="clipboard_uploads")

# simple root endpoint
@app.get("/")
def root():
    return {"message": "API is running"}

# # include all API routes from the api folder

