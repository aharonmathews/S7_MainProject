from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any

class TFIDFContentCurator:
    def __init__(self):
        self.vectorizer = TfidfVectorizer()
        self.content_embeddings = []
        self.content_ids = []

    def add_content(self, content_id: str, text: str):
        self.content_ids.append(content_id)
        self.content_embeddings = self.vectorizer.fit_transform(self.content_ids)

    def recommend_content(self, user_preferences: str, top_k: int = 10) -> List[str]:
        user_vector = self.vectorizer.transform([user_preferences])
        similarities = cosine_similarity(user_vector, self.content_embeddings).flatten()
        recommended_indices = similarities.argsort()[-top_k:][::-1]
        return [self.content_ids[i] for i in recommended_indices]