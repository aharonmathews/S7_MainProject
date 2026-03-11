import requests
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("OPENROUTER_API_KEY")

prompt = """You are a personal message assistant.
The user has messages from multiple platforms.
Answer the user's question based ONLY on the messages provided below.
If the answer is not in the messages, say so clearly.
Be specific - mention sender names, dates, and key details. Keep it concise.

USER'S MESSAGES:

---
Message 1:
- Platform: Telegram
- From: Amelia Harrison
- Channel/Chat: The Job Overflow
- Time: 2026-03-10
- Title: Message from Amelia Harrison
- Content: Support your main job...

USER'S QUESTION: Any job interview emails?

Answer:"""

try:
    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Message Aggregator",
        },
        json={
            "model": "google/gemini-2.0-flash-lite-preview-02-05:free",
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }
    )
    response.raise_for_status()
    print("Success")
except requests.exceptions.HTTPError as e:
    with open("openrouter_400.txt", "w") as f:
        f.write(e.response.text)
    print("Wrote error to openrouter_400.txt")
