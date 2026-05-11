import firebase_admin
from firebase_admin import credentials, auth, firestore
import os
from typing import List, Dict, Any

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
        """
        Update user profile using merge=True.
        This creates the document if it doesn't exist, or updates it if it does.
        """
        if not db:
            print("⚠️  Firestore not initialized")
            return False
        try:
            user_ref = db.collection('users').document(uid)
            # merge=True: Don't overwrite existing fields, just update these ones
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
            creds_ref.set(credentials_data, merge=True)
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
            return None
        except Exception as e:
            print(f"❌ Error getting credentials: {e}")
            return None
        
    @staticmethod
    def record_message_interaction(
        uid: str,
        message: Dict[str, Any],
        clicks_inc: int = 0,
        saves_inc: int = 0
    ) -> bool:
        if not db:
            print("⚠️ Firestore not initialized")
            return False

        try:
            message_id = message.get("id") or message.get("message_id")
            if not message_id:
                print("⚠️ Missing message_id for interaction")
                return False

            ref = (
                db.collection("users")
                  .document(uid)
                  .collection("interactions")
                  .document(message_id)
            )

            payload = {
                "message_id": message_id,
                "platform": message.get("platform"),
                "title": message.get("title"),
                "sender": message.get("sender"),
                "timestamp": message.get("timestamp"),
                "clicks": firestore.Increment(int(clicks_inc)),
                "saves": firestore.Increment(int(saves_inc)),
                "updated_at": firestore.SERVER_TIMESTAMP,
            }

            ref.set(payload, merge=True)
            return True
        except Exception as e:
            print(f"❌ Error recording interaction: {e}")
            return False

    @staticmethod
    def get_message_interactions(
        uid: str,
        message_ids: List[str]
    ) -> Dict[str, Dict[str, int]]:
        if not db or not message_ids:
            return {}

        try:
            refs = [
                db.collection("users").document(uid)
                  .collection("interactions").document(mid)
                for mid in message_ids
                if mid
            ]

            result: Dict[str, Dict[str, int]] = {}
            for doc in db.get_all(refs):
                if not doc.exists:
                    continue
                data = doc.to_dict() or {}
                mid = data.get("message_id") or doc.id
                result[mid] = {
                    "clicks": int(data.get("clicks", 0) or 0),
                    "saves": int(data.get("saves", 0) or 0),
                }
            return result
        except Exception as e:
            print(f"❌ Error getting interactions: {e}")
            return {}

    @staticmethod
    def list_interactions(uid: str, limit: int = 200) -> List[Dict[str, Any]]:
        if not db:
            return []

        try:
            docs = (
                db.collection("users").document(uid)
                  .collection("interactions")
                  .limit(limit)
                  .stream()
            )
            items = [d.to_dict() for d in docs if d.exists]
            # Sort in Python to avoid needing Firestore composite indexes
            items.sort(key=lambda x: (int(x.get("saves", 0) or 0), int(x.get("clicks", 0) or 0)), reverse=True)
            return items
        except Exception as e:
            print(f"❌ Error listing interactions: {e}")
            return []