import firebase_admin
from firebase_admin import credentials, firestore, auth

def initialize_firebase():
    """Initializes the Firebase Admin SDK."""
    # Check if already initialized to prevent errors on server reload
    if not firebase_admin._apps:
        # Point to the JSON file you downloaded
        cred = credentials.Certificate("firebase-adminsdk.json")
        
        # Initialize the app
        firebase_admin.initialize_app(cred)
        print("🔥 Firebase Admin initialized successfully!")

# We export db and auth so other files can import them easily
initialize_firebase()
db = firestore.client()