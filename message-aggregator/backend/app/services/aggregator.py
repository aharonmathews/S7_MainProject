from typing import List, Dict, Any
import asyncio
from .telegram import fetch_telegram_messages_async
from .twitter import fetch_twitter_messages
from .gmail import fetch_gmail_messages
from .reddit import fetch_reddit_messages
from .slack import fetch_slack_messages
from .curation.hybrid_curator import hybrid_curator

class MessageAggregator:
    async def aggregate_messages_async(
        self, 
        selected_platforms: List[str], 
        user_preferences: List[str] = None,
        twitter_keyword: str = "python",
        reddit_keyword: str = "technology",
        reddit_subreddit: str = "all",
        limit: int = 20,
        filter_by_preferences: bool = True
    ) -> Dict[str, Any]:
        aggregated_messages = []
        
        for platform in selected_platforms:
            try:
                if platform == "telegram":
                    messages = await fetch_telegram_messages_async(limit)
                    aggregated_messages.extend(messages)
                    
                elif platform == "twitter":
                    messages = fetch_twitter_messages(twitter_keyword, limit)
                    aggregated_messages.extend(messages)
                    
                elif platform == "gmail":
                    messages = fetch_gmail_messages(limit)
                    aggregated_messages.extend(messages)
                    
                elif platform == "reddit":
                    messages = fetch_reddit_messages(reddit_keyword, reddit_subreddit, limit)
                    aggregated_messages.extend(messages)
                    
                elif platform == "slack":
                    messages = fetch_slack_messages(limit)
                    aggregated_messages.extend(messages)
                    
            except Exception as e:
                print(f"❌ Error fetching {platform}: {e}")
        
        # Sort by timestamp (newest first)
        aggregated_messages.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        # Use Hybrid Curation if preferences are set
        if filter_by_preferences and user_preferences:
            result = hybrid_curator.curate_messages(
                aggregated_messages,
                user_preferences,
                threshold=0.25,  # Lower threshold for semantic matching
                top_k=30
            )
            
            return {
                'important': result['important'],
                'regular': result['regular'],
                'total_count': len(aggregated_messages),
                'important_count': len(result['important']),
                'preferences_used': user_preferences,
                'curation_method': 'hybrid',
                'curation_stats': result['curation_stats']
            }
        else:
            return {
                'important': [],
                'regular': aggregated_messages,
                'total_count': len(aggregated_messages),
                'important_count': 0,
                'preferences_used': [],
                'curation_method': 'none'
            }
    
    def aggregate_messages(
        self, 
        selected_platforms: List[str], 
        user_preferences: List[str] = None,
        twitter_keyword: str = "python",
        reddit_keyword: str = "technology",
        reddit_subreddit: str = "all",
        limit: int = 20
    ) -> Dict[str, Any]:
        """Synchronous wrapper"""
        return asyncio.run(
            self.aggregate_messages_async(
                selected_platforms, 
                user_preferences,
                twitter_keyword,
                reddit_keyword,
                reddit_subreddit,
                limit
            )
        )