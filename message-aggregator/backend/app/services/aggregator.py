from typing import List, Dict, Any, Optional
from app.services.telegram import fetch_telegram_messages
from app.services.twitter import fetch_twitter_messages
from app.services.gmail import fetch_gmail_messages
from app.services.reddit import fetch_reddit_messages
from app.services.slack import fetch_slack_messages
from app.services.discord_service import fetch_discord_messages
from app.services.message_filter import MessageFilter
from app.services.firebase_service import FirebaseService
from app.services.curation.hybrid_curator import HybridContentCurator
import asyncio

class MessageAggregator:
    def __init__(self):
        self.curator = HybridContentCurator()
    
    async def aggregate_messages_async(
        self,
        selected_platforms: List[str] = None,
        user_preferences: List[str] = None,
        twitter_keyword: str = "python",
        reddit_keyword: str = "technology",
        reddit_subreddit: str = "all",
        limit: int = 20,
        filter_by_preferences: bool = False,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        if selected_platforms is None:
            selected_platforms = ['telegram', 'twitter', 'gmail', 'reddit', 'slack', 'discord']
        
        print(f"\n🔄 Starting message aggregation for platforms: {selected_platforms}")
        if filter_by_preferences and user_preferences:
            print(f"🎯 Filtering by preferences: {user_preferences}")
        
        tasks = []
        platform_names = []
        
        # Telegram (sync -> thread)
        if 'telegram' in selected_platforms:
            tasks.append(asyncio.to_thread(fetch_telegram_messages, limit))
            platform_names.append('telegram')
        
        # Twitter (sync -> thread)
        if 'twitter' in selected_platforms:
            tasks.append(asyncio.to_thread(fetch_twitter_messages, twitter_keyword, limit))
            platform_names.append('twitter')
        
        # Gmail (sync -> thread)
        if 'gmail' in selected_platforms:
            credentials = FirebaseService.get_user_credentials(user_id, 'gmail') if user_id else None
            tasks.append(asyncio.to_thread(fetch_gmail_messages, limit, credentials))
            platform_names.append('gmail')
        
        # Reddit (sync -> thread)
        if 'reddit' in selected_platforms:
            tasks.append(asyncio.to_thread(fetch_reddit_messages, reddit_keyword, reddit_subreddit, limit))
            platform_names.append('reddit')
        
        # Slack (sync -> thread)
        if 'slack' in selected_platforms:
            tasks.append(asyncio.to_thread(fetch_slack_messages, limit))
            platform_names.append('slack')
        
        # Discord (already async)
        if 'discord' in selected_platforms:
            tasks.append(fetch_discord_messages(limit))
            platform_names.append('discord')
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_messages = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"❌ Error fetching {platform_names[i]} messages: {result}")
            elif isinstance(result, list):
                all_messages.extend(result)
                print(f"✅ {platform_names[i]}: {len(result)} messages")
        
        print(f"📊 Total messages fetched: {len(all_messages)}")
        
        if filter_by_preferences and user_preferences:
            print(f"🔍 Applying preference filter with {len(user_preferences)} preferences")
            mf = MessageFilter()
            filtered = mf.filter_important_messages(
                all_messages,
                user_preferences,
                threshold=0.15,
                top_k=None
            )
            all_messages = filtered['important'] + filtered['regular']
            print(f"✅ After filtering: {len(all_messages)} messages")
        
        print("🎨 Starting message curation...")
        curated_result = self.curator.curate_messages(all_messages, user_preferences or [])
        
        important_messages = curated_result['important']
        regular_messages = curated_result['regular']
        
        print(f"✅ Curation complete:")
        print(f"   - Important: {len(important_messages)} messages")
        print(f"   - Regular: {len(regular_messages)} messages")
        
        return {
            'important': important_messages,
            'regular': regular_messages,
            'total_count': len(all_messages),
            'important_count': len(important_messages),
            'preferences_used': user_preferences or [],
            'curation_method': 'hybrid',
            'curation_stats': curated_result.get('curation_stats', {})
        }