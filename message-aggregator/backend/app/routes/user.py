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

class PreferencesUpdate(BaseModel):
    preferences: List[str]

class PlatformCredentials(BaseModel):
    platform: str
    credentials: dict

@router.post("/setup")
async def setup_user(
    setup_data: UserSetup,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Setup user profile with services and preferences"""
    try:
        user_data = await verify_firebase_token(credentials)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        uid = user_data['uid']
        email = user_data.get('email', '')
        
        print(f"🔧 Setting up user {uid}...")
        print(f"   Services: {setup_data.services}")
        print(f"   Preferences: {setup_data.preferences}")
        print(f"   Job: {setup_data.job}")
        
        # Save to Firestore
        success = FirebaseService.update_user_profile(uid, {
            'services': setup_data.services,
            'preferences': setup_data.preferences,
            'job': setup_data.job or None,
            'setup_completed': True,
            'updated_at': __import__('firebase_admin').firestore.SERVER_TIMESTAMP
        })
        
        if success:
            return {
                "message": "User setup completed successfully",
                "uid": uid,
                "services": setup_data.services,
                "preferences": setup_data.preferences
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to save profile")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in /setup: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/preferences")
async def update_preferences(
    data: PreferencesUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Update user preferences (called from dashboard)"""
    try:
        user_data = await verify_firebase_token(credentials)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        uid = user_data['uid']
        
        if not data.preferences or len(data.preferences) == 0:
            raise HTTPException(status_code=400, detail="Preferences cannot be empty")
        
        print(f"🔄 Updating preferences for user {uid}...")
        print(f"   New preferences: {data.preferences}")
        
        success = FirebaseService.update_user_profile(uid, {
            'preferences': data.preferences,
            'updated_at': __import__('firebase_admin').firestore.SERVER_TIMESTAMP
        })
        
        if success:
            return {
                "message": "Preferences updated successfully",
                "preferences": data.preferences
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to update preferences")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in /preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/credentials")
async def save_credentials(
    creds_data: PlatformCredentials,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Save platform credentials"""
    try:
        user_data = await verify_firebase_token(credentials)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        uid = user_data['uid']
        
        success = FirebaseService.save_user_credentials(
            uid, 
            creds_data.platform, 
            creds_data.credentials
        )
        
        if success:
            return {"message": f"Credentials saved for {creds_data.platform}"}
        raise HTTPException(status_code=500, detail="Failed to save credentials")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error saving credentials: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile")
async def get_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get user profile"""
    try:
        user_data = await verify_firebase_token(credentials)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        uid = user_data['uid']
        
        profile = FirebaseService.get_user_profile(uid)
        if profile:
            return profile
        
        # Return empty profile if doesn't exist
        return {
            'uid': uid,
            'services': [],
            'preferences': [],
            'job': None,
            'setup_completed': False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/credentials/{platform}")
async def get_credentials(
    platform: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get platform credentials"""
    try:
        user_data = await verify_firebase_token(credentials)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        uid = user_data['uid']
        
        creds = FirebaseService.get_user_credentials(uid, platform)
        if creds:
            return creds
        raise HTTPException(status_code=404, detail=f"No credentials for {platform}")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting credentials: {e}")
        raise HTTPException(status_code=500, detail=str(e))