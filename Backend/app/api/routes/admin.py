from fastapi import APIRouter, Depends
from app.core.firebase import db
from app.core.security import get_admin_user
import datetime 

router = APIRouter()

# Notice we use Depends(get_admin_user) to lock this route down!
@router.get("/stats")
def get_dashboard_stats(admin: dict = Depends(get_admin_user)):
    """Fetches high-level metrics for the Admin Dashboard."""
    
    # 1. Get Total Users
    users_ref = db.collection("users").get()
    total_users = len(users_ref)
    
    # 2. Get Total Interviews (Assuming you have an 'interviews' collection)
    interviews_ref = db.collection("interviews").get()
    total_interviews = len(interviews_ref)
    
    # You can expand this later for revenue, active users, etc.
    return {
        "total_users": total_users,
        "active_users_monthly": total_users, # Placeholder for now
        "total_interviews": total_interviews,
        "revenue_monthly": 0,
        "avg_performance_score": 0
    }

@router.get("/users")
def get_all_users(admin: dict = Depends(get_admin_user)):
    """Fetches the list of users for the User Management table."""
    users_ref = db.collection("users").stream()
    
    users_list = []
    for doc in users_ref:
        user_data = doc.to_dict()
        # We don't want to send passwords or sensitive stuff, just the basics
        users_list.append({
            "id": doc.id,
            "name": user_data.get("name", "Unknown"),
            "email": user_data.get("email", "No Email"),
            "plan": user_data.get("plan", "free"),
            "status": user_data.get("status", "active"),
            "created_at": user_data.get("created_at")
        })
        
    return {"users": users_list}

@router.get("/settings")
def get_settings(admin: dict = Depends(get_admin_user)):
    """Fetches global platform settings (Difficulty, Categories, etc.)"""
    settings_doc = db.collection("settings").document("global").get()
    
    if settings_doc.exists:
        return settings_doc.to_dict()
        
    # If it's the first time booting up, return these defaults
    return {
        "default_difficulty": "medium",
        "categories": ["Data Structures", "Algorithms", "System Design", "Behavioral", "OOP", "Databases", "Web Dev", "DevOps"]
    }

@router.put("/settings")
def update_settings(settings_data: dict, admin: dict = Depends(get_admin_user)):
    """Updates the global platform settings"""
    # Using merge=True ensures we don't accidentally delete other settings
    db.collection("settings").document("global").set(settings_data, merge=True)
    return {"message": "Settings saved successfully"}

@router.get("/analytics")
def get_analytics(admin: dict = Depends(get_admin_user)):
    """Fetches detailed analytics and time-series data for the charts."""
    
    # 1. Get real user counts
    users_ref = db.collection("users").get()
    total_users = len(users_ref)
    
    # In a production app, you would run complex aggregation queries here.
    # For now, we calculate baseline metrics based on your actual user count!
    return {
        "metrics": {
            "daily_active": int(total_users * 0.2) or 1, # Estimate 20% DAU
            "monthly_active": total_users,
            "revenue": "$0",
            "popular_role": "Frontend Developer"
        },
        "user_growth": [
            {"month": "Oct", "users": 0},
            {"month": "Nov", "users": 0},
            {"month": "Dec", "users": 0},
            {"month": "Jan", "users": int(total_users * 0.3)},
            {"month": "Feb", "users": int(total_users * 0.7)},
            {"month": "Mar", "users": total_users},
        ],
        "revenue_trend": [
            {"month": "Oct", "revenue": 0},
            {"month": "Nov", "revenue": 0},
            {"month": "Dec", "revenue": 0},
            {"month": "Jan", "revenue": 0},
            {"month": "Feb", "revenue": 0},
            {"month": "Mar", "revenue": 0},
        ],
        "performance_distribution": [
            {"score": "0-20", "candidates": 0},
            {"score": "21-40", "candidates": 1},
            {"score": "41-60", "candidates": 3},
            {"score": "61-80", "candidates": 8},
            {"score": "81-100", "candidates": 4},
        ]
    }

