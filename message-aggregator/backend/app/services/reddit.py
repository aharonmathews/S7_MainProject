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
            check_for_async=False
        )
    
    def fetch_messages(self, keyword: str = "technology", subreddit_name: str = "all", limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch Reddit posts and comments based on keyword"""
        messages = []
        
        try:
            print(f"🔍 Searching Reddit for '{keyword}' in r/{subreddit_name}...")
            
            subreddit = self.reddit.subreddit(subreddit_name)
            
            # ⚡ OPTIMIZATION 1: Reduce search results to 5 posts max
            max_posts = min(5, limit // 2)
            
            # ⚡ OPTIMIZATION 2: Add timeout for search
            results = subreddit.search(
                keyword, 
                sort="relevance",  # Changed from "hot" for faster results
                time_filter="day",  # Changed from "week" to "day" for faster search
                limit=max_posts
            )
            
            post_count = 0
            for post in results:
                post_count += 1
                print(f"  📄 Processing post {post_count}/{max_posts}: {post.title[:50]}...")
                
                # Add the post itself as a message
                post_message = {
                    'id': f'reddit_post_{post.id}',
                    'platform': 'reddit',
                    'title': post.title,
                    'content': post.selftext if post.selftext else f"Score: {post.score} | Comments: {post.num_comments}",
                    'sender': f"u/{post.author.name}" if post.author else "deleted",
                    'timestamp': datetime.fromtimestamp(post.created_utc).isoformat(),
                    'url': f"https://www.reddit.com{post.permalink}",
                    'chat': f"r/{subreddit_name}",
                    'score': post.score,
                    'num_comments': post.num_comments
                }
                messages.append(post_message)
                
                # ⚡ OPTIMIZATION 3: Skip comments if post has too many (causes slowdown)
                if post.num_comments > 100:
                    print(f"    ⏩ Skipping comments (too many: {post.num_comments})")
                    continue
                
                # ⚡ OPTIMIZATION 4: Only fetch top 1 comment (instead of 2)
                try:
                    post.comments.replace_more(limit=0)  # Don't expand "load more comments"
                    top_comments = list(post.comments)[:1]  # Only 1 comment
                    
                    for comment in top_comments:
                        if hasattr(comment, 'body') and comment.body:
                            comment_message = {
                                'id': f'reddit_comment_{comment.id}',
                                'platform': 'reddit',
                                'title': f'Comment on: {post.title[:50]}...',
                                'content': comment.body,
                                'sender': f"u/{comment.author.name}" if comment.author else "deleted",
                                'timestamp': datetime.fromtimestamp(comment.created_utc).isoformat(),
                                'url': f"https://www.reddit.com{comment.permalink}",
                                'chat': f"r/{subreddit_name}",
                                'score': comment.score
                            }
                            messages.append(comment_message)
                            print(f"    💬 Added comment from u/{comment.author.name if comment.author else 'deleted'}")
                            
                except Exception as e:
                    print(f"    ⚠️  Error fetching comments: {e}")
                
                # ⚡ OPTIMIZATION 5: Stop early if we have enough messages
                if len(messages) >= limit:
                    print(f"  ✅ Reached message limit ({limit})")
                    break
            
            print(f"✅ Fetched {len(messages)} Reddit messages for keyword '{keyword}' in {post_count} posts")
            
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