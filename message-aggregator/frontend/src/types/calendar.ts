export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  platform: string;
  message_id?: string;
  created_at: string;
  updated_at: string;
  suggested?: boolean;
}

export interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
}
