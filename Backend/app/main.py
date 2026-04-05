from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.firebase import db 
from app.api.routes import profile # Import the new routes
from app.api.routes import profile, interview, admin, payments

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

app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

app.include_router(payments.router, prefix="/api/payments", tags=["payments"])

@app.get("/")
def health_check():
    return {"status": "NextRound Backend is running", "database": "Connected to Firebase"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)