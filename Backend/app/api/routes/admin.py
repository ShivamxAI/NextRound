from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel 
from app.core.firebase import db
from app.core.security import get_admin_user
import datetime 
from collections import Counter 
from firebase_admin import auth

router = APIRouter()

# SCHEMAS 
class PlanUpdateRequest(BaseModel):
    plan: str

class QuestionSetRequest(BaseModel):
    role: str
    questions: list[str]


# ADMIN DASHBOARD STATS 
@router.get("/stats")
def get_dashboard_stats(admin: dict = Depends(get_admin_user)):
    """Fetches high-level metrics for the Admin Dashboard."""
    
    # Calculate User & Subscription Metrics
    users_ref = db.collection("users").stream()
    total_users = 0
    active_subs = 0
    monthly_revenue = 0
    
    # SETTING EXACT INR PRICING FOR ACCURATE DASHBOARD REVENUE CALCULATION
    PLAN_PRICES = {"pro": 99, "premium": 299, "free": 0}

    for doc in users_ref:
        total_users += 1
        user_data = doc.to_dict()
        plan = user_data.get("plan", "free").lower()
        
        if plan in ["pro", "premium"]:
            active_subs += 1
            monthly_revenue += PLAN_PRICES.get(plan, 0)

    # Calculate Interview Metrics
    interviews_ref = db.collection("interviews").stream()
    total_interviews = 0
    total_score = 0
    scored_interviews = 0
    recent_activity = []

    for doc in interviews_ref:
        total_interviews += 1
        inv_data = doc.to_dict()
        
        # Build recent activity feed with accurate role and user info
        recent_activity.append({
            "id": doc.id,
            "title": f"Interview: {inv_data.get('job_title', 'General')}",
            "user": inv_data.get("user_name", "Unknown Candidate"),
            "status": "completed", # Display all as completed on dashboard
            "date": inv_data.get("created_at", "")
        })

        # Calculate average performance score
        feedback = inv_data.get("feedback")
        evaluation = inv_data.get("evaluation")
        
        if isinstance(feedback, dict) and "overall_score" in feedback:
            total_score += feedback["overall_score"]
            scored_interviews += 1
        elif isinstance(evaluation, dict) and "overall_score" in evaluation:
            total_score += evaluation["overall_score"]
            scored_interviews += 1

    # Calculate final average
    avg_score = round(total_score / scored_interviews) if scored_interviews > 0 else 0

    # Sort recent activity by date (newest first) and grab the top 5
    recent_activity.sort(key=lambda x: x.get("date", ""), reverse=True)
    top_activity = recent_activity[:5]

    return {
        "total_users": total_users,
        "active_users_monthly": total_users, 
        "total_interviews": total_interviews,
        "revenue_inr": monthly_revenue,
        "active_subscriptions": active_subs,
        "avg_score": avg_score,
        "recent_activity": top_activity
    }


# USER MANAGEMENT ENDPOINTS 
@router.get("/users")
def get_all_users(admin: dict = Depends(get_admin_user)):
    """Fetches the list of users and dynamically counts their interviews."""
    users_ref = db.collection("users").stream()
    interviews_ref = db.collection("interviews").stream()
    
    # Pre-calculate interview counts per user to save database reads
    interview_counts = {}
    for doc in interviews_ref:
        uid = doc.to_dict().get("user_id")
        if uid:
            interview_counts[uid] = interview_counts.get(uid, 0) + 1
    
    users_list = []
    for doc in users_ref:
        user_data = doc.to_dict()
        users_list.append({
            "id": doc.id,
            "name": user_data.get("name", "Unknown"),
            "email": user_data.get("email", "No Email"),
            "plan": user_data.get("plan", "free"),
            "status": user_data.get("status", "active"),
            "created_at": user_data.get("created_at"),
            "interviews": interview_counts.get(doc.id, 0) 
        })
        
    return {"users": users_list}