@router.get("/interviews")
def get_all_interviews(admin: dict = Depends(get_admin_user)):
    """Fetches all interviews and calculates monitoring stats."""
    
    # Fetch all interviews from the database
    interviews_ref = db.collection("interviews").stream()
    
    interviews_list = []
    stats = {
        "total": 0,
        "completed": 0,
        "in_progress": 0,
        "flagged": 0
    }
    
    for doc in interviews_ref:
        data = doc.to_dict()
        stats["total"] += 1
        
        status = data.get("status", "in_progress").lower()
        if status == "completed":
            stats["completed"] += 1
        else:
            stats["in_progress"] += 1
            
        # Mock logic for flagged responses (e.g., if AI detected inappropriate content)
        if data.get("flagged", False):
            stats["flagged"] += 1
            
        interviews_list.append({
            "id": doc.id,
            "user_name": data.get("user_name", "Unknown User"),
            "role": data.get("job_title", "Unknown Role"),
            "type": data.get("interview_type", "General"),
            "score": data.get("evaluation", {}).get("overall_score", "—"),
            "status": status,
            "date": data.get("created_at", "")
        })
        
    # Sort by newest first (handling missing dates safely)
    interviews_list.sort(key=lambda x: x["date"] if x["date"] else "", reverse=True)
        
    return {
        "stats": stats,
        "interviews": interviews_list
    }

@router.get("/subscriptions")
def get_all_subscriptions(admin: dict = Depends(get_admin_user)):
    """Fetches subscription metrics and billing details from users."""
    
    users_ref = db.collection("users").stream()
    
    subs_list = []
    stats = {
        "active_subscriptions": 0,
        "free_users": 0,
        "monthly_revenue": 0,
        "expiring_soon": 0
    }
    
    # Let's assume a Pro plan costs $29/month for this calculation
    PRO_PLAN_PRICE = 29 
    
    for doc in users_ref:
        data = doc.to_dict()
        plan = data.get("plan", "free").lower()
        
        if plan == "pro":
            stats["active_subscriptions"] += 1
            stats["monthly_revenue"] += PRO_PLAN_PRICE
            # Mock an expiring soon metric (just for UI demonstration)
            if stats["active_subscriptions"] % 5 == 0: 
                stats["expiring_soon"] += 1
        else:
            stats["free_users"] += 1
            
        # Mocking a renewal date 30 days out for Pro users
        renewal_date = "N/A"
        if plan == "pro":
            renewal_date = (datetime.datetime.now() + datetime.timedelta(days=30)).strftime("%b %d, %Y")
            
        subs_list.append({
            "id": doc.id,
            "user_name": data.get("name", "Unknown User"),
            "plan": plan,
            "status": data.get("status", "active"),
            "amount": f"${PRO_PLAN_PRICE}.00" if plan == "pro" else "$0.00",
            "renewal_date": renewal_date
        })
        
    # Format the revenue nicely
    stats["monthly_revenue"] = f"${stats['monthly_revenue']}"
        
    return {
        "stats": stats,
        "subscriptions": subs_list
    }

@router.get("/logs")
def get_system_logs(admin: dict = Depends(get_admin_user)):
    """Fetches system and user activity logs."""
    # In the future, you can query a 'logs' Firestore collection here.
    # For now, we will generate a realistic audit trail to populate the UI.
    
    now = datetime.datetime.now()
    
    mock_logs = [
        {
            "id": "log_1",
            "timestamp": (now - datetime.timedelta(minutes=2)).strftime("%Y-%m-%d %H:%M:%S"),
            "type": "auth",
            "user": admin.get("email", "admin@nextround.com"),
            "action": "Admin Login",
            "details": "Successful authentication via Firebase token"
        },
        {
            "id": "log_2",
            "timestamp": (now - datetime.timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S"),
            "type": "user",
            "user": "system",
            "action": "New User Registration",
            "details": "Profile initialized in Firestore database"
        },
        {
            "id": "log_3",
            "timestamp": (now - datetime.timedelta(hours=2, minutes=15)).strftime("%Y-%m-%d %H:%M:%S"),
            "type": "api",
            "user": "system",
            "action": "Gemini AI Request",
            "details": "Successfully generated 5 technical questions"
        },
        {
            "id": "log_4",
            "timestamp": (now - datetime.timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"),
            "type": "system",
            "user": "system",
            "action": "Server Boot",
            "details": "FastAPI application started on localhost"
        }
    ]
    
    return {"logs": mock_logs}