import os
import requests
from dotenv import load_dotenv

load_dotenv()

print("Fetching available models from OpenRouter...")
models_resp = requests.get("https://openrouter.ai/api/v1/models")
models = models_resp.json()["data"]

free_models = [
    m["id"] for m in models 
    if ":free" in m["id"]
]

print("Available free models:")
for m in free_models[:20]:
    print(m)
