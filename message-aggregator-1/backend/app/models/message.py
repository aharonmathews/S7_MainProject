from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class TFIDFContentCurator:
    def __init__(self):
        self.vectorizer = TfidfVectorizer()
        self.content_embeddings = []
        self.content_ids = []

    def add_content(self, content_id, text):
        self.content_ids.append(content_id)
        self.content_embeddings = self.vectorizer.fit_transform(self.content_ids)

    def recommend_content(self, user_preferences, top_k=10):
        user_vector = self.vectorizer.transform([user_preferences])
        similarities = cosine_similarity(user_vector, self.content_embeddings).flatten()
        recommended_indices = similarities.argsort()[-top_k:][::-1]
        return [(self.content_ids[i], similarities[i]) for i in recommended_indices]