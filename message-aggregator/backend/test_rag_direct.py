import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from app.services.rag_service import rag_service
from app.services.firebase_service import FirebaseService

async def test():
    # just use the user ID from the logs: RlND2raeCMgt6eT4bGqq0aGOVkC2
    uid = "RlND2raeCMgt6eT4bGqq0aGOVkC2"
    print("Querying RAG service...")
    try:
        res = rag_service.answer_query(uid, "Any job interview emails?")
        print("✅ Success:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
