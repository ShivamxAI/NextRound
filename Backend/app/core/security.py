from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from app.core.firebase import db

# This tells FastAPI to look for a "Bearer" token in the Authorization header
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validates the Firebase ID token and returns the decoded token payload.
    """
    token = credentials.credentials
    try:
        # Verify the token with Firebase Admin SDK
        decoded_token = auth.verify_id_token(token)
        return decoded_token  # Contains 'uid', 'email', etc.
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
        )
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}",
        )

def get_admin_user(current_user: dict = Depends(get_current_user)):
    """
    VIP Bouncer: First checks if the user is logged in, 
    then checks Firestore to see if they have the 'admin' role.
    """
    user_id = current_user["uid"]
    
    # Check Firestore for the user's role
    user_doc = db.collection("users").document(user_id).get()
    
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User profile not found in database.")
        
    user_data = user_doc.to_dict()
    
    # If they aren't an admin, kick them out immediately!
    if user_data.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: You do not have Admin privileges.")
        
    return user_data