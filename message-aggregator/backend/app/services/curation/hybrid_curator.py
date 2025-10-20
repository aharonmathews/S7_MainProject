from typing import List, Dict, Any
from ..message_filter import message_filter
from .sentence_transformer_curator import sentence_curator

class HybridContentCurator:
    """
    Combines TF-IDF keyword matching with semantic understanding
    for superior content curation
    """
    
    def __init__(
        self,
        tfidf_weight: float = 0.4,
        semantic_weight: float = 0.6,
        keyword_bonus: float = 0.2
    ):
        self.tfidf_weight = tfidf_weight
        self.semantic_weight = semantic_weight
        self.keyword_bonus = keyword_bonus
    
    def curate_messages(
        self,
        messages: List[Dict[str, Any]],
        preferences: List[str],
        threshold: float = 0.25,
        top_k: int = 30
    ) -> Dict[str, Any]:
        """
        Advanced content curation pipeline:
        1. TF-IDF keyword matching
        2. Semantic similarity (Sentence Transformers)
        3. Keyword bonus scoring
        4. Hybrid score combination
        """
        if not preferences or not messages:
            return {
                'important': [],
                'regular': messages,
                'curation_stats': {}
            }
        
        print(f"\n🎯 Starting Hybrid Curation Pipeline")
        print(f"   Messages: {len(messages)}")
        print(f"   Preferences: {preferences}")
        
        scored_messages = []
        
        for msg in messages:
            # Step 1: TF-IDF Score
            tfidf_score = message_filter.calculate_importance_score(
                msg, 
                preferences,
                keyword_weight=0.7,
                tfidf_weight=0.3
            )
            
            # Step 2: Semantic Similarity Score
            semantic_score = sentence_curator.calculate_semantic_similarity(
                msg,
                preferences
            )
            
            # Step 3: Keyword Bonus (exact matches get boost)
            keyword_bonus = self._calculate_keyword_bonus(msg, preferences)
            
            # Step 4: Hybrid Score
            hybrid_score = (
                (self.tfidf_weight * tfidf_score) +
                (self.semantic_weight * semantic_score) +
                keyword_bonus
            )
            
            # Store all scores
            msg_copy = msg.copy()
            msg_copy['tfidf_score'] = tfidf_score
            msg_copy['semantic_score'] = semantic_score
            msg_copy['keyword_bonus'] = keyword_bonus
            msg_copy['hybrid_score'] = hybrid_score
            msg_copy['importance_score'] = hybrid_score  # For compatibility
            
            scored_messages.append(msg_copy)
        
        # Sort by hybrid score
        scored_messages.sort(key=lambda x: x['hybrid_score'], reverse=True)
        
        # Split into important and regular
        important = []
        regular = []
        
        for msg in scored_messages:
            if msg['hybrid_score'] >= threshold:
                important.append(msg)
            else:
                regular.append(msg)
        
        # Limit important messages
        if top_k and len(important) > top_k:
            regular = important[top_k:] + regular
            important = important[:top_k]
        
        # Calculate statistics
        stats = self._calculate_curation_stats(important, regular, preferences)
        
        print(f"\n📊 Curation Results:")
        print(f"   Important: {len(important)} messages")
        print(f"   Regular: {len(regular)} messages")
        if important:
            top_scores = [f"{m['hybrid_score']:.3f}" for m in important[:3]]
            print(f"   Top scores: {top_scores}")
            print(f"   Avg semantic score: {stats['avg_semantic_score']:.3f}")
            print(f"   Avg TF-IDF score: {stats['avg_tfidf_score']:.3f}")
        
        return {
            'important': important,
            'regular': regular,
            'curation_stats': stats
        }
    
    def _calculate_keyword_bonus(
        self,
        message: Dict[str, Any],
        preferences: List[str]
    ) -> float:
        """Give bonus for exact keyword matches"""
        message_text = ' '.join([
            str(message.get('title', '')),
            str(message.get('content', '')),
            str(message.get('sender', '')),
            str(message.get('chat', ''))
        ]).lower()
        
        bonus = 0.0
        for pref in preferences:
            if pref.lower() in message_text:
                bonus += self.keyword_bonus
        
        return min(bonus, 0.5)  # Cap at 0.5
    
    def _calculate_curation_stats(
        self,
        important: List[Dict[str, Any]],
        regular: List[Dict[str, Any]],
        preferences: List[str]
    ) -> Dict[str, Any]:
        """Calculate statistics about the curation results"""
        if not important:
            return {
                'total_important': 0,
                'total_regular': len(regular),
                'avg_semantic_score': 0.0,
                'avg_tfidf_score': 0.0,
                'avg_hybrid_score': 0.0,
                'preferences_matched': {}
            }
        
        # Calculate averages
        avg_semantic = sum(m.get('semantic_score', 0) for m in important) / len(important)
        avg_tfidf = sum(m.get('tfidf_score', 0) for m in important) / len(important)
        avg_hybrid = sum(m.get('hybrid_score', 0) for m in important) / len(important)
        
        # Count preference matches
        preferences_matched = {}
        for pref in preferences:
            count = sum(
                1 for m in important 
                if pref.lower() in str(m.get('content', '')).lower() or
                   pref.lower() in str(m.get('title', '')).lower()
            )
            if count > 0:
                preferences_matched[pref] = count
        
        return {
            'total_important': len(important),
            'total_regular': len(regular),
            'avg_semantic_score': avg_semantic,
            'avg_tfidf_score': avg_tfidf,
            'avg_hybrid_score': avg_hybrid,
            'preferences_matched': preferences_matched
        }

# Singleton instance
hybrid_curator = HybridContentCurator()