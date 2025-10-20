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
        # Combine user preferences with content
        all_texts = self.content + [user_preferences]
        tfidf_matrix = self.vectorizer.fit_transform(all_texts)
        
        # Calculate cosine similarity
        user_vector = tfidf_matrix[-1]
        content_vectors = tfidf_matrix[:-1]
        similarities = cosine_similarity(user_vector, content_vectors).flatten()
        
        # Get top_k recommendations
        recommended_indices = similarities.argsort()[-top_k:][::-1]
        return [(self.content_ids[i], similarities[i]) for i in recommended_indices]