from fastapi import FastAPI, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials
from app.services.aggregator import MessageAggregator
from app.services.gmail import GmailService
from app.services.firebase_service import FirebaseService
from app.middleware.auth import security, verify_firebase_token
from app.routes import user

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)

aggregator = MessageAggregator()
gmail_service = GmailService()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Message Aggregator API!"}

@app.get("/messages")
async def get_messages(
    platforms: str = Query(default=""),
    twitter_keyword: str = Query(default="python"),
    reddit_keyword: str = Query(default="technology"),
    reddit_subreddit: str = Query(default="all"),
    limit: int = Query(default=20),
    filter_by_preferences: bool = Query(default=True),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    # Verify authentication
    user_data = await verify_firebase_token(credentials)
    uid = user_data['uid']
    
    # Get user preferences from Firestore
    profile = FirebaseService.get_user_profile(uid)
    user_preferences = profile.get('preferences', []) if profile else []
    
    platform_list = [p.strip() for p in platforms.split(",") if p.strip()]
    
    result = await aggregator.aggregate_messages_async(
        platform_list, 
        user_preferences,
        twitter_keyword,
        reddit_keyword,
        reddit_subreddit,
        limit,
        filter_by_preferences
    )
    
    return result

@app.get("/auth/gmail")
async def gmail_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    await verify_firebase_token(credentials)
    auth_url = gmail_service.get_auth_url()
    return {"auth_url": auth_url}

@app.get("/auth/gmail/callback")
async def gmail_callback(code: str):
    gmail_service.authenticate(code)
    return RedirectResponse(url="http://localhost:5173?gmail_auth=success")

@app.get("/auth/gmail/status")
async def gmail_status(credentials: HTTPAuthorizationCredentials = Depends(security)):
    await verify_firebase_token(credentials)
    has_creds = gmail_service.load_credentials()
    return {"authenticated": has_creds}