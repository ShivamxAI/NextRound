import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.firebase import db 
from app.api.routes import profile, interview, admin, payments

app = FastAPI(title="NextRound API")

# Setup CORS so React (and Firebase Hosting) can talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # <-- Allows Firebase Hosting to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect the routes
app.include_router(profile.router, prefix="/api/profile", tags=["Profile"])
app.include_router(interview.router, prefix="/api/interview", tags=["Interview"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])

@app.get("/")
def health_check():
    return {"status": "NextRound Backend is running", "database": "Connected to Firebase"}

if __name__ == "__main__":
    # Dynamically fetch the port Cloud Run gives us, default to 8080 locally
    port = int(os.environ.get("PORT", 8080))
    
    # 0.0.0.0 allows external internet traffic (Cloud Run requires this)
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)