@router.put("/users/{target_user_id}/plan")
def update_user_plan(target_user_id: str, request: PlanUpdateRequest, admin: dict = Depends(get_admin_user)):
    """Allows admins to upgrade/downgrade a user's subscription plan."""
    try:
        db.collection("users").document(target_user_id).update({
            "plan": request.plan.lower()
        })
        return {"message": f"User plan successfully updated to {request.plan}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update plan: {str(e)}")


@router.delete("/users/{target_user_id}")
def delete_user(target_user_id: str, admin: dict = Depends(get_admin_user)):
    """Deletes a user, their profile, and all their interview history."""
    try:
        # Delete all interviews associated with this user
        interviews_ref = db.collection("interviews").where("user_id", "==", target_user_id).stream()
        for doc in interviews_ref:
            doc.reference.delete()

        # Delete the user's Firestore profile document
        db.collection("users").document(target_user_id).delete()

        # Delete the user from Firebase Authentication
        try:
            auth.delete_user(target_user_id)
        except Exception as auth_err:
            pass # User might already be deleted from Auth

        return {"message": "User deleted successfully."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# SETTINGS & ANALYTICS ENDPOINTS
@router.get("/settings")
def get_settings(admin: dict = Depends(get_admin_user)):
    """Fetches global platform settings (Difficulty, Categories, etc.)"""
    settings_doc = db.collection("settings").document("global").get()
    
    if settings_doc.exists:
        return settings_doc.to_dict()
        
    return {
        "default_difficulty": "medium",
        "categories": ["Data Structures", "Algorithms", "System Design", "Behavioral", "OOP", "Databases", "Web Dev", "DevOps"]
    }


@router.put("/settings")
def update_settings(settings_data: dict, admin: dict = Depends(get_admin_user)):
    """Updates the global platform settings"""
    db.collection("settings").document("global").set(settings_data, merge=True)
    return {"message": "Settings saved successfully"}


@router.get("/analytics")
def get_analytics(admin: dict = Depends(get_admin_user)):
    """Fetches real detailed analytics and time-series data for the charts."""
    now = datetime.datetime.utcnow()
    
    users = [doc.to_dict() for doc in db.collection("users").stream()]
    interviews = [doc.to_dict() for doc in db.collection("interviews").stream()]

    PLAN_PRICES = {"pro": 99, "premium": 299, "free": 0}
    total_revenue = sum([PLAN_PRICES.get(u.get("plan", "free").lower(), 0) for u in users])
    
    months_labels = [(now - datetime.timedelta(days=30*i)).strftime("%b") for i in range(5, -1, -1)]
    user_growth_dict = {m: 0 for m in months_labels}
    revenue_trend_dict = {m: 0 for m in months_labels}

    for u in users:
        plan = u.get("plan", "free").lower()
        rev = PLAN_PRICES.get(plan, 0)
        
        created_at = u.get("created_at")
        if created_at:
            try:
                month_str = datetime.datetime.fromisoformat(created_at.replace("Z", "+00:00")).strftime("%b")
                if month_str in user_growth_dict:
                    user_growth_dict[month_str] += 1
                    revenue_trend_dict[month_str] += rev
            except Exception: pass

    cum_users = 0
    user_growth_chart = []
    for m in months_labels:
        cum_users += user_growth_dict[m]
        user_growth_chart.append({"month": m, "users": cum_users})
        
    job_titles = []
    active_users_30d = set()
    active_users_1d = set()
    score_buckets = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}

    for inv in interviews:
        job_title = inv.get("job_title")
        if job_title: job_titles.append(job_title)
            
        uid = inv.get("user_id")
        created_at = inv.get("created_at")
        if uid and created_at:
            try:
                days_ago = (now - datetime.datetime.fromisoformat(created_at.replace("Z", "+00:00")).replace(tzinfo=None)).days
                if days_ago <= 30: active_users_30d.add(uid)
                if days_ago <= 1: active_users_1d.add(uid)
            except Exception: pass

        score = inv.get("evaluation", {}).get("overall_score", -1)
        if score == -1 and isinstance(inv.get("feedback"), dict):
            score = inv.get("feedback").get("overall_score", -1)

        if 0 <= score <= 20: score_buckets["0-20"] += 1
        elif 21 <= score <= 40: score_buckets["21-40"] += 1
        elif 41 <= score <= 60: score_buckets["41-60"] += 1
        elif 61 <= score <= 80: score_buckets["61-80"] += 1
        elif 81 <= score <= 100: score_buckets["81-100"] += 1

    popular_role = Counter(job_titles).most_common(1)[0][0] if job_titles else "None Yet"
    perf_dist = [{"score": k, "candidates": v} for k, v in score_buckets.items()]

    return {
        "metrics": {
            "daily_active": len(active_users_1d),
            "monthly_active": len(active_users_30d) if len(active_users_30d) > 0 else len(users),
            "revenue": f"₹{total_revenue}",
            "popular_role": popular_role.title()
        },
        "user_growth": user_growth_chart,
        "revenue_trend": [{"month": m, "revenue": revenue_trend_dict[m]} for m in months_labels],
        "performance_distribution": perf_dist
    }


