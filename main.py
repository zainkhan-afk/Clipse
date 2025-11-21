from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from api import notify

app = FastAPI()

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

# include all API routes from the api folder
app.include_router(notify.router, prefix="/notify", tags=["notify"])

