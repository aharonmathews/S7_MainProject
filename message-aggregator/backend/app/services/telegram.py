from typing import List, Dict, Any
from telethon import TelegramClient
import asyncio
import os
from datetime import datetime

API_ID = os.getenv('TELEGRAM_API_ID', '25097822')
API_HASH = os.getenv('TELEGRAM_API_HASH', 'c161c6fc85f28e26c8a364934f3569f5')
PHONE = os.getenv('TELEGRAM_PHONE', '+918281226145')

class TelegramService:
    def __init__(self):
        self.client = TelegramClient('session_name', API_ID, API_HASH)
        
    async def fetch_messages_async(self, limit: int = 20) -> List[Dict[str, Any]]:
        messages = []
        await self.client.start(phone=PHONE)
        
        async for dialog in self.client.iter_dialogs():
            async for message in self.client.iter_messages(dialog, limit=limit):
                if message.text:
                    sender = await message.get_sender()
                    sender_name = sender.first_name if hasattr(sender, 'first_name') else dialog.name
                    messages.append({
                        "id": f"telegram_{message.id}",
                        "platform": "telegram",
                        "title": f"Message from {sender_name}",
                        "content": message.text[:200],
                        "sender": sender_name,
                        "chat": dialog.name,
                        "timestamp": message.date.isoformat(),
                        "url": ""
                    })
        
        await self.client.disconnect()
        return messages

def fetch_telegram_messages(limit: int = 20) -> List[Dict[str, Any]]:
    service = TelegramService()
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(service.fetch_messages_async(limit))
    finally:
        loop.close()