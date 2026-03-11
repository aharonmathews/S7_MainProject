import os, requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")
model = "nvidia/nemotron-3-super-120b-a12b:free"

prompt = """You are a helpful assistant.
Context:
1. Message from User A: Hello
2. Message from User B: Hi

Question: What did User A say?"""

print(f"Testing model: {model} with a basic prompt")
resp = requests.post(
    "https://openrouter.ai/api/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Message Aggregator",
    },
    json={
        "model": model,
        "messages": [{"role": "user", "content": prompt}]
    }
)

print(f"Status: {resp.status_code}")
if resp.status_code == 200:
    print("✅ SUCCESS")
else:
    print("❌ ERROR:", resp.text)
