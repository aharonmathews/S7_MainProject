import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

prompt = "Hello world"
print("Testing Gemini generation...")
try:
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents=prompt
    )
    print("Success:")
    print(response.text)
except Exception as e:
    import traceback
    print(f"Exception: {type(e).__name__} - {repr(e)}")
    traceback.print_exc()
