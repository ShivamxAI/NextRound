from pydantic import BaseModel, EmailStr
from typing import Optional

class UserProfileInit(BaseModel):
    name: str
    email: EmailStr

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    target_role: Optional[str] = None

class InterviewGenerateRequest(BaseModel):
    job_description: str
    interview_type: str # "Technical", "Behavioral", or "Mixed"
    duration_minutes: int
    question_count: int