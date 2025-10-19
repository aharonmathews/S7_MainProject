# File: /message-aggregator/message-aggregator/backend/app/services/discord.py

from typing import List
import discord
from discord.ext import commands

class DiscordService:
    def __init__(self, token: str):
        self.token = token
        self.client = commands.Bot(command_prefix='!')

    async def fetch_messages(self, channel_id: int, limit: int = 100) -> List[discord.Message]:
        channel = self.client.get_channel(channel_id)
        if channel:
            messages = await channel.history(limit=limit).flatten()
            return messages
        return []

    def run(self):
        self.client.run(self.token)

# Example usage:
# discord_service = DiscordService('YOUR_DISCORD_BOT_TOKEN')
# discord_service.run()