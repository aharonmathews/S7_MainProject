from typing import List, Dict, Any
from .telegram import fetch_telegram_messages
from .twitter import fetch_twitter_messages

class MessageAggregator:
    def aggregate_messages(
        self, 
        selected_platforms: List[str], 
        twitter_keyword: str = "python",
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        aggregated_messages = []
        
        for platform in selected_platforms:
            try:
                if platform == "telegram":
                    messages = fetch_telegram_messages(limit)
                    aggregated_messages.extend(messages)
                elif platform == "twitter":
                    messages = fetch_twitter_messages(twitter_keyword, limit)
                    aggregated_messages.extend(messages)
            except Exception as e:
                print(f"Error fetching {platform}: {e}")
        
        # Sort by timestamp (newest first)
        aggregated_messages.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        return aggregated_messages