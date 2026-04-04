from typing import List, Dict, Any, Tuple
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder
import numpy as np
import re
from ..message_filter import message_filter
from .sentence_transformer_curator import sentence_curator

class ImprovedHybridCurator:
    """
    Advanced three-stage curation:
    Stage 1: BM25 - Fast keyword-based filtering
    Stage 2: Semantic - Understanding context
    Stage 3: Cross-Encoder - Precise relevance ranking
    
    For final year project: Show improvement over TF-IDF baseline
    """
    
    def __init__(
        self,
        bm25_weight: float = 0.2,
        semantic_weight: float = 0.3,
        cross_encoder_weight: float = 0.5
    ):
        self.bm25_weight = bm25_weight
        self.semantic_weight = semantic_weight
        self.cross_encoder_weight = cross_encoder_weight
        
        # Load cross-encoder model (high accuracy ranking)
        print("🔄 Loading Cross-Encoder model for ranking...")
        self.cross_encoder = CrossEncoder(
            'cross-encoder/ms-marco-MiniLM-L-6-v2'
        )
        print("✅ Cross-Encoder model loaded")
        self.bm25 = None
    
    def _extract_text(self, message: Dict[str, Any]) -> str:
        """Extract all text from message"""
        return ' '.join([
            str(message.get('title', '')),
            str(message.get('content', '')),
            str(message.get('sender', '')),
            str(message.get('chat', ''))
        ]).lower()

    def _minmax_normalize(self, scores: List[float]) -> List[float]:
        if not scores:
            return []
        arr = np.array(scores, dtype=float)
        arr = np.nan_to_num(arr, nan=0.0, posinf=0.0, neginf=0.0)
        lo, hi = float(arr.min()), float(arr.max())
        if abs(hi - lo) < 1e-9:
            # Keep neutral value instead of all-zero collapse
            return [0.5 for _ in arr]
        norm = (arr - lo) / (hi - lo)
        return np.clip(norm, 0.0, 1.0).tolist()

    
    def _score_bm25(
        self,
        messages: List[Dict[str, Any]],
        preferences: List[str]
    ) -> List[float]:
        """Stage 1: BM25 Scoring"""
        if not messages or not preferences:
            return [0.0] * len(messages)

        message_texts = [self._extract_text(msg) for msg in messages]
        tokenized = [re.findall(r'\w+', text) for text in message_texts]
        self.bm25 = BM25Okapi(tokenized)

        pref_text = " ".join(preferences).lower()
        pref_tokens = re.findall(r'\w+', pref_text)
        raw_scores = self.bm25.get_scores(pref_tokens)
        return self._minmax_normalize(raw_scores.tolist() if hasattr(raw_scores, "tolist") else list(raw_scores))

    def _score_semantic(
        self,
        messages: List[Dict[str, Any]],
        preferences: List[str]
    ) -> List[float]:
        """Stage 2: Semantic Similarity"""
        if not messages or not preferences:
            return [0.0] * len(messages)

        scores = []
        for msg in messages:
            raw = float(sentence_curator.calculate_semantic_similarity(msg, preferences))
            # cosine [-1,1] -> [0,1]
            normalized = (raw + 1.0) / 2.0
            scores.append(float(np.clip(normalized, 0.0, 1.0)))
        return scores

    def _score_cross_encoder(
        self,
        messages: List[Dict[str, Any]],
        preferences: List[str],
        message_indices: List[int] = None
    ) -> Dict[int, float]:
        """
        Stage 3: Cross-Encoder Ranking.
        Uses max-over-preferences per message instead of one long concatenated query.
        """
        if not messages or not preferences:
            return {}

        pairs = []
        pair_to_idx = []

        for local_idx, msg in enumerate(messages):
            msg_text = self._extract_text(msg)
            orig_idx = message_indices[local_idx] if message_indices else local_idx
            for pref in preferences:
                pairs.append([pref, msg_text])
                pair_to_idx.append(orig_idx)

        raw_scores = self.cross_encoder.predict(pairs)
        probs = 1.0 / (1.0 + np.exp(-np.array(raw_scores, dtype=float)))  # sigmoid to [0,1]

        score_dict: Dict[int, float] = {}
        for idx, score in zip(pair_to_idx, probs):
            s = float(np.clip(score, 0.0, 1.0))
            if idx not in score_dict or s > score_dict[idx]:
                score_dict[idx] = s

        return score_dict

    def curate_messages(
        self,
        messages: List[Dict[str, Any]],
        preferences: List[str],
        threshold: float = 0.18,
        top_k: int = 30
    ) -> Dict[str, Any]:
        """
        Calibrated three-stage ranking.
        """
        if not preferences or not messages:
            return {
                "important": [],
                "regular": messages,
                "curation_stats": {
                    "method": "improved_hybrid",
                    "stages_used": [],
                    "total_important": 0,
                    "total_regular": len(messages),
                    "avg_bm25_score": 0.0,
                    "avg_semantic_score": 0.0,
                    "avg_cross_encoder_score": 0.0,
                    "avg_hybrid_score": 0.0,
                },
            }

        print("\n🚀 Starting Improved Hybrid Curation (3-Stage)")
        print(f"   Messages: {len(messages)}")
        print(f"   Preferences: {preferences}")

        print("📊 Stage 1/3: BM25 Keyword Matching...")
        bm25_scores = self._score_bm25(messages, preferences)

        print("🧠 Stage 2/3: Semantic Understanding...")
        semantic_scores = self._score_semantic(messages, preferences)

        print("🏆 Stage 3/3: Cross-Encoder Ranking...")
        seed = 0.3 * np.array(bm25_scores) + 0.4 * np.array(semantic_scores)
        top_indices = np.argsort(seed)[-min(100, len(messages)):]
        cross_encoder_scores = self._score_cross_encoder(
            [messages[i] for i in top_indices],
            preferences,
            message_indices=list(top_indices),
        )

        scored_messages = []
        for i, msg in enumerate(messages):
            bm25 = float(bm25_scores[i])
            semantic = float(semantic_scores[i])
            cross_enc = float(cross_encoder_scores.get(i, semantic))

            hybrid_score = (
                (self.bm25_weight * bm25)
                + (self.semantic_weight * semantic)
                + (self.cross_encoder_weight * cross_enc)
            )

            m = msg.copy()
            m["bm25_score"] = bm25
            m["semantic_score"] = semantic
            m["cross_encoder_score"] = cross_enc
            m["hybrid_score"] = float(hybrid_score)
            m["importance_score"] = float(hybrid_score)
            scored_messages.append(m)

        scored_messages.sort(key=lambda x: x["hybrid_score"], reverse=True)

        hybrid_scores = [m["hybrid_score"] for m in scored_messages]
        adaptive_threshold = min(threshold, float(np.percentile(hybrid_scores, 80))) if hybrid_scores else threshold

        important = [m for m in scored_messages if m["hybrid_score"] >= adaptive_threshold]
        regular = [m for m in scored_messages if m["hybrid_score"] < adaptive_threshold]

        # Safety fallback: never return zero important if there are scored messages
        if not important and scored_messages:
            fallback_n = min(3, len(scored_messages))
            important = scored_messages[:fallback_n]
            regular = scored_messages[fallback_n:]
            adaptive_threshold = important[-1]["hybrid_score"]

        if top_k and len(important) > top_k:
            regular = important[top_k:] + regular
            important = important[:top_k]

        stats = self._calculate_stats(important, regular, preferences)
        stats["threshold_used"] = float(adaptive_threshold)

        print("\n📈 Curation Results:")
        print(f"   Important: {len(important)} messages")
        print(f"   Regular: {len(regular)} messages")
        top3 = [f"{m['hybrid_score']:.3f}" for m in important[:3]]
        print(f"   Top 3 hybrid scores: {top3}")

        return {
            "important": important,
            "regular": regular,
            "curation_stats": stats,
        }
    
    def _calculate_stats(
    self,
    important: List[Dict[str, Any]],
    regular: List[Dict[str, Any]],
    preferences: List[str]
) -> Dict[str, Any]:
        all_msgs = important + regular

        if not important:
            return {
                "method": "improved_hybrid",
                "stages_used": ["bm25", "semantic", "cross_encoder"],
                "total_important": 0,
                "total_regular": len(regular),
                "total_messages": len(all_msgs),
                "avg_bm25_score": 0.0,
                "avg_tfidf_score": 0.0,  # alias for frontend compatibility
                "avg_semantic_score": 0.0,
                "avg_cross_encoder_score": 0.0,
                "avg_hybrid_score": 0.0,
            }

        important_bm25 = float(np.mean([m.get("bm25_score", 0.0) for m in important]))
        important_semantic = float(np.mean([m.get("semantic_score", 0.0) for m in important]))
        important_cross_enc = float(np.mean([m.get("cross_encoder_score", 0.0) for m in important]))
        important_hybrid = float(np.mean([m.get("hybrid_score", 0.0) for m in important]))

        return {
            "method": "improved_hybrid",
            "stages_used": ["bm25", "semantic", "cross_encoder"],
            "total_important": len(important),
            "total_regular": len(regular),
            "total_messages": len(all_msgs),
            "avg_bm25_score": important_bm25,
            "avg_tfidf_score": important_bm25,  # alias for old UI cards
            "avg_semantic_score": important_semantic,
            "avg_cross_encoder_score": important_cross_enc,
            "avg_hybrid_score": important_hybrid,
            "weights": {
                "bm25": self.bm25_weight,
                "semantic": self.semantic_weight,
                "cross_encoder": self.cross_encoder_weight,
            },
        }

# Singleton instance
improved_curator = ImprovedHybridCurator()