from typing import List, Dict, Any
from datetime import datetime
from app.services.firebase_service import FirebaseService, db
import uuid

class SavedMessagesService:
    @staticmethod
    def save_message(user_id: str, message_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save a message for the user"""
        if not db:
            raise Exception("Firestore not initialized")
        
        try:
            saved_id = str(uuid.uuid4())
            saved_message = {
                'id': saved_id,
                'message_id': message_data.get('id'),
                'platform': message_data.get('platform'),
                'title': message_data.get('title'),
                'content': message_data.get('content'),
                'sender': message_data.get('sender'),
                'timestamp': message_data.get('timestamp'),
                'chat': message_data.get('chat'),
                'url': message_data.get('url'),
                'saved_at': datetime.now().isoformat(),
                'ai_scores': message_data.get('ai_scores', {})
            }
            
            db.collection('users').document(user_id)\
                .collection('saved_messages').document(saved_id).set(saved_message)
            
            print(f"✅ Message saved: {saved_id}")
            return saved_message
            
        except Exception as e:
            print(f"❌ Error saving message: {e}")
            raise
    
    @staticmethod
    def get_saved_messages(user_id: str) -> List[Dict[str, Any]]:
        """Get all saved messages for a user"""
        if not db:
            raise Exception("Firestore not initialized")
        
        try:
            messages_ref = db.collection('users').document(user_id)\
                .collection('saved_messages').order_by('saved_at', direction='DESCENDING')
            
            messages = []
            for doc in messages_ref.stream():
                message = doc.to_dict()
                messages.append(message)
            
            print(f"✅ Retrieved {len(messages)} saved messages")
            return messages
            
        except Exception as e:
            print(f"❌ Error getting saved messages: {e}")
            return []
    
    @staticmethod
    def delete_saved_message(user_id: str, saved_id: str) -> bool:
        """Delete a saved message"""
        if not db:
            raise Exception("Firestore not initialized")
        
        try:
            db.collection('users').document(user_id)\
                .collection('saved_messages').document(saved_id).delete()
            
            print(f"✅ Saved message deleted: {saved_id}")
            return True
            
        except Exception as e:
            print(f"❌ Error deleting saved message: {e}")
            return False
    
    @staticmethod
    def is_message_saved(user_id: str, message_id: str) -> bool:
        """Check if a message is already saved"""
        if not db:
            return False
        
        try:
            messages_ref = db.collection('users').document(user_id)\
                .collection('saved_messages')\
                .where('message_id', '==', message_id).limit(1)
            
            docs = list(messages_ref.stream())
            return len(docs) > 0
            
        except Exception as e:
            print(f"❌ Error checking if message is saved: {e}")
            return False

saved_messages_service = SavedMessagesService()