from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer, util
import numpy as np

# TF-IDF + Cosine Similarity
class TFIDFCurator:
    def __init__(self):
        self.vectorizer = TfidfVectorizer()
        self.content = []
        self.tfidf_matrix = None

    def add_content(self, text: str):
        self.content.append(text)
        self.tfidf_matrix = self.vectorizer.fit_transform(self.content)

    def recommend(self, user_preferences: str, top_k: int = 5) -> List[int]:
        user_vector = self.vectorizer.transform([user_preferences])
        cosine_similarities = cosine_similarity(user_vector, self.tfidf_matrix).flatten()
        recommended_indices = cosine_similarities.argsort()[-top_k:][::-1]
        return recommended_indices.tolist()

# Sentence Transformers
class SentenceTransformerCurator:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.content_embeddings = {}
        self.user_profiles = {}

    def add_content(self, content_id: str, text: str):
        embedding = self.model.encode(text)
        self.content_embeddings[content_id] = embedding

    def set_user_preferences(self, user_id: str, preferences_text: str):
        user_embedding = self.model.encode(preferences_text)
        self.user_profiles[user_id] = user_embedding

    def recommend(self, user_id: str, top_k: int = 10) -> List[str]:
        user_embedding = self.user_profiles[user_id]
        similarities = {}
        for content_id, content_embedding in self.content_embeddings.items():
            similarity = util.cos_sim(user_embedding, content_embedding)
            similarities[content_id] = similarity.item()
        return sorted(similarities.items(), key=lambda x: x[1], reverse=True)[:top_k]

# Hybrid Approach
class HybridContentCurator:
    def __init__(self):
        self.tfidf_curator = TFIDFCurator()
        self.sentence_curator = SentenceTransformerCurator()

    def add_content(self, content_id: str, text: str):
        self.tfidf_curator.add_content(text)
        self.sentence_curator.add_content(content_id, text)

    def set_user_preferences(self, user_id: str, preferences_text: str):
        self.sentence_curator.set_user_preferences(user_id, preferences_text)

    def recommend(self, user_id: str, top_k: int = 5) -> List[str]:
        tfidf_recs = self.tfidf_curator.recommend(user_id, top_k)
        semantic_recs = self.sentence_curator.recommend(user_id, top_k)

        # Combine recommendations (you can customize this logic)
        combined_recs = list(set(tfidf_recs) | set(semantic_recs))
        return combined_recs[:top_k]

# Example Usage
if __name__ == "__main__":
    curator = HybridContentCurator()
    
    # Adding content
    curator.add_content("1", "This is a sample article about Python programming.")
    curator.add_content("2", "Learn about machine learning and AI.")
    
    # Setting user preferences
    curator.set_user_preferences("user1", "I want to learn Python and AI.")
    
    # Getting recommendations
    recommendations = curator.recommend("user1", top_k=3)
    print("Recommended Content IDs:", recommendations)