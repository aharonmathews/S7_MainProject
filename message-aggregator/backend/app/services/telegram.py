from typing import List, Dict, Any
from telethon import TelegramClient
import asyncio
import os
from datetime import datetime
from dotenv import load_dotenv

# Force load environment variables
load_dotenv(override=True)

# Load credentials
API_ID = os.getenv('TELEGRAM_API_ID')
API_HASH = os.getenv('TELEGRAM_API_HASH')
PHONE = os.getenv('TELEGRAM_PHONE')

# Debug print (remove in production)
print(f"🔍 Telegram Config Check:")
print(f"   API_ID: {API_ID}")
print(f"   API_HASH: {API_HASH[:10] if API_HASH else None}...")
print(f"   PHONE: {PHONE}")

class TelegramService:
    def __init__(self):
        # Validate credentials
        if not API_ID or not API_HASH:
            raise Exception("Telegram API_ID or API_HASH not set in .env file")
            
        # Use absolute path for session file
        session_path = os.path.join(os.path.dirname(__file__), '..', '..', 'session_name')
        self.client = TelegramClient(session_path, int(API_ID), API_HASH)
        
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
                            "content": message.text,  # ✅ Full message content
                            "sender": sender_name,
                            "chat": dialog.name,
                            "timestamp": message.date.isoformat(),
                            "url": ""
                        })
                
                print(f"Found {message_count} messages in {dialog.name}")
                
                # Limit to first few dialogs to avoid timeout
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
    
    try:
        service = TelegramService()
        messages = await service.fetch_messages_async(limit)
        print(f"Returning {len(messages)} messages")
        return messages
    except Exception as e:
        print(f"❌ Error in fetch_telegram_messages_async: {e}")
        import traceback
        traceback.print_exc()
        return []

def fetch_telegram_messages(limit: int = 20) -> List[Dict[str, Any]]:
    """Synchronous wrapper - tries to use existing event loop"""
    try:
        # Try to get the running event loop
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If loop is running, schedule the coroutine
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, fetch_telegram_messages_async(limit))
                return future.result()
        else:
            # If no loop is running, use asyncio.run
            return asyncio.run(fetch_telegram_messages_async(limit))
    except Exception as e:
        print(f"❌ Error in fetch_telegram_messages: {e}")
        import traceback
        traceback.print_exc()
        return []