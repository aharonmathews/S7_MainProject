from typing import List, Dict, Any
import requests
import os

BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN")

def create_headers(token):
    return {"Authorization": f"Bearer {token}"}

def search_tweets(keyword: str, max_results: int = 10):
    if not BEARER_TOKEN:
        print("❌ Twitter: TWITTER_BEARER_TOKEN not set in .env")
        return []

    url = "https://api.twitter.com/2/tweets/search/recent"
    headers = create_headers(BEARER_TOKEN)
    # Twitter API v2 minimum is 10, maximum is 100 for recent search
    clamped = max(10, min(max_results, 100))
    params = {
        "query": keyword,
        "max_results": clamped,
        "tweet.fields": "author_id,created_at,public_metrics,entities",
    }
    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        print(f"❌ Twitter API error {response.status_code}: {response.text[:300]}")
        return []
    data = response.json()
    tweets = data.get("data", [])
    print(f"✅ Twitter: fetched {len(tweets)} tweets for '{keyword}'")
    return tweets

def fetch_twitter_messages(keyword: str = "python", max_results: int = 10) -> List[Dict[str, Any]]:
    tweets = search_tweets(keyword, max_results)
    messages = []
    
    for tweet in tweets:
        entities = tweet.get("entities", {})
        mentions = [m["username"] for m in entities.get("mentions", [])]
        hashtags = [h["tag"] for h in entities.get("hashtags", [])]
        urls = [u["expanded_url"] for u in entities.get("urls", [])]
        
        messages.append({
            "id": f"twitter_{tweet['id']}",
            "platform": "twitter",
            "title": f"Tweet about {keyword}",
            "content": tweet["text"],
            "sender": tweet.get("author_id", "unknown"),
            "mentions": mentions,
            "hashtags": hashtags,
            "timestamp": tweet.get("created_at", ""),
            "url": urls[0] if urls else ""
        })
    
    return messages


def fetch_twitter_messages(keyword: str = "python", max_results: int = 1) -> List[Dict[str, Any]]:
    tweets = search_tweets(keyword, max_results)
    messages = []
    
    for tweet in tweets:
        entities = tweet.get("entities", {})
        mentions = [m["username"] for m in entities.get("mentions", [])]
        hashtags = [h["tag"] for h in entities.get("hashtags", [])]
        urls = [u["expanded_url"] for u in entities.get("urls", [])]
        
        messages.append({
            "id": f"twitter_{tweet['id']}",
            "platform": "twitter",
            "title": f"Tweet about {keyword}",
            "content": tweet["text"],
            "mentions": mentions,
            "hashtags": hashtags,
            "timestamp": tweet.get("created_at", ""),
            "url": urls[0] if urls else ""
        })
    
    return messages