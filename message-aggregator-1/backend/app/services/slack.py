from sentence_transformers import SentenceTransformer, util
import numpy as np

class SentenceTransformerCurator:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.content_embeddings = {}
        self.user_profiles = {}
    
    def add_content(self, content_id, text):
        embedding = self.model.encode(text)
        self.content_embeddings[content_id] = embedding
    
    def set_user_preferences(self, user_id, preferences_text):
        user_embedding = self.model.encode(preferences_text)
        self.user_profiles[user_id] = user_embedding
    
    def recommend(self, user_id, top_k=10):
        user_embedding = self.user_profiles[user_id]
        
        similarities = {}
        for content_id, content_embedding in self.content_embeddings.items():
            similarity = util.cos_sim(user_embedding, content_embedding)
            similarities[content_id] = similarity.item()
        
        return sorted(similarities.items(), key=lambda x: x[1], reverse=True)[:top_k]