from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from app.middleware.auth import security, verify_firebase_token
from app.services.saved_messages_service import saved_messages_service

router = APIRouter(prefix="/api/saved-messages", tags=["saved-messages"])

class SaveMessageRequest(BaseModel):
    id: str
    platform: str
    title: str
    content: str
    sender: str
    timestamp: str
    chat: Optional[str] = None
    url: Optional[str] = None
    ai_scores: Optional[dict] = None

@router.post("")
async def save_message(
    message: SaveMessageRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Save a message"""
    user_data = await verify_firebase_token(credentials)
    uid = user_data['uid']
    
    try:
        saved_message = saved_messages_service.save_message(uid, message.dict())
        return {"message": "Message saved successfully", "saved": saved_message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("")
async def get_saved_messages(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get all saved messages"""
    user_data = await verify_firebase_token(credentials)
    uid = user_data['uid']
    
    messages = saved_messages_service.get_saved_messages(uid)
    return {"messages": messages, "count": len(messages)}

@router.delete("/{saved_id}")
async def delete_saved_message(
    saved_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Delete a saved message"""
    user_data = await verify_firebase_token(credentials)
    uid = user_data['uid']
    
    success = saved_messages_service.delete_saved_message(uid, saved_id)
    if success:
        return {"message": "Message deleted successfully"}
    raise HTTPException(status_code=500, detail="Failed to delete message")

@router.get("/check/{message_id}")
async def check_if_saved(
    message_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Check if a message is saved"""
    user_data = await verify_firebase_token(credentials)
    uid = user_data['uid']
    
    is_saved = saved_messages_service.is_message_saved(uid, message_id)
    return {"is_saved": is_saved}