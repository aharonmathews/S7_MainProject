from sentence_transformers import SentenceTransformer, util
import torch
from typing import List, Dict, Any
import numpy as np

class SentenceTransformerCurator:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        """
        Initialize with a pre-trained sentence transformer model
        all-MiniLM-L6-v2: Fast, 80MB, good balance
        all-mpnet-base-v2: Better accuracy, 420MB, slower
        """
        print(f"🔄 Loading Sentence Transformer model: {model_name}")
        self.model = SentenceTransformer(model_name)
        print(f"✅ Model loaded successfully")
    
    def calculate_semantic_similarity(
        self,
        message: Dict[str, Any],
        preferences: List[str]
    ) -> float:
        """Calculate semantic similarity using sentence transformers"""
        if not preferences:
            return 0.0
        
        # Extract message text
        message_text = self._extract_message_text(message)
        if not message_text:
            return 0.0
        
        # Combine preferences into one text
        preferences_text = ' '.join(preferences)
        
        # Encode both texts
        message_embedding = self.model.encode(message_text, convert_to_tensor=True)
        preference_embedding = self.model.encode(preferences_text, convert_to_tensor=True)
        
        # Calculate cosine similarity
        similarity = util.cos_sim(message_embedding, preference_embedding)
        
        return float(similarity.item())
    
    def calculate_multi_preference_similarity(
        self,
        message: Dict[str, Any],
        preferences: List[str]
    ) -> Dict[str, float]:
        """Calculate similarity for each preference individually"""
        message_text = self._extract_message_text(message)
        if not message_text or not preferences:
            return {}
        
        # Encode message once
        message_embedding = self.model.encode(message_text, convert_to_tensor=True)
        
        # Calculate similarity with each preference
        similarities = {}
        for pref in preferences:
            pref_embedding = self.model.encode(pref, convert_to_tensor=True)
            similarity = util.cos_sim(message_embedding, pref_embedding)
            similarities[pref] = float(similarity.item())
        
        return similarities
    
    def _extract_message_text(self, message: Dict[str, Any]) -> str:
        """Extract all relevant text from message"""
        text_parts = [
            message.get('title', ''),
            message.get('content', ''),
            message.get('sender', ''),
            message.get('chat', ''),
        ]
        return ' '.join([str(part) for part in text_parts if part])

# Singleton instance
sentence_curator = SentenceTransformerCurator()