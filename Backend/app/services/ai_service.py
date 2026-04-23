import os
import json
import datetime
import re 
from google import genai
from dotenv import load_dotenv
from app.core.firebase import db

load_dotenv()

# NEW CLIENT INITIALIZATION
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# LOGGING HELPER 
def log_ai_interaction(action: str, prompt: str, raw_response: str, latency_ms: float, error: str = None):
    """Silently saves exactly what Gemini was asked and what it answered."""
    try:
        log_data = {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "action": action,
            "prompt": prompt,
            "response": raw_response,
            "latency_ms": round(latency_ms, 2),
            "status": "error" if error else "success",
            "error_msg": error
        }
        db.collection("ai_logs").document().set(log_data)
    except Exception as e:
        print(f"🚨 Failed to save AI log: {e}")


def extract_skills_from_resume(resume_text: str) -> list:
    prompt = f"""
    You are an expert technical recruiter. Extract the candidate's core technical and professional skills from the text below.
    Return ONLY a flat JSON array of strings. Maximum 15 skills.
    DO NOT include markdown, do not include the word 'json'. Just the array.
    Example: ["Python", "React", "AWS", "Communication"]
    
    RESUME TEXT:
    {resume_text}
    """
    
    try:
        start_time = datetime.datetime.utcnow()
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        end_time = datetime.datetime.utcnow()
        latency = (end_time - start_time).total_seconds() * 1000
        
        text = response.text.strip()
        log_ai_interaction(action="extract_skills", prompt=prompt, raw_response=text, latency_ms=latency)
        
        # BULLETPROOF REGEX PARSING FOR ARRAYS
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if not match:
            raise ValueError("Could not find a valid JSON array in response.")
            
        result = json.loads(match.group(0))
        
        if isinstance(result, list):
            return result
        elif isinstance(result, dict):
            for key, value in result.items():
                if isinstance(value, list):
                    return value
            return []
        else:
            return []
            
    except Exception as e:
        print(f"🚨 SKILL EXTRACTION ERROR: {e}")
        log_ai_interaction(action="extract_skills", prompt=prompt, raw_response="", latency_ms=0, error=str(e))
        return []


def generate_interview_questions(job_description: str, skills: list, interview_type: str, count: int, industry: str = "general") -> list:
    skills_str = ", ".join(skills) if skills else "No specific skills provided."
    
    prompt = f"""
    You are an expert technical interviewer. Your task is to generate {count} {interview_type.lower()} interview questions.
    
    CONTEXT:
    Candidate's Extracted Skills: {skills_str}
    Job Description:
    {job_description}
    
    INSTRUCTIONS:
    - If the type is "Technical", focus on the technologies mentioned in the JD and their skills.
    - If "Behavioral", focus on leadership, conflict resolution, and teamwork.
    - If "Mixed", provide a 50/50 split.
    - Return ONLY a raw JSON array of objects. Do not include markdown or the word 'json'.
    - Industry Focus: Tailor the questions to the {industry} industry. If 'general', keep it standard.
    
    REQUIRED FORMAT:
    [
      {{"id": 1, "text": "Can you explain how you would optimize a React application's performance?"}},
      {{"id": 2, "text": "Tell me about a time you had to disagree with a senior engineer."}}
    ]
    """
    
    try:
        start_time = datetime.datetime.utcnow()
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        end_time = datetime.datetime.utcnow()
        latency = (end_time - start_time).total_seconds() * 1000
        
        text = response.text.strip()
        log_ai_interaction(action="generate_questions", prompt=prompt, raw_response=text, latency_ms=latency)
        
        # BULLETPROOF REGEX PARSING FOR ARRAYS
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if not match:
            raise ValueError("Could not find a valid JSON array in response.")
            
        return json.loads(match.group(0))
        
    except Exception as e:
        print(f"🚨 QUESTION GENERATION ERROR: {e}")
        log_ai_interaction(action="generate_questions", prompt=prompt, raw_response="", latency_ms=0, error=str(e))
        return []


