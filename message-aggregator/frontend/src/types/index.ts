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
}
