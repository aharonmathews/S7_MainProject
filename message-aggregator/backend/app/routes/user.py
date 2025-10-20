from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
from app.middleware.auth import security, verify_firebase_token
from app.services.firebase_service import FirebaseService

router = APIRouter(prefix="/api/user", tags=["user"])

class UserSetup(BaseModel):
    services: List[str]
    preferences: List[str]
    job: Optional[str] = None

class PlatformCredentials(BaseModel):
    platform: str
    credentials: dict

@router.post("/setup")
async def setup_user(
    setup_data: UserSetup,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user_data = await verify_firebase_token(credentials)
    uid = user_data['uid']
    
    success = FirebaseService.update_user_profile(uid, {
        'services': setup_data.services,
        'preferences': setup_data.preferences,
        'job': setup_data.job,
        'setup_completed': True
    })
    
    if success:
        return {"message": "User setup completed"}
    raise HTTPException(status_code=500, detail="Failed to save user setup")

@router.post("/credentials")
async def save_credentials(
    creds_data: PlatformCredentials,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user_data = await verify_firebase_token(credentials)
    uid = user_data['uid']
    
    success = FirebaseService.save_user_credentials(
        uid, 
        creds_data.platform, 
        creds_data.credentials
    )
    
    if success:
        return {"message": f"Credentials saved for {creds_data.platform}"}
    raise HTTPException(status_code=500, detail="Failed to save credentials")

@router.get("/profile")
async def get_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user_data = await verify_firebase_token(credentials)
    uid = user_data['uid']
    
    profile = FirebaseService.get_user_profile(uid)
    if profile:
        return profile
    raise HTTPException(status_code=404, detail="User profile not found")

@router.get("/credentials/{platform}")
async def get_credentials(
    platform: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user_data = await verify_firebase_token(credentials)
    uid = user_data['uid']
    
    creds = FirebaseService.get_user_credentials(uid, platform)
    if creds:
        return creds
    raise HTTPException(status_code=404, detail=f"Credentials not found for {platform}")