from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import router as api_router

# from api.notifications import notify

app = FastAPI()
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# simple root endpoint
@app.get("/")
def root():
    return {"message": "API is running"}

# # include all API routes from the api folder

