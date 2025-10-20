import firebase_admin
from firebase_admin import credentials, auth, firestore
import os

# Initialize Firebase Admin SDK
try:
    cred = credentials.Certificate("firebase-credentials.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Firebase initialized successfully")
except Exception as e:
    print(f"❌ Firebase initialization error: {e}")
    print("⚠️  Make sure firebase-credentials.json exists in backend folder")
    db = None

class FirebaseService:
    @staticmethod
    def verify_token(token: str):
        try:
            decoded_token = auth.verify_id_token(token)
            return decoded_token
        except Exception as e:
            print(f"❌ Token verification error: {e}")
            return None
    
    @staticmethod
    def create_user_profile(uid: str, email: str, user_data: dict):
        if not db:
            print("⚠️  Firestore not initialized")
            return False
        try:
            user_ref = db.collection('users').document(uid)
            user_ref.set({
                'email': email,
                'created_at': firestore.SERVER_TIMESTAMP,
                **user_data
            })
            print(f"✅ User profile created for {uid}")
            return True
        except Exception as e:
            print(f"❌ Error creating user profile: {e}")
            return False
    
    @staticmethod
    def get_user_profile(uid: str):
        if not db:
            print("⚠️  Firestore not initialized")
            return None
        try:
            user_ref = db.collection('users').document(uid)
            doc = user_ref.get()
            if doc.exists:
                print(f"✅ Profile found for user {uid}")
                return doc.to_dict()
            else:
                print(f"⚠️  No profile found for user {uid}")
                return None
        except Exception as e:
            print(f"❌ Error getting user profile: {e}")
            return None
    
    @staticmethod
    def update_user_profile(uid: str, updates: dict):
        if not db:
            print("⚠️  Firestore not initialized")
            return False
        try:
            user_ref = db.collection('users').document(uid)
            # Use set with merge=True to create if doesn't exist, update if exists
            user_ref.set(updates, merge=True)
            print(f"✅ Profile updated for user {uid}")
            print(f"   Updated fields: {list(updates.keys())}")
            return True
        except Exception as e:
            print(f"❌ Error updating user profile: {e}")
            if "SERVICE_DISABLED" in str(e):
                print("⚠️  Firestore API is not enabled!")
                print("👉 Enable it at: https://console.firebase.google.com/project/mainproject-1f5b8/firestore")
            return False
    
    @staticmethod
    def save_user_credentials(uid: str, platform: str, credentials_data: dict):
        if not db:
            print("⚠️  Firestore not initialized")
            return False
        try:
            creds_ref = db.collection('users').document(uid).collection('credentials').document(platform)
            creds_ref.set(credentials_data)
            print(f"✅ Credentials saved for {platform} (user: {uid})")
            return True
        except Exception as e:
            print(f"❌ Error saving credentials for {platform}: {e}")
            return False
    
    @staticmethod
    def get_user_credentials(uid: str, platform: str):
        if not db:
            print("⚠️  Firestore not initialized")
            return None
        try:
            creds_ref = db.collection('users').document(uid).collection('credentials').document(platform)
            doc = creds_ref.get()
            if doc.exists:
                print(f"✅ Credentials found for {platform}")
                return doc.to_dict()
            else:
                print(f"⚠️  No credentials found for {platform}")
                return None
        except Exception as e:
            print(f"❌ Error getting credentials for {platform}: {e}")
            return None