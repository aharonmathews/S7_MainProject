from typing import List, Dict, Any
import praw
import os
from dotenv import load_dotenv
from datetime import datetime
import warnings

# Suppress the async warning
warnings.filterwarnings('ignore', message='.*PRAW.*asynchronous.*')

load_dotenv()

class RedditService:
    def __init__(self):
        client_id = os.getenv("REDDIT_CLIENT_ID")
        client_secret = os.getenv("REDDIT_CLIENT_SECRET")
        
        if not client_id or not client_secret:
            raise Exception("Reddit credentials not set in .env file")
            
        self.reddit = praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            user_agent="message_aggregator/1.0 by /u/yourusername",
            check_for_async=False  # Disable async check
        )
    
    def fetch_messages(self, keyword: str = "technology", subreddit_name: str = "all", limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch Reddit posts and comments based on keyword"""
        messages = []
        
        try:
            subreddit = self.reddit.subreddit(subreddit_name)
            results = subreddit.search(keyword, sort="relevance", time_filter="week", limit=min(limit, 10))
            
            for post in results:
                # Add the post itself as a message
                post_message = {
                    'id': f'reddit_post_{post.id}',
                    'platform': 'reddit',
                    'title': post.title,
                    'content': post.selftext[:500] if post.selftext else f"Score: {post.score} | Comments: {post.num_comments}",
                    'sender': f"u/{post.author.name}" if post.author else "deleted",
                    'timestamp': datetime.fromtimestamp(post.created_utc).isoformat(),
                    'url': f"https://www.reddit.com{post.permalink}",
                    'chat': f"r/{subreddit_name}",
                    'score': post.score,
                    'num_comments': post.num_comments
                }
                messages.append(post_message)
                
                # Optionally add top comments as separate messages
                try:
                    post.comments.replace_more(limit=0)
                    for comment in list(post.comments)[:2]:  # Top 2 comments per post
                        if hasattr(comment, 'body') and comment.body:
                            comment_message = {
                                'id': f'reddit_comment_{comment.id}',
                                'platform': 'reddit',
                                'title': f'Comment on: {post.title[:50]}...',
                                'content': comment.body[:300],
                                'sender': f"u/{comment.author.name}" if comment.author else "deleted",
                                'timestamp': datetime.fromtimestamp(comment.created_utc).isoformat(),
                                'url': f"https://www.reddit.com{comment.permalink}",
                                'chat': f"r/{subreddit_name}",
                                'score': comment.score
                            }
                            messages.append(comment_message)
                except Exception as e:
                    print(f"Error fetching comments for post {post.id}: {e}")
            
            print(f"✅ Fetched {len(messages)} Reddit messages for keyword '{keyword}'")
            
        except Exception as e:
            print(f"❌ Error fetching Reddit messages: {e}")
            if "401" in str(e):
                print("⚠️  Reddit API authentication failed. Check your credentials.")
                print("👉 Make sure REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET are correct")
        
        return messages

def fetch_reddit_messages(keyword: str = "technology", subreddit: str = "all", limit: int = 20) -> List[Dict[str, Any]]:
    """Standalone function to fetch Reddit messages"""
    try:
        service = RedditService()
        return service.fetch_messages(keyword, subreddit, limit)
    except Exception as e:
        print(f"❌ Reddit service error: {e}")
        return []