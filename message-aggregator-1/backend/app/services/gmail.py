from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class TFIDFContentCurator:
    def __init__(self):
        self.vectorizer = TfidfVectorizer()
        self.content = []
    
    def add_content(self, text):
        self.content.append(text)
    
    def recommend_content(self, user_preferences):
        # Vectorize content and user preferences
        tfidf_matrix = self.vectorizer.fit_transform(self.content)
        user_vector = self.vectorizer.transform([user_preferences])
        
        # Calculate cosine similarity
        similarities = cosine_similarity(user_vector, tfidf_matrix).flatten()
        return similarities