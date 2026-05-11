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
from app.services.message_cache_service import message_cache_service
import asyncio

# Maps user preferences → best subreddits to fetch from
PREFERENCE_SUBREDDIT_MAP: Dict[str, List[str]] = {
    "Job Opportunities":    ["cscareerquestions", "jobs", "remotework", "forhire", "recruitinghell"],
    "Technology":           ["technology", "programming", "MachineLearning", "artificial", "learnprogramming"],
    "Healthcare":           ["medicine", "nursing", "medicalschool", "HealthInsurance", "GlobalHealthcare"],
    "Physics":              ["Physics", "AskPhysics", "astrophysics", "quantum", "sciencefiction"],
    "Study Materials":      ["learnprogramming", "GetStudying", "studentlife", "AskAcademia", "textbookreddit"],
    "Finance":              ["personalfinance", "investing", "stocks", "CryptoCurrency", "financialindependence"],
    "Science":              ["science", "biology", "chemistry", "askscience", "EverythingScience"],
    "Sports":               ["sports", "nba", "soccer", "football", "mma"],
    "Entertainment":        ["movies", "television", "gaming", "Music", "anime"],
    "News":                 ["worldnews", "news", "geopolitics", "UpliftingNews", "TrueOffMyChest"],
}
DEFAULT_SUBREDDITS = ["all"]



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
        user_id: Optional[str] = None,
        force_refresh: bool = False
    ) -> Dict[str, Any]:

        if selected_platforms is None:
            selected_platforms = ['telegram', 'twitter', 'gmail', 'reddit', 'slack', 'discord']

        print(f"\n🔄 Starting message aggregation for platforms: {selected_platforms}")
        if force_refresh:
            print("⚡ Force refresh requested — bypassing cache for all platforms")
        if filter_by_preferences and user_preferences:
            print(f"🎯 Filtering by preferences: {user_preferences}")

        # ── Step 1: Check which platforms have fresh cache ─────────────────
        cache_status = {}
        if user_id and not force_refresh:
            cache_status = message_cache_service.get_cache_status(
                user_id, selected_platforms
            )
        else:
            # force_refresh=True → treat all platforms as stale
            cache_status = {p: False for p in selected_platforms}

        platforms_needing_fetch = [p for p in selected_platforms if not cache_status.get(p, False)]
        platforms_from_cache   = [p for p in selected_platforms if cache_status.get(p, False)]

        print(f"📦 From cache: {platforms_from_cache}")
        print(f"🌐 Need API call: {platforms_needing_fetch}")

        # ── Step 2: Load from cache ─────────────────────────────────────────
        all_messages: List[Dict[str, Any]] = []

        for platform in platforms_from_cache:
            cached = message_cache_service.get_cached_messages(user_id, platform)
            all_messages.extend(cached)
            print(f"✅ {platform}: {len(cached)} messages (from cache)")

        # ── Step 3: Fetch fresh data for stale/missing platforms ───────────
        if platforms_needing_fetch:
            tasks = []
            task_platform_names = []

            for platform in platforms_needing_fetch:
                if platform == 'telegram':
                    tasks.append(asyncio.to_thread(fetch_telegram_messages, limit))
                    task_platform_names.append('telegram')

                elif platform == 'twitter':
                    tasks.append(asyncio.to_thread(fetch_twitter_messages, twitter_keyword, limit))
                    task_platform_names.append('twitter')

                elif platform == 'gmail':
                    credentials = (
                        FirebaseService.get_user_credentials(user_id, 'gmail')
                        if user_id else None
                    )
                    tasks.append(asyncio.to_thread(fetch_gmail_messages, limit, credentials))
                    task_platform_names.append('gmail')

                elif platform == 'reddit':
                    # ── Use preference-based subreddits if preferences exist ──────
                    if user_preferences:
                        # Collect subreddits from all matching preferences (up to 2 total)
                        chosen_subreddits: List[str] = []
                        for pref in user_preferences:
                            subs = PREFERENCE_SUBREDDIT_MAP.get(pref, [])
                            for s in subs[:1]:  # 1 subreddit per preference max
                                if s not in chosen_subreddits:
                                    chosen_subreddits.append(s)
                                if len(chosen_subreddits) >= 2:
                                    break
                            if len(chosen_subreddits) >= 2:
                                break
                        if not chosen_subreddits:
                            chosen_subreddits = DEFAULT_SUBREDDITS
                        print(f"🎯 Reddit: fetching from preference subreddits: {chosen_subreddits}")
                        for sub in chosen_subreddits:
                            tasks.append(asyncio.to_thread(
                                fetch_reddit_messages, reddit_keyword, sub, limit // len(chosen_subreddits)
                            ))
                            task_platform_names.append('reddit')
                    else:
                        # Fallback: use the passed reddit_subreddit param
                        tasks.append(asyncio.to_thread(
                            fetch_reddit_messages, reddit_keyword, reddit_subreddit, limit
                        ))
                        task_platform_names.append('reddit')

                elif platform == 'slack':
                    tasks.append(asyncio.to_thread(fetch_slack_messages, limit))
                    task_platform_names.append('slack')

                elif platform == 'discord':
                    tasks.append(fetch_discord_messages(limit))
                    task_platform_names.append('discord')

            results = await asyncio.gather(*tasks, return_exceptions=True)

            for i, result in enumerate(results):
                platform = task_platform_names[i]
                if isinstance(result, Exception):
                    print(f"❌ Error fetching {platform}: {result}")
                    # ── Fall back to stale cache if API fails ──────────────
                    if user_id:
                        stale = message_cache_service.get_cached_messages(user_id, platform)
                        if stale:
                            print(f"⚠️  Using stale cache for {platform} ({len(stale)} msgs)")
                            all_messages.extend(stale)
                elif isinstance(result, list):
                    print(f"✅ {platform}: {len(result)} messages (fresh API)")
                    all_messages.extend(result)
                    # ── Save fresh messages to cache ───────────────────────
                    if user_id and result:
                        message_cache_service.save_messages_to_cache(
                            user_id, platform, result
                        )

        print(f"📊 Total messages: {len(all_messages)}")
                # ── Step 3.5: Attach user interactions (clicks/saves) ─────────────
        if user_id and all_messages:
            ids = [m.get("id") for m in all_messages if m.get("id")]
            interaction_map = FirebaseService.get_message_interactions(user_id, ids)

            for m in all_messages:
                mid = m.get("id")
                m["user_interactions"] = interaction_map.get(mid, {"clicks": 0, "saves": 0})

        # ── Step 4: Optional preference filter ─────────────────────────────
        if filter_by_preferences and user_preferences:
            print(f"🔍 Applying preference filter...")
            mf = MessageFilter()
            filtered = mf.filter_important_messages(
                all_messages, user_preferences, threshold=0.15, top_k=None
            )
            all_messages = filtered['important'] + filtered['regular']
            print(f"✅ After filtering: {len(all_messages)} messages")

        # ── Step 5: Curate ──────────────────────────────────────────────────
        print("🎨 Starting message curation...")
        curated_result = self.curator.curate_messages(all_messages, user_preferences or [])

        important_messages = curated_result['important']
        regular_messages   = curated_result['regular']

        # ── Step 6: Build cache info for frontend ───────────────────────────
        cache_info = {}
        if user_id:
            cache_info = message_cache_service.get_cache_info(user_id, selected_platforms)

        print(f"✅ Done — Important: {len(important_messages)}, Regular: {len(regular_messages)}")

        return {
            'important': important_messages,
            'regular': regular_messages,
            'total_count': len(all_messages),
            'important_count': len(important_messages),
            'preferences_used': user_preferences or [],
            'curation_method': 'hybrid',
            'curation_stats': curated_result.get('curation_stats', {}),
            # ← New: tells frontend which came from cache vs API
            'cache_info': cache_info,
            'platforms_from_cache': platforms_from_cache,
            'platforms_fetched_fresh': platforms_needing_fetch
        }