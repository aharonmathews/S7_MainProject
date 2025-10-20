from typing import List, Dict, Any
import os
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from dotenv import load_dotenv
from datetime import datetime
import time

# Force reload environment variables
load_dotenv(override=True)

class SlackService:
    def __init__(self):
        slack_token = os.getenv("SLACK_BOT_TOKEN")
        
        # Debug: Print if token is found (first/last 4 chars only)
        if slack_token:
            print(f"✅ Slack token found: {slack_token[:10]}...{slack_token[-4:]}")
        else:
            print(f"❌ SLACK_BOT_TOKEN environment variable is: {repr(slack_token)}")
            print(f"📋 All env vars starting with SLACK: {[k for k in os.environ.keys() if k.startswith('SLACK')]}")
            raise Exception("SLACK_BOT_TOKEN not set in .env file")
            
        self.client = WebClient(token=slack_token)
    
    def fetch_channels(self, limit: int = 50):
        """Fetch accessible channels"""
        channels = []
        cursor = None
        try:
            while len(channels) < limit:
                response = self.client.conversations_list(
                    types="public_channel,private_channel,im,mpim",
                    limit=min(200, limit - len(channels)),
                    cursor=cursor,
                    exclude_archived=True
                )
                channels.extend(response.get("channels", []))
                cursor = response.get("response_metadata", {}).get("next_cursor")
                if not cursor:
                    break
                time.sleep(0.5)
            print(f"✅ Found {len(channels)} Slack channels")
        except SlackApiError as e:
            print(f"❌ Error fetching Slack channels: {e.response['error']}")
        return channels[:limit]
    
    def fetch_messages(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch recent messages from all accessible channels"""
        all_messages = []
        
        try:
            channels = self.fetch_channels(limit=20)
            
            for ch in channels:
                ch_name = ch.get("name", ch.get("id", "unknown"))
                ch_id = ch["id"]
                is_dm = ch.get("is_im", False)
                
                if is_dm:
                    ch_name = f"DM-{ch_name}"
                
                try:
                    response = self.client.conversations_history(
                        channel=ch_id,
                        limit=10
                    )
                    messages = response.get("messages", [])
                    
                    for msg in messages:
                        # Skip bot messages and system messages
                        if msg.get("subtype") in ["bot_message", "channel_join", "channel_leave"]:
                            continue
                        
                        message_data = {
                            'id': f'slack_{ch_id}_{msg.get("ts", "")}',
                            'platform': 'slack',
                            'title': f'Message from {ch_name}',
                            'content': msg.get("text", "")[:500],
                            'sender': self._get_user_name(msg.get("user", "unknown")),
                            'timestamp': datetime.fromtimestamp(float(msg.get("ts", 0))).isoformat(),
                            'chat': ch_name,
                            'channel_id': ch_id
                        }
                        all_messages.append(message_data)
                        
                        if len(all_messages) >= limit:
                            break
                    
                    time.sleep(0.5)
                    
                except SlackApiError as e:
                    error_msg = e.response.get('error', 'unknown_error')
                    if error_msg not in ["channel_not_found", "not_in_channel"]:
                        print(f"⚠ Error fetching from {ch_name}: {error_msg}")
                
                if len(all_messages) >= limit:
                    break
            
            print(f"✅ Fetched {len(all_messages)} Slack messages")
            
        except Exception as e:
            print(f"❌ Error fetching Slack messages: {e}")
        
        return all_messages[:limit]
    
    def _get_user_name(self, user_id: str) -> str:
        """Get username from user ID"""
        try:
            response = self.client.users_info(user=user_id)
            return response['user']['real_name'] or response['user']['name']
        except:
            return user_id

def fetch_slack_messages(limit: int = 20) -> List[Dict[str, Any]]:
    """Standalone function to fetch Slack messages"""
    try:
        service = SlackService()
        return service.fetch_messages(limit)
    except Exception as e:
        print(f"❌ Slack fetch error: {e}")
        return []