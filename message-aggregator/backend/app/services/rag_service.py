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

        for attempt in range(2):
            try:
                openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
                if not openrouter_api_key:
                    raise Exception("Missing OPENROUTER_API_KEY")

                response = requests.post(
                    url="https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openrouter_api_key}",
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
                
                if response.status_code == 429:
                    if attempt == 0:
                        print("⏳ Rate limited, waiting 6s before retry...")
                        time.sleep(6)
                        continue
                    else:
                        raise Exception("429 Too Many Requests")

                response.raise_for_status()
                result_json = response.json()
                answer = result_json["choices"][0]["message"]["content"]
                used_llm = True
                break
            except Exception as e:
                error_str = str(e)
                if '429' in error_str or 'Too Many Requests' in error_str:
                    if attempt == 0:
                        print("⏳ Rate limited, waiting 6s before retry...")
                        time.sleep(6)
                        continue
                    else:
                        answer = (
                            "⚠️ AI quota reached. Showing raw search results:\n\n"
                            + self._generate_fallback_answer(query, relevant_messages)
                        )
                else:
                    answer = f"Could not generate answer: {error_str}"
                break

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