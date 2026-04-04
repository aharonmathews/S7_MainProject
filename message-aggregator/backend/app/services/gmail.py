from typing import List, Dict, Any
import os
import base64
import json
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from dotenv import load_dotenv
from bs4 import BeautifulSoup
import re

load_dotenv()

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
CLIENT_ID = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
CLIENT_SECRET = os.getenv('GOOGLE_OAUTH_CLIENT_SECRET')
REDIRECT_URI = "http://localhost:8000/auth/gmail/callback"

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

print(f"🔍 Gmail Config Check:")
print(f"   CLIENT_ID: {'✅ Set' if CLIENT_ID else '❌ Missing'}")
print(f"   CLIENT_SECRET: {'✅ Set' if CLIENT_SECRET else '❌ Missing'}")
print(f"   REDIRECT_URI: {REDIRECT_URI}")

class GmailService:
    def __init__(self, credentials: Credentials = None):
        self.credentials = credentials
        try:
            if credentials:
                self.service = build('gmail', 'v1', credentials=credentials)
                print("✅ Gmail service initialized with credentials")
            else:
                print("⚠️  Gmail service not initialized (no credentials)")
                self.service = None
        except Exception as e:
            print(f"❌ Error initializing Gmail: {e}")
            self.service = None
    
    def fetch_messages(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch emails from Gmail inbox"""
        if not self.service:
            print("❌ Gmail service not available")
            return []
        
        try:
            print(f"📧 Fetching up to {limit} emails from Gmail...")
            
            # Get message IDs from inbox
            results = self.service.users().messages().list(
                userId='me',
                maxResults=limit,
                q='in:inbox'
            ).execute()
            
            messages = results.get('messages', [])
            print(f"   Found {len(messages)} messages in inbox")
            
            email_list = []
            
            for msg_data in messages[:limit]:
                try:
                    # Get full message
                    message = self.service.users().messages().get(
                        userId='me',
                        id=msg_data['id'],
                        format='full'
                    ).execute()
                    
                    # Extract headers
                    headers = message['payload']['headers']
                    header_dict = {h['name']: h['value'] for h in headers}
                    
                    sender = header_dict.get('From', 'Unknown')
                    subject = header_dict.get('Subject', '(no subject)')
                    date = header_dict.get('Date', '')
                    
                    # Extract body
                    body = self._get_message_body(message['payload'])
                    if not body:
                        body = "(Email body could not be extracted)"
                    
                    # Clean HTML
                    body = self._clean_html(body)
                    
                    email_list.append({
                        'id': msg_data['id'],
                        'platform': 'gmail',
                        'sender': sender,
                        'title': subject,
                        'content': body[:500],  # Limit content
                        'timestamp': date,
                        'url': f"https://mail.google.com/mail/u/0/#inbox/{msg_data['id']}"
                    })
                    
                except Exception as e:
                    print(f"   ⚠️  Error processing email {msg_data['id']}: {e}")
                    continue
            
            print(f"✅ Successfully fetched {len(email_list)} Gmail messages")
            return email_list
            
        except Exception as e:
            print(f"❌ Error fetching Gmail messages: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _get_message_body(self, payload):
        """Extract email body from payload"""
        try:
            if 'parts' in payload:
                for part in payload['parts']:
                    if part['mimeType'] == 'text/plain':
                        if 'data' in part['body']:
                            return base64.urlsafe_b64decode(
                                part['body']['data']
                            ).decode('utf-8')
                    elif part['mimeType'] == 'text/html':
                        if 'data' in part['body']:
                            html = base64.urlsafe_b64decode(
                                part['body']['data']
                            ).decode('utf-8')
                            return self._clean_html(html)
            
            if 'body' in payload and 'data' in payload['body']:
                return base64.urlsafe_b64decode(
                    payload['body']['data']
                ).decode('utf-8')
        except Exception as e:
            print(f"   ⚠️  Error extracting body: {e}")
        
        return None
    
    def _clean_html(self, html_text):
        """Clean HTML from email body"""
        try:
            soup = BeautifulSoup(html_text, 'html.parser')
            # Remove script and style tags
            for script in soup(["script", "style"]):
                script.decompose()
            # Get text
            text = soup.get_text(separator=' ')
            # Clean whitespace
            text = re.sub(r'\s+', ' ', text).strip()
            return text
        except:
            return html_text

def get_oauth_flow():
    """Create OAuth flow for Gmail"""
    if not CLIENT_ID or not CLIENT_SECRET:
        raise ValueError("Missing Google OAuth credentials in .env file")
    
    return Flow.from_client_secrets_file(
        'credentials.json',
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )

def fetch_gmail_messages(
    limit: int = 20,
    credentials_dict: dict = None
) -> List[Dict[str, Any]]:
    """Fetch Gmail messages using stored credentials"""
    
    try:
        if not credentials_dict:
            print("⚠️  No Gmail credentials available - returning empty")
            return []
        
        # Reconstruct credentials
        creds = Credentials(
            token=credentials_dict.get('token'),
            refresh_token=credentials_dict.get('refresh_token'),
            token_uri=credentials_dict.get('token_uri'),
            client_id=credentials_dict.get('client_id'),
            client_secret=credentials_dict.get('client_secret'),
            scopes=credentials_dict.get('scopes', SCOPES)
        )
        
        service = GmailService(creds)
        messages = service.fetch_messages(limit)
        
        return messages
        
    except Exception as e:
        print(f"❌ Error fetching Gmail messages: {e}")
        import traceback
        traceback.print_exc()
        return []