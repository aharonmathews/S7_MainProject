export interface Message {
  id: string;
  platform: string;
  content: string;
  timestamp: Date;
}

export interface Platform {
  name: string;
  isSelected: boolean;
}

export interface AggregatedMessages {
  [platform: string]: Message[];
}