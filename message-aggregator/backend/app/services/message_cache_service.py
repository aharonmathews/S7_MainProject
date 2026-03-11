from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.services.firebase_service import db
import uuid

CACHE_EXPIRY_MINUTES = 20
MAX_MESSAGES_PER_PLATFORM = 20

# Platform-specific field schemas for display
PLATFORM_SCHEMAS = {
    'telegram': {
        'display_fields': ['sender', 'chat', 'content', 'timestamp'],
        'label': '📱 Telegram',
        'description': 'Chat message'
    },
    'gmail': {
        'display_fields': ['sender', 'title', 'content', 'timestamp'],
        'label': '📧 Gmail',
        'description': 'Email - Subject / From / Body'
    },
    'discord': {
        'display_fields': ['sender', 'chat', 'content', 'timestamp'],
        'label': '🎮 Discord',
        'description': 'Server channel message'
    },
    'reddit': {
        'display_fields': ['sender', 'title', 'content', 'chat', 'timestamp'],
        'label': '🔶 Reddit',
        'description': 'Post or comment from subreddit'
    },
    'slack': {
        'display_fields': ['sender', 'chat', 'content', 'timestamp'],
        'label': '💬 Slack',
        'description': 'Workspace channel message'
    },
    'twitter': {
        'display_fields': ['sender', 'content', 'timestamp'],
        'label': '🐦 Twitter',
        'description': 'Tweet'
    }
}


class MessageCacheService:

    @staticmethod
    def _get_cache_ref(uid: str, platform: str):
        """Get Firestore reference for platform message cache"""
        if not db:
            return None
        return (
            db.collection('users')
            .document(uid)
            .collection('message_cache')
            .document(platform)
        )

    @staticmethod
    def get_cache_status(uid: str, platforms: List[str]) -> Dict[str, bool]:
        """
        Check which platforms have fresh cache (within CACHE_EXPIRY_MINUTES).
        Returns: { 'telegram': True (fresh), 'slack': False (stale/missing), ... }
        """
        if not db:
            return {p: False for p in platforms}

        status = {}
        now = datetime.now(timezone.utc)

        for platform in platforms:
            try:
                ref = MessageCacheService._get_cache_ref(uid, platform)
                doc = ref.get()

                if not doc.exists:
                    print(f"📭 No cache for {platform} (uid: {uid})")
                    status[platform] = False
                    continue

                data = doc.to_dict()
                cached_at_str = data.get('cached_at')

                if not cached_at_str:
                    status[platform] = False
                    continue

                # Parse timestamp
                cached_at = datetime.fromisoformat(cached_at_str)
                if cached_at.tzinfo is None:
                    cached_at = cached_at.replace(tzinfo=timezone.utc)

                diff_minutes = (now - cached_at).total_seconds() / 60

                is_fresh = diff_minutes < CACHE_EXPIRY_MINUTES
                print(
                    f"{'✅ Fresh' if is_fresh else '⏰ Stale'} cache for {platform} "
                    f"({diff_minutes:.1f} min old, limit: {CACHE_EXPIRY_MINUTES} min)"
                )
                status[platform] = is_fresh

            except Exception as e:
                print(f"❌ Error checking cache for {platform}: {e}")
                status[platform] = False

        return status

    @staticmethod
    def get_cached_messages(uid: str, platform: str) -> List[Dict[str, Any]]:
        """Retrieve cached messages for a platform"""
        if not db:
            return []

        try:
            ref = MessageCacheService._get_cache_ref(uid, platform)
            doc = ref.get()

            if not doc.exists:
                return []

            data = doc.to_dict()
            messages = data.get('messages', [])

            # Add platform schema info to each message
            schema = PLATFORM_SCHEMAS.get(platform, {})
            for msg in messages:
                msg['_platform_label'] = schema.get('label', platform)
                msg['_platform_description'] = schema.get('description', '')

            print(f"📦 Loaded {len(messages)} cached messages for {platform}")
            return messages

        except Exception as e:
            print(f"❌ Error getting cached messages for {platform}: {e}")
            return []

    @staticmethod
    def save_messages_to_cache(
        uid: str,
        platform: str,
        messages: List[Dict[str, Any]]
    ):
        """
        Save fetched messages to Firestore cache.
        Stores max MAX_MESSAGES_PER_PLATFORM messages per platform.
        Adds platform-specific metadata.
        """
        if not db:
            return

        try:
            # Limit and tag messages with platform schema
            schema = PLATFORM_SCHEMAS.get(platform, {})
            limited_messages = messages[:MAX_MESSAGES_PER_PLATFORM]

            # Add platform metadata to each message
            tagged_messages = []
            for msg in limited_messages:
                tagged = msg.copy()
                tagged['_platform_label'] = schema.get('label', platform)
                tagged['_platform_description'] = schema.get('description', '')
                tagged['_cached_at'] = datetime.now(timezone.utc).isoformat()
                tagged_messages.append(tagged)

            ref = MessageCacheService._get_cache_ref(uid, platform)
            ref.set({
                'platform': platform,
                'platform_label': schema.get('label', platform),
                'platform_description': schema.get('description', ''),
                'messages': tagged_messages,
                'message_count': len(tagged_messages),
                'cached_at': datetime.now(timezone.utc).isoformat(),
                'cache_expiry_minutes': CACHE_EXPIRY_MINUTES
            })

            print(
                f"💾 Cached {len(tagged_messages)} messages for "
                f"{platform} (uid: {uid})"
            )

        except Exception as e:
            print(f"❌ Error saving cache for {platform}: {e}")

    @staticmethod
    def invalidate_cache(uid: str, platform: str):
        """Force invalidate cache for a platform"""
        if not db:
            return
        try:
            ref = MessageCacheService._get_cache_ref(uid, platform)
            ref.delete()
            print(f"🗑️ Cache invalidated for {platform} (uid: {uid})")
        except Exception as e:
            print(f"❌ Error invalidating cache for {platform}: {e}")

    @staticmethod
    def get_cache_info(uid: str, platforms: List[str]) -> Dict[str, Any]:
        """Get cache status info for frontend display"""
        if not db:
            return {}

        info = {}
        now = datetime.now(timezone.utc)

        for platform in platforms:
            try:
                ref = MessageCacheService._get_cache_ref(uid, platform)
                doc = ref.get()

                if not doc.exists:
                    info[platform] = {
                        'has_cache': False,
                        'is_fresh': False,
                        'message_count': 0,
                        'cached_at': None,
                        'minutes_old': None
                    }
                    continue

                data = doc.to_dict()
                cached_at_str = data.get('cached_at')

                if cached_at_str:
                    cached_at = datetime.fromisoformat(cached_at_str)
                    if cached_at.tzinfo is None:
                        cached_at = cached_at.replace(tzinfo=timezone.utc)
                    minutes_old = (now - cached_at).total_seconds() / 60
                    is_fresh = minutes_old < CACHE_EXPIRY_MINUTES
                else:
                    minutes_old = None
                    is_fresh = False

                info[platform] = {
                    'has_cache': True,
                    'is_fresh': is_fresh,
                    'message_count': data.get('message_count', 0),
                    'cached_at': cached_at_str,
                    'minutes_old': round(minutes_old, 1) if minutes_old else None,
                    'expires_in': round(CACHE_EXPIRY_MINUTES - minutes_old, 1) if (minutes_old and is_fresh) else 0
                }

            except Exception as e:
                print(f"❌ Error getting cache info for {platform}: {e}")
                info[platform] = {'has_cache': False, 'is_fresh': False}

        return info


message_cache_service = MessageCacheService()