@router.get("/interviews")
def get_all_interviews(admin: dict = Depends(get_admin_user)):
    """Fetches all interviews and accurately extracts type and score."""
    interviews_ref = db.collection("interviews").stream()
    
    interviews_list = []
    total_score = 0
    scored_count = 0
    industry_count = 0 
    roles = []
    
    for doc in interviews_ref:
        data = doc.to_dict()
        
        # Extract Role
        role = data.get("job_title", "Unknown Role")
        roles.append(role)

        # Extract Interview Type
        int_type = data.get("type", data.get("interview_type", data.get("industry_focus", "General")))
        
        if isinstance(int_type, str) and int_type.lower() not in ["general", "standard", ""]:
            industry_count += 1
            
        # Extract Score
        score = "—"
        feedback = data.get("feedback")
        evaluation = data.get("evaluation")
        
        if isinstance(feedback, dict) and "overall_score" in feedback:
            score = feedback["overall_score"]
        elif isinstance(evaluation, dict) and "overall_score" in evaluation:
            score = evaluation["overall_score"]
            
        if isinstance(score, (int, float)):
            total_score += score
            scored_count += 1
            score_display = f"{score}%"
        else:
            score_display = "—"
            
        interviews_list.append({
            "id": doc.id,
            "user_name": data.get("user_name", "Unknown User"),
            "role": role,
            "type": int_type.capitalize() if isinstance(int_type, str) else "General",
            "score": score_display,
            "status": "Completed", 
            "date": data.get("created_at", "")
        })
        
    interviews_list.sort(key=lambda x: x["date"] if x["date"] else "", reverse=True)
    
    avg_score = round(total_score / scored_count) if scored_count > 0 else 0
    
    valid_roles = [r for r in roles if r != "Unknown Role"]
    most_common_role = Counter(valid_roles).most_common(1)[0][0] if valid_roles else "N/A"
        
    stats = {
        "total": len(interviews_list),
        "industry_count": industry_count, 
        "avg_score": avg_score,
        "popular_role": most_common_role.title() if most_common_role != "N/A" else "N/A"
    }
        
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
    
    PLAN_PRICES = {"pro": 99, "premium": 299}
    now = datetime.datetime.utcnow()
    
    for doc in users_ref:
        data = doc.to_dict()
        plan = data.get("plan", "free").lower()
        created_at = data.get("created_at")
        
        renewal_date_str = "N/A"
        amount = "₹0.00"
        
        if plan in PLAN_PRICES:
            stats["active_subscriptions"] += 1
            stats["monthly_revenue"] += PLAN_PRICES[plan]
            amount = f"₹{PLAN_PRICES[plan]}.00"
            
            # EXPIRING SOON LOGIC 
            if created_at:
                try:
                    join_date = datetime.datetime.fromisoformat(created_at.replace("Z", "+00:00")).replace(tzinfo=None)
                    days_since_join = (now - join_date).days
                    cycles = (days_since_join // 30) + 1
                    next_billing_date = join_date + datetime.timedelta(days=30 * cycles)
                    renewal_date_str = next_billing_date.strftime("%b %d, %Y")
                    
                    if (next_billing_date - now).days <= 7:
                        stats["expiring_soon"] += 1
                except Exception:
                    renewal_date_str = "Unknown"
        else:
            stats["free_users"] += 1
            
        subs_list.append({
            "id": doc.id,
            "user_name": data.get("name", "Unknown User"),
            "plan": plan,
            "status": data.get("status", "active"),
            "amount": amount,
            "renewal_date": renewal_date_str
        })
        
    stats["monthly_revenue"] = f"₹{stats['monthly_revenue']}"
        
    return {
        "stats": stats,
        "subscriptions": subs_list
    }


@router.get("/logs")
def get_system_logs(admin: dict = Depends(get_admin_user)):
    """Fetches real system activity by aggregating recent users and interviews."""
    real_logs = []
    
    try:
        # 1. Fetch the 25 most recent user registrations
        users_ref = db.collection("users").order_by("created_at", direction="DESCENDING").limit(25).stream()
        for doc in users_ref:
            data = doc.to_dict()
            if "created_at" in data:
                real_logs.append({
                    "id": f"user_{doc.id}",
                    "timestamp": data["created_at"],
                    "type": "user",
                    "user": data.get("email", data.get("name", "Unknown")),
                    "action": "New Registration",
                    "details": f"User joined on the {data.get('plan', 'free').upper()} plan."
                })

        # 2. Fetch the 25 most recent interview sessions
        interviews_ref = db.collection("interviews").order_by("created_at", direction="DESCENDING").limit(25).stream()
        for doc in interviews_ref:
            data = doc.to_dict()
            if "created_at" in data:
                status = data.get("status", "started")
                score = data.get("evaluation", {}).get("overall_score", "Pending")
                
                real_logs.append({
                    "id": f"inv_{doc.id}",
                    "timestamp": data["created_at"],
                    "type": "system",
                    "user": data.get("user_name", "Unknown Candidate"),
                    "action": f"Interview {status.capitalize()}",
                    "details": f"Role: {data.get('job_title', 'General')} | Score: {score}"
                })

        # 3. Sort all combined events by date (newest exactly at the top)
        real_logs.sort(key=lambda x: x["timestamp"], reverse=True)

        # Return the top 50 most recent events across the whole system
        return {"logs": real_logs[:50]}

    except Exception as e:
        print(f"🚨 Failed to fetch system logs: {e}")
        return {"logs": []}


# AI-log and Question Set Management

@router.get("/ai-logs")
async def get_ai_logs(admin: dict = Depends(get_admin_user)):
    """Fetches the 50 most recent AI interactions for the Admin Panel."""
    logs = []
    # Fetch the 50 most recent logs directly from Firebase
    docs = db.collection("ai_logs").order_by("timestamp", direction="DESCENDING").limit(50).stream()
    
    for doc in docs:
        log_data = doc.to_dict()
        log_data["id"] = doc.id
        logs.append(log_data)
        
    return {"logs": logs}


@router.get("/question-sets")
async def get_question_sets(admin: dict = Depends(get_admin_user)):
    """Fetches all predefined question sets for the Admin Panel."""
    docs = db.collection("question_sets").stream()
    sets = [{"id": doc.id, **doc.to_dict()} for doc in docs]
    return {"question_sets": sets}


@router.post("/question-sets")
async def save_question_set(request: QuestionSetRequest, admin: dict = Depends(get_admin_user)):
    """Creates or updates a predefined question set."""
    # Create a URL-safe ID from the role name (e.g., "React Developer" -> "react_developer")
    doc_id = request.role.lower().strip().replace(" ", "_")
    
    data = {
        "role": request.role,
        "questions": request.questions
    }
    db.collection("question_sets").document(doc_id).set(data)
    return {"message": "Question set saved successfully", "id": doc_id}