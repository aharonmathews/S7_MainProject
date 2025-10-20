from typing import List, Dict, Any
import praw
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

class RedditService:
    def __init__(self):
        self.reddit = praw.Reddit(
            client_id=os.getenv("REDDIT_CLIENT_ID"),
            client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
            user_agent="message_aggregator/1.0"
        )
    
    def fetch_messages(self, keyword: str = "technology", subreddit_name: str = "all", limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch Reddit posts and comments based on keyword"""
        messages = []
        
        try:
            subreddit = self.reddit.subreddit(subreddit_name)
            results = subreddit.search(keyword, sort="relevance", time_filter="week", limit=limit)
            
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
                    for comment in post.comments[:3]:  # Top 3 comments per post
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
        
        return messages

def fetch_reddit_messages(keyword: str = "technology", subreddit: str = "all", limit: int = 20) -> List[Dict[str, Any]]:
    """Standalone function to fetch Reddit messages"""
    service = RedditService()
    return service.fetch_messages(keyword, subreddit, limit)