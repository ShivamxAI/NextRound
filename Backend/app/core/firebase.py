import os
import firebase_admin
from firebase_admin import credentials, firestore, auth

def initialize_firebase():
    """Initializes the Firebase Admin SDK."""
    # Check if already initialized to prevent errors on server reload
    if not firebase_admin._apps:
        
        # 'K_SERVICE' is an environment variable that ONLY exists inside Google Cloud Run.
        if os.environ.get("K_SERVICE"):
            print("🔥 Initializing Firebase Admin in Production mode...")
            firebase_admin.initialize_app()
            
        else:
            # If running LOCALLY on the computer. Use the JSON key file.
            print("🔥 Initializing Firebase Admin in Local mode...")
            cred = credentials.Certificate("firebase-adminsdk.json")
            firebase_admin.initialize_app(cred)

# Initialize it
initialize_firebase()

# Export db and auth so other files can import them easily
db = firestore.client()