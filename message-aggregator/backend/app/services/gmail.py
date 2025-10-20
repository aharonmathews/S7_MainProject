from typing import List, Dict, Any
import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
import json

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
CLIENT_ID = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
CLIENT_SECRET = os.getenv('GOOGLE_OAUTH_CLIENT_SECRET')
REDIRECT_URI = "http://localhost:8000/auth/gmail/callback"

# Required for local development
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

class GmailService:
    def __init__(self):
        self.creds = None
        self.service = None
        
    def get_auth_url(self) -> str:
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": CLIENT_ID,
                    "client_secret": CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [REDIRECT_URI]
                }
            },
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        auth_url, _ = flow.authorization_url(prompt='consent', access_type='offline')
        return auth_url
    
    def authenticate(self, code: str):
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": CLIENT_ID,
                    "client_secret": CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [REDIRECT_URI]
                }
            },
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        flow.fetch_token(code=code)
        self.creds = flow.credentials
        self.service = build('gmail', 'v1', credentials=self.creds)
        
        # Save credentials
        with open('gmail_token.json', 'w') as token:
            token.write(self.creds.to_json())
    
    def load_credentials(self):
        if os.path.exists('gmail_token.json'):
            self.creds = Credentials.from_authorized_user_file('gmail_token.json', SCOPES)
            self.service = build('gmail', 'v1', credentials=self.creds)
            return True
        return False
    
    def fetch_emails(self, max_results: int = 20) -> List[Dict[str, Any]]:
        if not self.service:
            if not self.load_credentials():
                return []
        
        try:
            results = self.service.users().messages().list(
                userId='me', 
                maxResults=max_results
            ).execute()
            
            messages = []
            for msg in results.get('messages', []):
                email = self.service.users().messages().get(
                    userId='me', 
                    id=msg['id']
                ).execute()
                
                headers = email['payload']['headers']
                subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
                sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
                date = next((h['value'] for h in headers if h['name'] == 'Date'), '')
                
                messages.append({
                    "id": f"gmail_{msg['id']}",
                    "platform": "gmail",
                    "title": subject,
                    "content": email.get('snippet', ''),
                    "sender": sender,
                    "timestamp": date,
                    "url": f"https://mail.google.com/mail/u/0/#inbox/{msg['id']}"
                })
            
            return messages
        except Exception as e:
            print(f"Error fetching Gmail: {e}")
            return []

def fetch_gmail_messages(max_results: int = 20) -> List[Dict[str, Any]]:
    service = GmailService()
    return service.fetch_emails(max_results)