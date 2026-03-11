from fastapi import FastAPI, HTTPException, Query, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials
from typing import List, Optional
from dotenv import load_dotenv
import traceback
import uvicorn

from app.services.aggregator import MessageAggregator
from app.services.firebase_service import FirebaseService
from app.services.gmail import get_oauth_flow, GmailService, CLIENT_ID, CLIENT_SECRET
from app.services.discord_service import get_discord_service
from app.services.date_extractor import date_extractor
from app.services.rag_service import rag_service
from app.middleware.auth import security, verify_firebase_token
from app.services.message_cache_service import message_cache_service

from google.oauth2.credentials import Credentials
from app.routes import user, calendar, saved_messages

import os
import json

load_dotenv()

app = FastAPI(title="Message Aggregator API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(user.router)
app.include_router(calendar.router)
app.include_router(saved_messages.router)  # ✅ Add this


# Initialize aggregator
aggregator = MessageAggregator()

# Store Gmail credentials temporarily
gmail_credentials_store = {}

@app.on_event("startup")
async def startup_event():
    """Initialize Discord bot when app starts"""
    print("🚀 Starting Discord bot...")
    await get_discord_service()
    print("✅ Discord bot initialized")

@app.get("/")
async def root():
    return {"message": "Message Aggregator API is running"}

# ✅ Add this new endpoint
@app.post("/extract-dates")
async def extract_dates(
    text: str = Body(..., embed=True),
    title: str = Body(None, embed=True)
):
    """Extract dates and times from message text"""
    try:
        # Combine title and text for extraction
        full_text = f"{title or ''}\n{text}"
        
        dates_and_times = date_extractor.extract_dates_and_times(full_text)
        
        # Group dates and times together if they're close
        grouped_events = []
        i = 0
        while i < len(dates_and_times):
            item = dates_and_times[i]
            
            if item['type'] == 'date':
                # Check if next item is a time
                event = {
                    'date': item['parsed'],
                    'date_display': item['display'],
                    'date_text': item['text'],
                    'time': None,
                    'time_display': None,
                    'time_text': None,
                    'context': date_extractor.extract_context(
                        full_text, 
                        item['start_pos'], 
                        item['end_pos']
                    )
                }
                
                # Check if there's a time nearby (within next 2 items)
                if i + 1 < len(dates_and_times):
                    next_item = dates_and_times[i + 1]
                    if next_item['type'] == 'time' and (next_item['start_pos'] - item['end_pos']) < 100:
                        event['time'] = next_item['parsed']
                        event['time_display'] = next_item['display']
                        event['time_text'] = next_item['text']
                        i += 1  # Skip the time item
                
                grouped_events.append(event)
            
            elif item['type'] == 'time':
                # Standalone time without date
                grouped_events.append({
                    'date': None,
                    'date_display': None,
                    'date_text': None,
                    'time': item['parsed'],
                    'time_display': item['display'],
                    'time_text': item['text'],
                    'context': date_extractor.extract_context(
                        full_text,
                        item['start_pos'],
                        item['end_pos']
                    )
                })
            
            i += 1
        
        return {
            'events': grouped_events,
            'count': len(grouped_events)
        }
        
    except Exception as e:
        print(f"❌ Error extracting dates: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
@app.post("/api/rag/index")
async def index_messages_for_rag(
    body: dict = Body(...),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token_data = await verify_firebase_token(credentials)  # ← pass full credentials, add await
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    uid = token_data['uid']
    messages = body.get('messages', {})
    all_messages = messages.get('important', []) + messages.get('regular', [])
    rag_service.index_messages(uid, all_messages)

    return {
        "status": "indexed",
        "message_count": len(all_messages),
        "uid": uid
    }


@app.post("/api/rag/query")
async def query_messages(
    body: dict = Body(...),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token_data = await verify_firebase_token(credentials)  # ← pass full credentials, add await
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    uid = token_data['uid']
    query = body.get('query', '').strip()

    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    if not rag_service.has_index(uid):
        return {
            "answer": "Please load your messages first before asking questions.",
            "sources": [],
            "query": query
        }

    result = rag_service.answer_query(uid, query)
    return result


@app.get("/api/rag/status")
async def rag_status(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token_data = await verify_firebase_token(credentials)  # ← pass full credentials, add await
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    uid = token_data['uid']
    store = rag_service._stores.get(uid, {})

    return {
        "indexed": rag_service.has_index(uid),
        "message_count": len(store.get('messages', []))
    }


@app.get("/messages")
async def get_messages(
    platforms: str = Query(..., description="Comma-separated list of platforms"),
    twitter_keyword: str = Query("python", description="Twitter search keyword"),
    reddit_keyword: str = Query("technology", description="Reddit search keyword"),
    reddit_subreddit: str = Query("all", description="Reddit subreddit"),
    limit: int = Query(20, description="Number of messages per platform"),
    filter_by_preferences: bool = Query(False, description="Filter by user preferences"),
    user_id: Optional[str] = Query(None, description="Firebase user ID")
):
    """Fetch messages from selected platforms"""
    try:
        selected_platforms = [p.strip() for p in platforms.split(',')]
        
        user_preferences = []
        if filter_by_preferences and user_id:
            print(f"🔍 Fetching profile for user: {user_id}")
            profile = FirebaseService.get_user_profile(user_id)
            if profile and 'preferences' in profile:
                user_preferences = profile['preferences']
                print(f"✅ Profile found for user {user_id}")
                print(f"   Preferences: {user_preferences}")
            else:
                print(f"⚠️  No profile found for user {user_id}")
        
        result = await aggregator.aggregate_messages_async(
            selected_platforms=selected_platforms,
            user_preferences=user_preferences if filter_by_preferences else None,
            twitter_keyword=twitter_keyword,
            reddit_keyword=reddit_keyword,
            reddit_subreddit=reddit_subreddit,
            limit=limit,
            filter_by_preferences=filter_by_preferences,
            user_id=user_id
        )
        
        return result
        
    except Exception as e:
        print(f"❌ Error in /messages endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/user/preferences")
async def save_preferences(user_id: str, preferences: List[str]):
    """Save user preferences to Firebase"""
    try:
        FirebaseService.update_user_profile(user_id, {
            'preferences': preferences
        })
        return {"message": "Preferences saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/preferences")
async def get_preferences(user_id: str):
    """Get user preferences from Firebase"""
    try:
        profile = FirebaseService.get_user_profile(user_id)
        if profile and 'preferences' in profile:
            return {"preferences": profile['preferences']}
        return {"preferences": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Gmail OAuth routes
@app.get("/auth/gmail/status")
async def gmail_status(user_id: Optional[str] = Query(None)):
    """Check Gmail authentication status"""
    if user_id and user_id in gmail_credentials_store:
        return {"authenticated": True}
    if user_id:
        creds = FirebaseService.get_user_credentials(user_id, 'gmail')
        if creds:
            return {"authenticated": True}
    return {"authenticated": False}

@app.get("/auth/gmail")
async def gmail_auth(user_id: str = Query(...)):
    """Initiate Gmail OAuth flow"""
    try:
        flow = get_oauth_flow()
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent',
            state=user_id
        )
        print(f"🔐 Gmail OAuth URL generated for user {user_id}")
        return {"auth_url": authorization_url}
    except Exception as e:
        print(f"❌ Error generating Gmail OAuth URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/auth/gmail/callback")
async def gmail_callback(
    code: str = Query(...),
    state: str = Query(...)
):
    """Handle Gmail OAuth callback"""
    try:
        user_id = state
        print(f"✅ Gmail OAuth callback received for user {user_id}")
        
        flow = get_oauth_flow()
        flow.fetch_token(code=code)
        
        credentials = flow.credentials
        
        creds_dict = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'scopes': list(credentials.scopes) if credentials.scopes else []
        }
        
        gmail_credentials_store[user_id] = credentials
        FirebaseService.save_user_credentials(user_id, 'gmail', creds_dict)
        
        print(f"✅ Gmail credentials saved for user {user_id}")
        
        return RedirectResponse(url="http://localhost:3000/?gmail=success")
        
    except Exception as e:
        print(f"❌ Error in Gmail OAuth callback: {e}")
        import traceback
        traceback.print_exc()
        return RedirectResponse(url="http://localhost:3000/?gmail=error")

@app.get("/api/cache/status")
async def get_cache_status(
    platforms: str = Query(...),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get cache status for all platforms for this user"""
    token_data = await verify_firebase_token(credentials)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    uid = token_data['uid']
    platform_list = [p.strip() for p in platforms.split(',')]
    info = message_cache_service.get_cache_info(uid, platform_list)
    return {"cache_info": info}


@app.delete("/api/cache/{platform}")
async def invalidate_platform_cache(
    platform: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Force refresh a platform's cache"""
    token_data = await verify_firebase_token(credentials)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    uid = token_data['uid']
    message_cache_service.invalidate_cache(uid, platform)
    return {"message": f"Cache cleared for {platform}. Next load will fetch fresh data."}


@app.delete("/api/cache")
async def invalidate_all_cache(
    platforms: str = Query(...),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Force refresh all platform caches"""
    token_data = await verify_firebase_token(credentials)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    uid = token_data['uid']
    platform_list = [p.strip() for p in platforms.split(',')]
    for platform in platform_list:
        message_cache_service.invalidate_cache(uid, platform)
    return {"message": f"Cache cleared for: {', '.join(platform_list)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)