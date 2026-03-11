import os, requests
from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")

# Fetch all models
models_resp = requests.get("https://openrouter.ai/api/v1/models")
all_models = models_resp.json()["data"]
free_models = [m["id"] for m in all_models if ":free" in m["id"]]
print(f"Found {len(free_models)} free models")

test_msg = [{"role": "user", "content": "Hi"}]

for model_id in free_models:
    resp = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Message Aggregator",
        },
        json={"model": model_id, "messages": test_msg}
    )
    status = resp.status_code
    if status == 200:
        print(f"✅ WORKS: {model_id}")
        break
    else:
        try:
            err = resp.json().get("error", {}).get("message", "")[:60]
        except:
            err = resp.text[:60]
        print(f"  {status} {model_id}: {err}")
