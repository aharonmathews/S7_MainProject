from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.middleware.auth import security, verify_firebase_token
from app.services.calendar_service import calendar_service
from app.services.date_extractor import date_extractor

router = APIRouter(prefix="/api/calendar", tags=["calendar"])

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    date: str
    time: Optional[str] = ""
    platform: Optional[str] = "manual"
    message_id: Optional[str] = None

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None

@router.post("/events")
async def create_event(
    event: EventCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Create a new calendar event"""
    user_data = await verify_firebase_token(credentials)
    uid = user_data['uid']
    
    try:
        created_event = calendar_service.create_event(uid, event.dict())
        return created_event
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/events")
async def get_events(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """Get all calendar events for the user"""
    user_data = await verify_firebase_token(credentials)
    uid = user_data['uid']
    
    events = calendar_service.get_events(uid, start_date, end_date)
    return {"events": events}

@router.put("/events/{event_id}")
async def update_event(
    event_id: str,
    updates: EventUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Update an existing event"""
    user_data = await verify_firebase_token(credentials)
    uid = user_data['uid']
    
    # Filter out None values
    update_dict = {k: v for k, v in updates.dict().items() if v is not None}
    
    success = calendar_service.update_event(uid, event_id, update_dict)
    if success:
        return {"message": "Event updated successfully"}
    raise HTTPException(status_code=500, detail="Failed to update event")

@router.delete("/events/{event_id}")
async def delete_event(
    event_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Delete a calendar event"""
    user_data = await verify_firebase_token(credentials)
    uid = user_data['uid']
    
    success = calendar_service.delete_event(uid, event_id)
    if success:
        return {"message": "Event deleted successfully"}
    raise HTTPException(status_code=500, detail="Failed to delete event")

@router.post("/extract-dates")
async def extract_dates_from_message(
    message: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Extract dates and times from a message"""
    await verify_firebase_token(credentials)
    
    suggested_event = date_extractor.suggest_event_from_message(message)
    
    if suggested_event:
        return suggested_event
    
    return {"message": "No dates or times found in message"}