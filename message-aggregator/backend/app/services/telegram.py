from typing import List, Dict, Any
from telethon import TelegramClient
import asyncio
import os
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Force load environment variables
load_dotenv(override=True)

# Load credentials
API_ID = os.getenv('TELEGRAM_API_ID')
API_HASH = os.getenv('TELEGRAM_API_HASH')
PHONE = os.getenv('TELEGRAM_PHONE')

print(f"🔍 Telegram Config Check:")
print(f"   API_ID: {API_ID}")
print(f"   API_HASH: {API_HASH[:10] if API_HASH else None}...")
print(f"   PHONE: {PHONE}")

# Path to the session file
SESSION_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'session_name')
SESSION_FILE = SESSION_PATH + '.session'

TELEGRAM_TIMEOUT_SECONDS = 25


class TelegramService:
    def __init__(self):
        if not API_ID or not API_HASH:
            raise Exception("Telegram API_ID or API_HASH not set in .env file")
        self.client = TelegramClient(SESSION_PATH, int(API_ID), API_HASH)
        
    async def fetch_messages_async(self, limit: int = 20) -> List[Dict[str, Any]]:
        messages = []
        try:
            print(f"Starting Telegram client...")
            await self.client.start(phone=PHONE)
            print(f"Telegram client started successfully")
            
            dialog_count = 0
            async for dialog in self.client.iter_dialogs():
                dialog_count += 1
                print(f"Processing dialog: {dialog.name}")
                
                message_count = 0
                async for message in self.client.iter_messages(dialog, limit=limit):
                    if message.text:
                        message_count += 1
                        sender = await message.get_sender()
                        sender_name = sender.first_name if hasattr(sender, 'first_name') else dialog.name
                        messages.append({
                            "id": f"telegram_{message.id}_{dialog.id}",
                            "platform": "telegram",
                            "title": f"Message from {sender_name}",
                            "content": message.text,
                            "sender": sender_name,
                            "chat": dialog.name,
                            "timestamp": message.date.isoformat(),
                            "url": ""
                        })
                
                print(f"Found {message_count} messages in {dialog.name}")
                
                if dialog_count >= 5:
                    break
            
            print(f"✅ Total Telegram messages fetched: {len(messages)}")
            
        except Exception as e:
            print(f"❌ Error in fetch_messages_async: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await self.client.disconnect()
            
        return messages


async def fetch_telegram_messages_async(limit: int = 20) -> List[Dict[str, Any]]:
    print(f"fetch_telegram_messages_async called with limit={limit}")

    # ── Guard: if session file doesn't exist, Telethon will hang waiting for OTP
    if not Path(SESSION_FILE).exists():
        print("⚠️  Telegram session file not found. Run `python setup_telegram_session.py` once to authenticate.")
        print(f"   Expected session file at: {SESSION_FILE}")
        return []

    try:
        service = TelegramService()
        # ── Timeout: never hang more than TELEGRAM_TIMEOUT_SECONDS
        messages = await asyncio.wait_for(
            service.fetch_messages_async(limit),
            timeout=TELEGRAM_TIMEOUT_SECONDS
        )
        print(f"Returning {len(messages)} messages")
        return messages
    except asyncio.TimeoutError:
        print(f"⏰ Telegram fetch timed out after {TELEGRAM_TIMEOUT_SECONDS}s. Returning empty.")
        return []
    except Exception as e:
        print(f"❌ Error in fetch_telegram_messages_async: {e}")
        import traceback
        traceback.print_exc()
        return []


def fetch_telegram_messages(limit: int = 20) -> List[Dict[str, Any]]:
    """Synchronous wrapper for thread pool execution"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(fetch_telegram_messages_async(limit))
        finally:
            loop.close()
    except Exception as e:
        print(f"❌ Error in fetch_telegram_messages: {e}")
        import traceback
        traceback.print_exc()
        return []
