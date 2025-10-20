from typing import List, Dict, Any
import os
import base64
import re
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from dotenv import load_dotenv
from bs4 import BeautifulSoup

load_dotenv()

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
CLIENT_ID = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
CLIENT_SECRET = os.getenv('GOOGLE_OAUTH_CLIENT_SECRET')
REDIRECT_URI = "http://localhost:8000/auth/gmail/callback"

# Required for local development
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'


class GmailService:
    def __init__(self, credentials: Credentials = None):
        """Initialize Gmail service with optional credentials"""
        self.credentials = credentials
        self.service = None
        
        if credentials:
            try:
                self.service = build('gmail', 'v1', credentials=credentials)
            except Exception as e:
                print(f"❌ Error building Gmail service: {e}")
    
    def fetch_messages(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch recent Gmail messages"""
        if not self.service:
            print("⚠️  Gmail service not initialized - OAuth required")
            return []
        
        messages = []
        
        try:
            results = self.service.users().messages().list(
                userId='me',
                maxResults=limit,
                labelIds=['INBOX']
            ).execute()
            
            message_list = results.get('messages', [])
            
            for msg_data in message_list:
                msg = self.service.users().messages().get(
                    userId='me',
                    id=msg_data['id'],
                    format='full'
                ).execute()
                
                headers = msg['payload'].get('headers', [])
                subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), 'No Subject')
                sender = next((h['value'] for h in headers if h['name'].lower() == 'from'), 'Unknown')
                date = next((h['value'] for h in headers if h['name'].lower() == 'date'), '')
                
                # Get message body
                body = self._get_message_body(msg['payload'])
                
                # Clean HTML content
                clean_body = self._clean_html_content(body)
                
                messages.append({
                    'id': f"gmail_{msg['id']}",
                    'platform': 'gmail',
                    'title': subject,
                    'content': clean_body,
                    'sender': sender,
                    'timestamp': date,
                    'chat': 'Gmail',
                    'url': f"https://mail.google.com/mail/u/0/#inbox/{msg['id']}"
                })
            
            print(f"✅ Fetched {len(messages)} Gmail messages")
            
        except Exception as e:
            print(f"❌ Error fetching Gmail messages: {e}")
            import traceback
            traceback.print_exc()
        
        return messages
    
    def _get_message_body(self, payload):
        """Extract message body from Gmail payload"""
        body = ""
        
        # Try to get plain text first
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    if 'data' in part['body']:
                        body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='ignore')
                        break
                elif part['mimeType'] == 'text/html' and not body:
                    if 'data' in part['body']:
                        body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='ignore')
                elif 'parts' in part:  # Nested multipart
                    body = self._get_nested_body(part)
                    if body:
                        break
        elif 'body' in payload and 'data' in payload['body']:
            body = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='ignore')
        
        return body if body else "No content"
    
    def _get_nested_body(self, part):
        """Recursively extract body from nested parts"""
        if 'parts' in part:
            for subpart in part['parts']:
                if subpart['mimeType'] == 'text/plain':
                    if 'data' in subpart['body']:
                        return base64.urlsafe_b64decode(subpart['body']['data']).decode('utf-8', errors='ignore')
                elif subpart['mimeType'] == 'text/html':
                    if 'data' in subpart['body']:
                        return base64.urlsafe_b64decode(subpart['body']['data']).decode('utf-8', errors='ignore')
        return ""
    
    def _clean_html_content(self, html_content: str) -> str:
        """Convert HTML to clean plain text"""
        if not html_content or html_content == "No content":
            return "No content"
        
        # Check if content is HTML
        if not ('<html' in html_content.lower() or '<div' in html_content.lower() or '<p' in html_content.lower()):
            # Already plain text, just clean up
            return self._clean_plain_text(html_content)
        
        try:
            # Parse HTML with BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "head", "title", "meta", "[document]"]):
                script.decompose()
            
            # Get text
            text = soup.get_text()
            
            # Clean up text
            return self._clean_plain_text(text)
            
        except Exception as e:
            print(f"⚠️  Error parsing HTML: {e}")
            # Fallback: strip HTML tags with regex
            text = re.sub('<[^<]+?>', '', html_content)
            return self._clean_plain_text(text)
    
    def _clean_plain_text(self, text: str) -> str:
        """Clean up plain text content"""
        # Break into lines and remove leading/trailing whitespace
        lines = (line.strip() for line in text.splitlines())
        
        # Break multi-headlines into a line each
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        
        # Drop blank lines
        text = '\n'.join(chunk for chunk in chunks if chunk)
        
        # Remove excessive whitespace
        text = re.sub(r'\n\s*\n', '\n\n', text)
        
        # Remove excessive blank lines (more than 2 consecutive)
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Return full text - NO TRUNCATION
        return text.strip() if text.strip() else "No content"

def get_oauth_flow():
    """Create OAuth flow for Gmail authentication"""
    if not CLIENT_ID or not CLIENT_SECRET:
        raise Exception("Gmail OAuth credentials not set in .env file")
    
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
    return flow

def fetch_gmail_messages(limit: int = 20, credentials_dict: dict = None) -> List[Dict[str, Any]]:
    """Standalone function - uses provided credentials"""
    try:
        if not credentials_dict:
            print("⚠️  Gmail requires OAuth authentication - not yet configured")
            return []
        
        print(f"🔍 Credentials dict: {credentials_dict}")
        
        # ✅ FIX: Check if fields exist AND are not empty/None
        required_fields = ['token', 'token_uri', 'client_id', 'client_secret']
        missing_fields = []
        
        for field in required_fields:
            value = credentials_dict.get(field)
            if not value or value == 'None' or value == '':
                missing_fields.append(field)
        
        # refresh_token might be None if token is still valid
        refresh_token = credentials_dict.get('refresh_token')
        
        if missing_fields:
            print(f"❌ Missing or empty credential fields: {missing_fields}")
            print(f"   Available fields: {list(credentials_dict.keys())}")
            for field in credentials_dict:
                value = credentials_dict[field]
                if isinstance(value, str):
                    print(f"   {field}: {value[:20]}..." if len(str(value)) > 20 else f"   {field}: {value}")
                else:
                    print(f"   {field}: {value}")
            return []
        
        # Reconstruct credentials from dict
        credentials = Credentials(
            token=credentials_dict.get('token'),
            refresh_token=refresh_token,  # Can be None
            token_uri=credentials_dict.get('token_uri'),
            client_id=credentials_dict.get('client_id'),
            client_secret=credentials_dict.get('client_secret'),
            scopes=credentials_dict.get('scopes')
        )
        
        print("✅ Gmail credentials reconstructed successfully")
        
        service = GmailService(credentials)
        return service.fetch_messages(limit)
    except Exception as e:
        print(f"❌ Gmail fetch error: {e}")
        import traceback
        traceback.print_exc()
        return []