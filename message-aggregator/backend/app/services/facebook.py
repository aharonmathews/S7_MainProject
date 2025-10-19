# /message-aggregator/message-aggregator/backend/app/services/facebook.py

from typing import List
import requests

class FacebookService:
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://graph.facebook.com/v12.0"

    def get_user_messages(self, user_id: str) -> List[dict]:
        url = f"{self.base_url}/{user_id}/messages"
        params = {
            "access_token": self.access_token
        }
        response = requests.get(url, params=params)
        if response.status_code == 200:
            return response.json().get('data', [])
        else:
            return []  # Handle errors appropriately in production

    def post_message(self, user_id: str, message: str) -> dict:
        url = f"{self.base_url}/{user_id}/messages"
        params = {
            "access_token": self.access_token,
            "message": message
        }
        response = requests.post(url, json=params)
        return response.json()  # Handle response appropriately in production

    def delete_message(self, message_id: str) -> dict:
        url = f"{self.base_url}/{message_id}"
        params = {
            "access_token": self.access_token
        }
        response = requests.delete(url, params=params)
        return response.json()  # Handle response appropriately in production