from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re

class MessageFilter:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=500,
            stop_words='english',
            ngram_range=(1, 2),
            lowercase=True
        )
        
    def _extract_text_from_message(self, message: Dict[str, Any]) -> str:
        """Extract all text from message for analysis"""
        text_parts = [
            message.get('title', ''),
            message.get('content', ''),
            message.get('sender', ''),
            message.get('chat', ''),
        ]
        return ' '.join([str(part) for part in text_parts if part]).lower()
    
    def _keyword_match_score(self, message_text: str, preferences: List[str]) -> float:
        """Enhanced keyword matching with better fuzzy logic"""
        score = 0.0
        message_lower = message_text.lower()
        
        # Create keyword mappings for better matching
        keyword_expansions = {
            'job opportunities': ['job', 'hiring', 'career', 'employment', 'position', 'vacancy', 'work', 'internship', 'recruit'],
            'study materials': ['study', 'course', 'tutorial', 'learning', 'education', 'lecture', 'pdf', 'notes', 'exam', 'test'],
            'physics': ['physics', 'quantum', 'mechanics', 'thermodynamics', 'relativity', 'particle', 'motion', 'energy'],
            'technology': ['tech', 'software', 'hardware', 'ai', 'programming', 'code', 'computer', 'app', 'digital', 'cyber', 'data', 'algorithm'],
            'business': ['business', 'startup', 'entrepreneur', 'funding', 'investment', 'market', 'sales', 'revenue'],
            'donald trump': ['trump', 'donald trump', 'president trump']
        }
        
        for pref in preferences:
            pref_lower = pref.lower()
            
            # Exact phrase match - highest score
            if pref_lower in message_lower:
                score += 2.0
                continue
            
            # Check expanded keywords
            if pref_lower in keyword_expansions:
                keywords = keyword_expansions[pref_lower]
                matches = sum(1 for keyword in keywords if keyword in message_lower)
                if matches > 0:
                    score += min(matches * 0.5, 1.5)  # Cap at 1.5 per preference
                    continue
            
            # Fallback: Check individual words from preference
            words = pref_lower.split()
            relevant_words = [w for w in words if len(w) > 3]  # Skip short words
            if relevant_words:
                matches = sum(1 for word in relevant_words if word in message_lower)
                if matches > 0:
                    score += (matches / len(relevant_words)) * 0.8
        
        return min(score, 3.0)  # Normalize to 0-3 (to give keyword matching more weight)
    
    def _tfidf_similarity_score(self, message_text: str, preferences: List[str]) -> float:
        """Calculate TF-IDF similarity"""
        try:
            # Combine preferences into one text
            preference_text = ' '.join(preferences)
            
            # Create corpus
            corpus = [preference_text, message_text]
            
            # Calculate TF-IDF
            tfidf_matrix = self.vectorizer.fit_transform(corpus)
            
            # Calculate similarity
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return float(similarity)
        except:
            return 0.0
    
    def calculate_importance_score(
        self, 
        message: Dict[str, Any], 
        preferences: List[str],
        keyword_weight: float = 0.7,
        tfidf_weight: float = 0.3
    ) -> float:
        """Calculate combined importance score"""
        if not preferences:
            return 0.0
            
        message_text = self._extract_text_from_message(message)
        
        # Calculate both scores
        keyword_score = self._keyword_match_score(message_text, preferences)
        tfidf_score = self._tfidf_similarity_score(message_text, preferences)
        
        # Weighted combination
        # Normalize keyword score to 0-1 range (divide by 3)
        normalized_keyword = keyword_score / 3.0
        final_score = (keyword_weight * normalized_keyword) + (tfidf_weight * tfidf_score)
        
        return final_score
    
    def filter_important_messages(
        self,
        messages: List[Dict[str, Any]],
        preferences: List[str],
        threshold: float = 0.15,  # Lowered from 0.3
        top_k: int = 30  # Show top 30 important messages max
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Filter messages into important and regular
        
        Returns:
            {
                'important': [...],  # High relevance messages
                'regular': [...]     # All other messages
            }
        """
        if not preferences:
            return {'important': [], 'regular': messages}
        
        # Calculate scores for all messages
        scored_messages = []
        for msg in messages:
            score = self.calculate_importance_score(msg, preferences)
            msg_copy = msg.copy()
            msg_copy['importance_score'] = score
            scored_messages.append(msg_copy)
        
        # Sort by score
        scored_messages.sort(key=lambda x: x['importance_score'], reverse=True)
        
        # Split into important and regular
        important = []
        regular = []
        
        for msg in scored_messages:
            if msg['importance_score'] >= threshold:
                important.append(msg)
            else:
                regular.append(msg)
        
        # Limit important messages if top_k specified
        if top_k and len(important) > top_k:
            regular = important[top_k:] + regular
            important = important[:top_k]
        
        # Debug logging
        print(f"\n📊 Filtering Results:")
        print(f"   Total messages: {len(messages)}")
        print(f"   Important (score >= {threshold}): {len(important)}")
        print(f"   Regular: {len(regular)}")
        if important:
            print(f"   Top 3 important scores: {[f'{m['importance_score']:.3f}' for m in important[:3]]}")
        
        return {
            'important': important,
            'regular': regular
        }

# Singleton instance
message_filter = MessageFilter()