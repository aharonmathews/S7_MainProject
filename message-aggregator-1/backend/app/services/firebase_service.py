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

    def recommend_content(self, user_preferences):
        # Vectorize the content and user preferences
        tfidf_matrix = self.vectorizer.fit_transform(self.content + [user_preferences])
        cosine_sim = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1])
        return sorted(zip(self.content_ids, cosine_sim.flatten()), key=lambda x: x[1], reverse=True)