from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.firebase import db
from app.core.security import get_current_user
# Make sure BOTH functions are imported here!
from app.services.ai_service import generate_interview_questions, evaluate_interview
import datetime
import uuid

router = APIRouter()

# --- SCHEMAS ---
class InterviewGenerateRequest(BaseModel):
    job_description: str
    interview_type: str
    duration_minutes: int
    question_count: int

class AnswerSubmitRequest(BaseModel):
    question_id: int
    answer: str

# --- ENDPOINTS ---

@router.post("/generate", status_code=201)
async def start_new_interview(
    request: InterviewGenerateRequest, 
    user: dict = Depends(get_current_user)
):
    """Takes the Job Description, asks Gemini for questions, and saves the session."""
    user_id = user["uid"]
    
    user_doc = db.collection("users").document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    skills = user_doc.to_dict().get("skills", [])
    
    questions = generate_interview_questions(
        job_description=request.job_description,
        skills=skills,
        interview_type=request.interview_type,
        count=request.question_count
    )
    
    if not questions:
        raise HTTPException(status_code=500, detail="Failed to generate questions.")

    formatted_questions = []
    for q in questions:
        formatted_questions.append({
            "id": q.get("id", 0),
            "text": q.get("text", "Question text missing"),
            "user_answer": "", 
            "feedback": ""     
        })

    interview_id = str(uuid.uuid4())
    interview_data = {
        "id": interview_id,
        "user_id": user_id,
        "status": "in_progress",
        "type": request.interview_type,
        "duration_minutes": request.duration_minutes,
        "created_at": datetime.datetime.utcnow().isoformat(),
        "questions": formatted_questions
    }
    
    db.collection("interviews").document(interview_id).set(interview_data)
    
    return {
        "message": "Interview generated successfully",
        "interview_id": interview_id,
        "questions": formatted_questions
    }

@router.get("/user/history")
async def get_user_history(user: dict = Depends(get_current_user)):
    """Fetch all past interviews for the current user."""
    user_id = user["uid"]
    
    # Query Firestore for all interviews matching this user
    interviews_ref = db.collection("interviews")
    query = interviews_ref.where("user_id", "==", user_id)
    
    results = []
    for doc in query.stream():
        results.append(doc.to_dict())
        
    # Sort them by date (newest first) in Python to avoid needing custom Firestore indexes
    results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return {"history": results}

@router.get("/{interview_id}")
async def get_interview(interview_id: str, user: dict = Depends(get_current_user)):
    """Fetch an interview session by ID to display questions on the frontend."""
    doc_ref = db.collection("interviews").document(interview_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    data = doc.to_dict()
    if data.get("user_id") != user["uid"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    return data

@router.put("/{interview_id}/answer")
async def save_answer(
    interview_id: str, 
    request: AnswerSubmitRequest, 
    user: dict = Depends(get_current_user)
):
    """Save the user's typed/spoken answer for a specific question."""
    doc_ref = db.collection("interviews").document(interview_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    data = doc.to_dict()
    questions = data.get("questions", [])
    
    for q in questions:
        if q["id"] == request.question_id:
            q["user_answer"] = request.answer
            break
            
    doc_ref.update({"questions": questions})
    return {"message": "Answer saved successfully"}

# --- NEW EVALUATION ENDPOINT ---
@router.post("/{interview_id}/evaluate")
async def evaluate_interview_session(interview_id: str, user: dict = Depends(get_current_user)):
    """Triggers the AI to grade the completed interview."""
    doc_ref = db.collection("interviews").document(interview_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    data = doc.to_dict()
    
    # Don't grade it twice if they refresh the page!
    if data.get("status") == "completed" and "feedback" in data:
        return data["feedback"]
        
    questions = data.get("questions", [])
    
    # 1. Ask Gemini to grade the transcript
    feedback = evaluate_interview(questions)
    
    # 2. Update the database to mark it complete and save the feedback
    doc_ref.update({
        "status": "completed",
        "feedback": feedback,
        "completed_at": datetime.datetime.utcnow().isoformat()
    })
    
    return feedback