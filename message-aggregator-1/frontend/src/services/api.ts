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
        # Vectorize content and user preferences
        tfidf_matrix = self.vectorizer.fit_transform(self.content)
        user_vector = self.vectorizer.transform([user_preferences])

        # Calculate cosine similarity
        similarities = cosine_similarity(user_vector, tfidf_matrix).flatten()
        top_indices = similarities.argsort()[-top_k:][::-1]

        return [(self.content_ids[i], similarities[i]) for i in top_indices]