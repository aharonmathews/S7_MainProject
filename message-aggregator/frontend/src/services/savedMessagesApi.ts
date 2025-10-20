import axios from "axios";
import { Message } from "../types";

const API_BASE_URL = "http://localhost:8000";

export const savedMessagesApi = {
  async saveMessage(token: string, message: Message): Promise<any> {
    const response = await axios.post(
      `${API_BASE_URL}/api/saved-messages`,
      message,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async getSavedMessages(token: string): Promise<Message[]> {
    const response = await axios.get(`${API_BASE_URL}/api/saved-messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.messages;
  },

  async deleteSavedMessage(token: string, savedId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/api/saved-messages/${savedId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async checkIfSaved(token: string, messageId: string): Promise<boolean> {
    const response = await axios.get(
      `${API_BASE_URL}/api/saved-messages/check/${messageId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.is_saved;
  },
};
