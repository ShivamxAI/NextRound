import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

# NEW CLIENT INITIALIZATION
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def extract_skills_from_resume(resume_text: str) -> list:
    """
    Sends resume text to Gemini using the new google-genai SDK.
    """
    prompt = f"""
    You are an expert technical recruiter. Extract the candidate's core technical and professional skills from the text below.
    Return ONLY a flat JSON array of strings. Maximum 15 skills.
    DO NOT include markdown, do not include the word 'json'. Just the array.
    Example: ["Python", "React", "AWS", "Communication"]
    
    RESUME TEXT:
    {resume_text}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        text = response.text.strip()
        
        # Clean up Gemini's habit of wrapping things in markdown
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        # Parse the string into a Python list
        result = json.loads(text.strip())
        
        if isinstance(result, list):
            return result
        elif isinstance(result, dict):
            # If Gemini accidentally returns {"skills": ["A", "B"]}, extract the list
            for key, value in result.items():
                if isinstance(value, list):
                    return value
            return []
        else:
            return []
            
    except Exception as e:
        print(f"🚨 NEW SDK ERROR: {e}")
        # Print exactly what Gemini said so we can see why it broke
        if 'response' in locals() and hasattr(response, 'text'):
            print(f"RAW AI RESPONSE: {response.text}") 
        return []


def generate_interview_questions(job_description: str, skills: list, interview_type: str, count: int) -> list:
    """
    Generates personalized interview questions based on the JD and candidate skills.
    """
    skills_str = ", ".join(skills) if skills else "No specific skills provided."
    
    prompt = f"""
    You are an expert technical interviewer. Your task is to generate {count} {interview_type.lower()} interview questions.
    
    CONTEXT:
    Candidate's Extracted Skills: {skills_str}
    Job Job Description:
    {job_description}
    
    INSTRUCTIONS:
    - If the type is "Technical", focus on the technologies mentioned in the JD and their skills.
    - If "Behavioral", focus on leadership, conflict resolution, and teamwork.
    - If "Mixed", provide a 50/50 split.
    - Return ONLY a raw JSON array of objects. Do not include markdown or the word 'json'.
    
    REQUIRED FORMAT:
    [
      {{"id": 1, "text": "Can you explain how you would optimize a React application's performance?"}},
      {{"id": 2, "text": "Tell me about a time you had to disagree with a senior engineer."}}
    ]
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        text = response.text.strip()
        
        # Clean up Gemini's habit of wrapping things in markdown
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        return json.loads(text.strip())
        
    except Exception as e:
        print(f"🚨 QUESTION GENERATION ERROR: {e}")
        return []


def evaluate_interview(qa_list: list) -> dict:
    """
    Takes the questions and user answers, and asks Gemini to grade the performance.
    """
    # Format the Q&A for the prompt
    transcript = ""
    for idx, qa in enumerate(qa_list, 1):
        transcript += f"\n--- Question {idx} ---\n"
        transcript += f"Question: {qa.get('text')}\n"
        transcript += f"Candidate's Answer: {qa.get('user_answer', '(No answer provided)')}\n"

    prompt = f"""
    You are an expert technical hiring manager grading a candidate's interview.
    Review the following interview transcript and provide a brutal but fair evaluation.
    
    TRANSCRIPT:
    {transcript}
    
    INSTRUCTIONS:
    - Grade the candidate on a scale of 0 to 100 for each metric.
    - Extract 2-3 specific strengths.
    - Extract 2-3 specific areas for improvement.
    - Return ONLY a raw JSON object. Do not include markdown or the word 'json'.
    
    REQUIRED FORMAT:
    {{
        "overall_score": 85,
        "metrics": {{
            "technical_accuracy": 80,
            "communication": 90,
            "confidence": 85,
            "fluency": 88
        }},
        "strengths": ["Clear explanation of React hooks", "Good structural thinking"],
        "improvements": ["Did not mention edge cases in database scaling", "Used filler words frequently"]
    }}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        return json.loads(text.strip())
        
    except Exception as e:
        print(f"🚨 EVALUATION ERROR: {e}")
        # Return a safe fallback so the app doesn't crash
        return {
            "overall_score": 0,
            "metrics": {"technical_accuracy": 0, "communication": 0, "confidence": 0, "fluency": 0},
            "strengths": ["Evaluation failed to generate."],
            "improvements": ["Please try again later."]
        }