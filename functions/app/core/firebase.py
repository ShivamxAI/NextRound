import firebase_admin
from firebase_admin import credentials, firestore

# This checks if the app is already running. If not, it uses Firebase's default cloud credentials!
if not firebase_admin._apps:
    firebase_admin.initialize_app()

db = firestore.client()