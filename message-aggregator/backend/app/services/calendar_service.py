from typing import List, Dict, Any, Optional
from datetime import datetime
from app.services.firebase_service import FirebaseService, db
import uuid

class CalendarService:
    @staticmethod
    def create_event(user_id: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new calendar event"""
        if not db:
            raise Exception("Firestore not initialized")
        
        try:
            event_id = str(uuid.uuid4())
            event = {
                'id': event_id,
                'title': event_data.get('title', 'Untitled Event'),
                'description': event_data.get('description', ''),
                'date': event_data.get('date'),
                'time': event_data.get('time', ''),
                'platform': event_data.get('platform', 'manual'),
                'message_id': event_data.get('message_id'),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            db.collection('users').document(user_id)\
                .collection('calendar_events').document(event_id).set(event)
            
            print(f"✅ Event created: {event_id}")
            return event
            
        except Exception as e:
            print(f"❌ Error creating event: {e}")
            raise
    
    @staticmethod
    def get_events(user_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all calendar events for a user"""
        if not db:
            raise Exception("Firestore not initialized")
        
        try:
            events_ref = db.collection('users').document(user_id)\
                .collection('calendar_events')
            
            # Apply date filters if provided
            if start_date:
                events_ref = events_ref.where('date', '>=', start_date)
            if end_date:
                events_ref = events_ref.where('date', '<=', end_date)
            
            events = []
            for doc in events_ref.stream():
                event = doc.to_dict()
                events.append(event)
            
            # Sort by date and time
            events.sort(key=lambda x: (x.get('date', ''), x.get('time', '')))
            
            print(f"✅ Retrieved {len(events)} events")
            return events
            
        except Exception as e:
            print(f"❌ Error getting events: {e}")
            return []
    
    @staticmethod
    def update_event(user_id: str, event_id: str, updates: Dict[str, Any]) -> bool:
        """Update an existing event"""
        if not db:
            raise Exception("Firestore not initialized")
        
        try:
            updates['updated_at'] = datetime.now().isoformat()
            
            db.collection('users').document(user_id)\
                .collection('calendar_events').document(event_id).update(updates)
            
            print(f"✅ Event updated: {event_id}")
            return True
            
        except Exception as e:
            print(f"❌ Error updating event: {e}")
            return False
    
    @staticmethod
    def delete_event(user_id: str, event_id: str) -> bool:
        """Delete a calendar event"""
        if not db:
            raise Exception("Firestore not initialized")
        
        try:
            db.collection('users').document(user_id)\
                .collection('calendar_events').document(event_id).delete()
            
            print(f"✅ Event deleted: {event_id}")
            return True
            
        except Exception as e:
            print(f"❌ Error deleting event: {e}")
            return False

calendar_service = CalendarService()