from typing import List, Dict, Any
import requests
import os

BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN")

def create_headers(token):
    return {"Authorization": f"Bearer {token}"}

def search_tweets(keyword: str, max_results: int = 10):
    url = "https://api.twitter.com/2/tweets/search/recent"
    headers = create_headers(BEARER_TOKEN)
    params = {
        "query": keyword,
        "max_results": max_results,
        "tweet.fields": "author_id,created_at,public_metrics,entities",
    }
    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        return []
    return response.json().get("data", [])

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