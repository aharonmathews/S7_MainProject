import axios from "axios";
import { CalendarEvent, EventFormData } from "../types/calendar";

const API_BASE_URL = "http://localhost:8000";

export const calendarApi = {
  async getEvents(
    token: string,
    startDate?: string,
    endDate?: string
  ): Promise<CalendarEvent[]> {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const response = await axios.get(
      `${API_BASE_URL}/api/calendar/events?${params}`, // ✅ /api/calendar/events
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.events;
  },

  async createEvent(
    token: string,
    eventData: EventFormData & { platform?: string; message_id?: string }
  ): Promise<CalendarEvent> {
    const response = await axios.post(
      `${API_BASE_URL}/api/calendar/events`, // ✅ /api/calendar/events
      eventData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async updateEvent(
    token: string,
    eventId: string,
    updates: Partial<EventFormData>
  ): Promise<void> {
    await axios.put(
      `${API_BASE_URL}/api/calendar/events/${eventId}`, // ✅ /api/calendar/events
      updates,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  async deleteEvent(token: string, eventId: string): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/api/calendar/events/${eventId}`, // ✅ /api/calendar/events
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  async extractDatesFromMessage(
    token: string,
    message: any
  ): Promise<EventFormData | null> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/calendar/extract-dates`, // ✅ /api/calendar/extract-dates
        message,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.suggested ? response.data : null;
    } catch {
      return null;
    }
  },
};
