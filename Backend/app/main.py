from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.firebase import db 
from app.api.routes import profile # Import the new routes
from app.api.routes import profile, interview

app = FastAPI(title="NextRound API")

# Setup CORS so React can talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081"], # Add your frontend URL here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect the profile routes
app.include_router(profile.router, prefix="/api/profile", tags=["Profile"])

app.include_router(interview.router, prefix="/api/interview", tags=["Interview"])

@app.get("/")
def health_check():
    return {"status": "NextRound Backend is running", "database": "Connected to Firebase"}