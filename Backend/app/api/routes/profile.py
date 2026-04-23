from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.core.firebase import db
from app.core.security import get_current_user
from app.models.schemas import UserProfileInit, UserProfileUpdate
from app.services.ai_service import extract_skills_from_resume
import datetime
import io
import PyPDF2

router = APIRouter()

@router.post("/init", status_code=201)
async def initialize_user_profile(
    profile_data: UserProfileInit, 
    user: dict = Depends(get_current_user)
):
    """Called once right after Firebase frontend signup to create the Firestore document."""
    user_id = user["uid"]
    user_ref = db.collection("users").document(user_id)
    
    if user_ref.get().exists:
        return {"message": "User profile already initialized"}

    user_doc = {
        "id": user_id,
        "name": profile_data.name,
        "email": profile_data.email,
        "target_role": "",
        "resume_url": "",
        "skills": [], 
        "status": "active",
        "plan": "free",
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    
    user_ref.set(user_doc)
    return {"message": "Profile created successfully"}

@router.get("/")
async def get_profile(user: dict = Depends(get_current_user)):
    """Fetch the current user's profile data."""
    user_id = user["uid"]
    user_ref = db.collection("users").document(user_id)
    doc = user_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    return doc.to_dict()

@router.put("/")
async def update_profile(
    update_data: UserProfileUpdate, 
    user: dict = Depends(get_current_user)
):
    """Update user's profile (like saving the Target Role)."""
    user_id = user["uid"]
    user_ref = db.collection("users").document(user_id)
    
    # Filter out None values, only update fields that were actually sent
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_dict:
        update_dict["updated_at"] = datetime.datetime.utcnow().isoformat()
        user_ref.update(update_dict)
        
    return {"message": "Profile updated successfully"}

@router.post("/resume")
async def upload_resume(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """Accepts a PDF resume, extracts text, and uses Gemini to find skills."""
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Currently, only PDF files are supported.")
    
    try:
        # Read the PDF file into memory
        contents = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
        
        # Extract text from all pages
        resume_text = ""
        for page in pdf_reader.pages:
            extracted = page.extract_text()
            if extracted:
                resume_text += extracted + "\n"
                
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from this PDF.")

        # Pass the text to Gemini to get the skills
        skills = extract_skills_from_resume(resume_text)
        
        # Save the skills to the user's Firestore profile
        user_id = user["uid"]
        db.collection("users").document(user_id).update({
            "skills": skills,
            "updated_at": datetime.datetime.utcnow().isoformat()
        })
        
        return {
            "message": "Resume processed successfully", 
            "skills": skills
        }
        
    except Exception as e:
        print(f"Resume processing error: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while processing the resume.")