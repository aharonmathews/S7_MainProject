from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.firebase_service import FirebaseService

security = HTTPBearer()

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials):
    token = credentials.credentials
    decoded_token = FirebaseService.verify_token(token)
    if not decoded_token:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    return decoded_token