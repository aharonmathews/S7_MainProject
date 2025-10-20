from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class TFIDFContentCurator:
    def __init__(self):
        self.vectorizer = TfidfVectorizer()
        self.content = []
        self.content_ids = []

    def add_content(self, content_id, text):
        self.content.append(text)
        self.content_ids.append(content_id)

    def recommend_content(self, user_preferences, top_k=10):
        tfidf_matrix = self.vectorizer.fit_transform(self.content)
        user_vector = self.vectorizer.transform([user_preferences])
        cosine_similarities = cosine_similarity(user_vector, tfidf_matrix).flatten()
        
        # Get top_k content based on cosine similarity
        recommended_indices = cosine_similarities.argsort()[-top_k:][::-1]
        return [(self.content_ids[i], cosine_similarities[i]) for i in recommended_indices]