def evaluate_interview(qa_list: list, user_plan: str = "free") -> dict:
    transcript = ""
    for idx, qa in enumerate(qa_list, 1):
        transcript += f"\n--- Question {idx} ---\n"
        transcript += f"Question: {qa.get('text')}\n"
        transcript += f"Candidate's Answer: {qa.get('user_answer', '(No answer provided)')}\n"

    # Define dynamic grading rules AND dynamic JSON formats
    if user_plan == "free":
        grading_rules = """
        - Provide BASIC feedback. Give a final score out of 100.
        - The 'strengths' array should contain exactly 1 generic positive note.
        - The 'improvements' array MUST contain exactly this string as its first item: "🔒 Upgrade to Pro or Premium to unlock detailed question-by-question technical corrections and actionable improvement roadmaps."
        """
        expected_json = """
        {
            "overall_score": 85,
            "metrics": {"technical_accuracy": 80, "communication": 90, "confidence": 85, "fluency": 88},
            "strengths": ["..."],
            "improvements": ["..."],
            "roadmap": [],
            "question_feedback": []
        }
        """
    elif user_plan == "pro":
        grading_rules = """
        - Provide DETAILED feedback. Give a final score out of 100 and precise metrics.
        - The 'strengths' array should contain 2-3 specific things they did well.
        - The 'improvements' array should contain 2-3 specific technical mistakes they made.
        """
        expected_json = """
        {
            "overall_score": 85,
            "metrics": {"technical_accuracy": 80, "communication": 90, "confidence": 85, "fluency": 88},
            "strengths": ["..."],
            "improvements": ["..."],
            "roadmap": [],
            "question_feedback": []
        }
        """
    else: # PREMIUM (Subscription Tier)
        grading_rules = """
        - Provide ADVANCED EXPERT feedback. Give a rigorous final score and strict metrics.
        - The 'strengths' array should contain 3-4 deep analytical points.
        - The 'improvements' array MUST include a specific step-by-step 'Improvement Roadmap'.
        - MUST include a 'question_feedback' array. For EVERY question asked, provide a detailed critique.
        - Structure the 'ideal_answer' professionally using bullet points or numbered lists to show depth; DO NOT provide a single paragraph ideal answer.
        """
        expected_json = """
        {
            "overall_score": 85,
            "metrics": {"technical_accuracy": 80, "communication": 90, "confidence": 85, "fluency": 88},
            "strengths": ["..."],
            "improvements": ["..."],
            "roadmap": ["Step 1...", "Step 2..."],
            "question_feedback": [
                {
                    "question": "The exact text of the question asked.",
                    "user_answer": "The exact answer the candidate provided.",
                    "critique": "What was missing, incorrect, or great about this answer.",
                    "ideal_answer": "A comprehensive, perfectly structured ideal answer."
                }
            ]
        }
        """

    prompt = f"""
    You are an expert technical hiring manager grading a candidate's interview.
    Review the following interview transcript and provide a fair evaluation.
    
    TRANSCRIPT:
    {transcript}
    
    INSTRUCTIONS:
    - Grade the candidate on a scale of 0 to 100 for each metric.
    {grading_rules}
    - Return ONLY a raw JSON object. Do not include markdown.
    
    REQUIRED FORMAT:
    {expected_json}
    """
    
    try:
        start_time = datetime.datetime.utcnow()
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        end_time = datetime.datetime.utcnow()
        latency = (end_time - start_time).total_seconds() * 1000
        
        text = response.text.strip()
        log_ai_interaction(action="evaluate_interview", prompt=prompt, raw_response=text, latency_ms=latency)
        
        # BULLETPROOF REGEX PARSING
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if not match:
            raise ValueError(f"Could not find a valid JSON object.")
            
        return json.loads(match.group(0))
        
    except Exception as e:
        print(f"🚨 EVALUATION ERROR: {e}")
        log_ai_interaction(action="evaluate_interview", prompt=prompt, raw_response="", latency_ms=0, error=str(e))
        return {
            "overall_score": 0,
            "metrics": {"technical_accuracy": 0, "communication": 0, "confidence": 0, "fluency": 0},
            "strengths": ["Evaluation failed to generate."],
            "improvements": ["Please try again later."],
            "roadmap": [],
            "question_feedback": []
        }