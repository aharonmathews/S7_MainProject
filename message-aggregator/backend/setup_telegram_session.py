"""
One-time Telegram session setup script.
Run this from the backend directory while the venv is active:

    python setup_telegram_session.py

It will ask you to enter the OTP code sent to your Telegram phone number.
After successful authentication, a `session_name.session` file will be created.
Once this file exists, the backend server can fetch Telegram messages without any prompts.
"""

import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from telethon import TelegramClient

load_dotenv()

API_ID = os.getenv('TELEGRAM_API_ID')
API_HASH = os.getenv('TELEGRAM_API_HASH')
PHONE = os.getenv('TELEGRAM_PHONE')

SESSION_PATH = os.path.join(os.path.dirname(__file__), 'session_name')
SESSION_FILE = SESSION_PATH + '.session'

async def setup():
    if not API_ID or not API_HASH or not PHONE:
        print("❌ Missing TELEGRAM_API_ID, TELEGRAM_API_HASH, or TELEGRAM_PHONE in .env")
        return

    if Path(SESSION_FILE).exists():
        print(f"✅ Session file already exists at: {SESSION_FILE}")
        print("   Telegram is already authenticated. No action needed.")
        return

    print(f"🔐 Setting up Telegram session for phone: {PHONE}")
    print("   Telegram will send an OTP code to your phone/app...")

    client = TelegramClient(SESSION_PATH, int(API_ID), API_HASH)
    await client.start(phone=PHONE)

    print(f"\n✅ Telegram session created successfully!")
    print(f"   Session file: {SESSION_FILE}")
    print("\n   You can now start the backend server normally.")
    print("   The server will use this session to fetch Telegram messages without any prompts.")

    await client.disconnect()

if __name__ == '__main__':
    asyncio.run(setup())
