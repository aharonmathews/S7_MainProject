# File: /message-aggregator/message-aggregator/backend/app/services/whatsapp.py

from typing import List, Dict
import requests

class WhatsAppService:
    def __init__(self, api_url: str, token: str):
        self.api_url = api_url
        self.token = token

    def get_messages(self) -> List[Dict]:
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        response = requests.get(f"{self.api_url}/messages", headers=headers)
        
        if response.status_code == 200:
            return response.json().get('messages', [])
        else:
            return []

    def send_message(self, to: str, message: str) -> Dict:
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        payload = {
            "to": to,
            "message": message
        }
        response = requests.post(f"{self.api_url}/send", json=payload, headers=headers)
        
        return response.json() if response.status_code == 200 else {}