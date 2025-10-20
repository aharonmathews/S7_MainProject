export interface Message {
  id: string;
  platform: string;
  title: string;
  content: string;
  sender: string;
  timestamp: string;
  url?: string;
  chat?: string;
  importance_score?: number;
  semantic_score?: number;
  tfidf_score?: number;
  hybrid_score?: number;
  keyword_bonus?: number;
}

export interface Platform {
  id: string;
  name: string;
  enabled: boolean;
}

export interface MessagesResponse {
  important: Message[];
  regular: Message[];
  total_count: number;
  important_count: number;
  preferences_used: string[];
  curation_method?: string;
  curation_stats?: {
    avg_semantic_score?: number;
    avg_tfidf_score?: number;
    avg_hybrid_score?: number;
    preferences_matched?: Record<string, number>;
  };
}
