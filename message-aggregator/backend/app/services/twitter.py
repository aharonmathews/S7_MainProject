# backend/app/services/twitter.py

from typing import List, Dict, Any
import requests
import os

BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN")

def create_headers(token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {token}"}

def search_tweets(keyword: str, max_results: int = 20):
    if not BEARER_TOKEN:
        print("❌ Twitter: TWITTER_BEARER_TOKEN not set")
        return []

    url = "https://api.twitter.com/2/tweets/search/recent"
    clamped = max(10, min(max_results, 100))

    params = {
        "query": keyword,
        "max_results": clamped,
        "tweet.fields": "author_id,created_at,public_metrics,entities",
        # optional but recommended if you want usernames later:
        # "expansions": "author_id",
        # "user.fields": "username,name",
    }

    resp = requests.get(url, headers=create_headers(BEARER_TOKEN), params=params, timeout=15)
    if resp.status_code != 200:
        print(f"❌ Twitter API error {resp.status_code}: {resp.text[:300]}")
        return []

    return resp.json().get("data", [])

def fetch_twitter_messages(keyword: str = "python", max_results: int = 20) -> List[Dict[str, Any]]:
    tweets = search_tweets(keyword, max_results)
    messages: List[Dict[str, Any]] = []

    for t in tweets:
        entities = t.get("entities", {}) or {}
        mentions = [m.get("username") for m in entities.get("mentions", []) if m.get("username")]
        hashtags = [h.get("tag") for h in entities.get("hashtags", []) if h.get("tag")]
        urls = [u.get("expanded_url") for u in entities.get("urls", []) if u.get("expanded_url")]

        messages.append({
            "id": f"twitter_{t['id']}",
            "platform": "twitter",
            "title": f"Tweet about {keyword}",
            "content": t.get("text", ""),
            "sender": t.get("author_id", "unknown"),
            "mentions": mentions,
            "hashtags": hashtags,
            "timestamp": t.get("created_at", ""),
            "url": urls[0] if urls else "",
        })

    return messages