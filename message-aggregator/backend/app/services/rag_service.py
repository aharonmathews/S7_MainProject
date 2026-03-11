import numpy as np
import os
import time
import requests
from sentence_transformers import SentenceTransformer, util
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

model = SentenceTransformer('all-MiniLM-L6-v2')

class RAGService:
    def __init__(self):
        self._stores: Dict[str, Dict] = {}

    def index_messages(self, uid: str, messages: List[Dict[str, Any]]):
        if not messages:
            return

        # ← Skip re-indexing if already indexed for this user
        if uid in self._stores:
            print(f"⚡ RAG already indexed for {uid}, skipping...")
            return

        # ← Only use top 10 messages to avoid quota issues
        messages = messages[:10]
        print(f"🤖 Indexing {len(messages)} messages for RAG (uid: {uid})")

        texts = []
        for msg in messages:
            text = f"""
            Platform: {msg.get('platform', '')}
            From: {msg.get('sender', '')}
            Chat/Channel: {msg.get('chat', '')}
            Title: {msg.get('title', '')}
            Content: {msg.get('content', '')}
            Time: {msg.get('timestamp', '')}
            """.strip()
            texts.append(text)

        embeddings = model.encode(texts, convert_to_tensor=False)
        self._stores[uid] = {
            'embeddings': np.array(embeddings),
            'messages': messages,
            'texts': texts
        }
        print(f"✅ RAG indexed {len(messages)} messages for {uid}")

    def search_messages(self, uid: str, query: str, top_k: int = 5) -> List[Dict]:
        store = self._stores.get(uid)
        if not store or len(store['messages']) == 0:
            return []

        query_embedding = model.encode([query], convert_to_tensor=False)
        scores = util.cos_sim(query_embedding, store['embeddings'])[0]
        scores = scores.numpy()

        top_indices = np.argsort(scores)[::-1][:top_k]

        results = []
        for idx in top_indices:
            if scores[idx] > 0.2:
                msg = store['messages'][idx].copy()
                msg['relevance_score'] = float(scores[idx])
                results.append(msg)

        return results

    def _generate_fallback_answer(self, query: str, relevant_messages: List[Dict]) -> str:
        if not relevant_messages:
            return "No relevant messages found for your query."

        lines = [f"Found {len(relevant_messages)} relevant message(s):\n"]
        for i, msg in enumerate(relevant_messages, 1):
            lines.append(
                f"{i}. From **{msg.get('sender', 'Unknown')}** "
                f"on **{msg.get('platform', '').capitalize()}** "
                f"({msg.get('timestamp', 'unknown time')})\n"
                f"   📌 {msg.get('title', '')}\n"
                f"   💬 {str(msg.get('content', ''))[:200]}...\n"
            )
        return "\n".join(lines)

    def answer_query(self, uid: str, query: str) -> Dict[str, Any]:
        # ← Request fewer messages to avoid oversized prompt and rate limits
        relevant_messages = self.search_messages(uid, query, top_k=3)

        if not relevant_messages:
            return {
                "answer": "No relevant messages found for your query. Try different keywords.",
                "sources": [],
                "query": query,
                "used_llm": False
            }

        context_parts = []
        for i, msg in enumerate(relevant_messages, 1):
            context_parts.append(f"""
Message {i}:
- Platform: {msg.get('platform', 'Unknown')}
- From: {msg.get('sender', 'Unknown')}
- Channel/Chat: {msg.get('chat', '')}
- Time: {msg.get('timestamp', 'Unknown')}
- Title: {msg.get('title', '')}
- Content: {msg.get('content', '')}
""")

        context = "\n---\n".join(context_parts)
        prompt = f"""You are a personal message assistant.
The user has messages from multiple platforms.
Answer the user's question based ONLY on the messages provided below.
If the answer is not in the messages, say so clearly.
Be specific - mention sender names, dates, and key details. Keep it concise.

USER'S MESSAGES:
{context}

USER'S QUESTION: {query}

Answer:"""

        answer = None
        used_llm = False

        # Top-tier free models that support system/user instruction formats
        models = [
            "nvidia/nemotron-3-super-120b-a12b:free",
            "google/gemma-3-27b-it:free",
            "mistralai/mistral-7b-instruct:free",
            "qwen/qwen-2-7b-instruct:free",
            "cognitivecomputations/dolphin-mixtral-8x7b:free"
        ]

        openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        if not openrouter_api_key:
            return {
                "answer": "Missing OPENROUTER_API_KEY in .env configuration.",
                "sources": [],
                "query": query,
                "used_llm": False
            }

        last_error = ""

        for model in models:
            try:
                print(f"🤖 RAG: Trying model {model}...")
                response = requests.post(
                    url="https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openrouter_api_key}",
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "Message Aggregator",
                    },
                    json={
                        "model": model,
                        "messages": [
                            {"role": "user", "content": prompt}
                        ]
                    }
                )
                
                if response.status_code != 200:
                    error_msg = f"{response.status_code} Error: {response.text[:200]}"
                    print(f"❌ RAG Error with {model}: {error_msg}")
                    last_error = error_msg
                    continue  # Try next model

                result_json = response.json()
                answer = result_json["choices"][0]["message"]["content"]
                used_llm = True
                print(f"✅ RAG: Success using {model}")
                break
            except Exception as e:
                print(f"❌ RAG Exception with {model}: {e}")
                last_error = str(e)
                import traceback
                traceback.print_exc()
                continue
        
        # If all models failed
        if not used_llm:
            answer = (
                f"⚠️ AI quota reached for all {len(models)} free models.\n"
                f"Last error: {last_error}\n\n"
                f"---\n"
                f"Showing raw search results:\n\n"
                + self._generate_fallback_answer(query, relevant_messages)
            )

        if answer is None:
            answer = self._generate_fallback_answer(query, relevant_messages)

        return {
            "answer": answer,
            "sources": [
                {
                    "platform": m.get('platform'),
                    "sender": m.get('sender'),
                    "title": m.get('title'),
                    "timestamp": m.get('timestamp'),
                    "relevance_score": round(m.get('relevance_score', 0), 3),
                    "chat": m.get('chat')
                }
                for m in relevant_messages
            ],
            "query": query,
            "used_llm": used_llm,
            "messages_searched": len(self._stores.get(uid, {}).get('messages', []))
        }

    def has_index(self, uid: str) -> bool:
        return uid in self._stores and len(self._stores[uid]['messages']) > 0

    def clear_index(self, uid: str):
        if uid in self._stores:
            del self._stores[uid]

rag_service = RAGService()