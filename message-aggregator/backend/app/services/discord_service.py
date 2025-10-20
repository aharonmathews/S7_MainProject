from typing import List, Dict, Any
import os
import discord
from discord.ext import commands
import asyncio
from dotenv import load_dotenv, find_dotenv
from datetime import datetime

# Load .env from project root and override
load_dotenv(find_dotenv(), override=True)
# Fallback: explicitly load backend/.env
if not os.getenv('DISCORD_BOT_TOKEN'):
    env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
    load_dotenv(env_path, override=True)

DISCORD_BOT_TOKEN = os.getenv('DISCORD_BOT_TOKEN')
DISCORD_CHANNEL_ID = os.getenv('DISCORD_CHANNEL_ID')

class DiscordService:
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.guilds = True
        self.client = discord.Client(intents=intents)
        self.is_ready = False
        
        @self.client.event
        async def on_ready():
            self.is_ready = True
            print(f'✅ Discord bot logged in as {self.client.user}')
    
    async def start_bot(self):
        """Start the Discord bot in the background"""
        if not DISCORD_BOT_TOKEN:
            print("⚠️  Discord bot token not configured")
            return
        
        try:
            await self.client.login(DISCORD_BOT_TOKEN)
            asyncio.create_task(self.client.connect())
            
            # Wait for bot to be ready (max 10 seconds)
            for _ in range(50):
                if self.is_ready:
                    break
                await asyncio.sleep(0.2)
            
            if not self.is_ready:
                print("⚠️  Discord bot didn't connect in time")
        except Exception as e:
            print(f"❌ Error starting Discord bot: {e}")
    
    async def fetch_messages(self, limit: int = 20, channel_id: str = None) -> List[Dict[str, Any]]:
        """Fetch recent messages from Discord channel"""
        if not self.is_ready:
            print("⚠️  Discord bot not ready, attempting to start...")
            await self.start_bot()
        
        if not self.is_ready:
            print("❌ Discord bot not connected")
            return []
        
        messages = []
        target_channel_id = channel_id or DISCORD_CHANNEL_ID
        
        try:
            channel = await self.client.fetch_channel(int(target_channel_id))
            
            if not channel:
                print(f"❌ Channel {target_channel_id} not found")
                return []
            
            discord_messages = []
            async for message in channel.history(limit=limit):
                discord_messages.append(message)
            
            for msg in discord_messages:
                # Extract text content
                content_parts = []
                
                # Plain text
                if msg.content:
                    content_parts.append(msg.content)
                
                # Embeds
                for embed in msg.embeds:
                    if embed.description:
                        content_parts.append(f"[Embed] {embed.description}")
                    if embed.title:
                        content_parts.append(f"[Title] {embed.title}")
                
                # Attachments
                attachment_urls = [att.url for att in msg.attachments]
                if attachment_urls:
                    content_parts.append(f"[Attachments: {', '.join(attachment_urls)}]")
                
                full_content = "\n".join(content_parts) if content_parts else "No content"
                
                messages.append({
                    'id': f"discord_{msg.id}",
                    'platform': 'discord',
                    'title': f"Message from {msg.author.name}",
                    'content': full_content,
                    'sender': msg.author.name,
                    'timestamp': msg.created_at.isoformat(),
                    'chat': channel.name,
                    'url': msg.jump_url,
                    'attachments': attachment_urls
                })
            
            print(f"✅ Fetched {len(messages)} Discord messages from #{channel.name}")
            
        except Exception as e:
            print(f"❌ Error fetching Discord messages: {e}")
            import traceback
            traceback.print_exc()
        
        return messages
    
    async def close(self):
        """Close Discord client"""
        if self.client:
            await self.client.close()

# Global instance
_discord_service = None

async def get_discord_service() -> DiscordService:
    """Get or create Discord service instance"""
    global _discord_service
    if _discord_service is None:
        _discord_service = DiscordService()
        await _discord_service.start_bot()
    return _discord_service

async def fetch_discord_messages(limit: int = 20, channel_id: str = None) -> List[Dict[str, Any]]:
    """Standalone function to fetch Discord messages"""
    try:
        if not DISCORD_BOT_TOKEN:
            print("⚠️  Discord bot token not configured")
            return []
        
        service = await get_discord_service()
        return await service.fetch_messages(limit, channel_id)
    except Exception as e:
        print(f"❌ Discord fetch error: {e}")
        import traceback
        traceback.print_exc()
        return []