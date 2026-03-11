"""
Diagnostic script to verify Gmail OAuth setup.
Run this BEFORE the OAuth flow to check if the config is correct.
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

client_id = os.getenv('GOOGLE_OAUTH_CLIENT_ID')
client_secret = os.getenv('GOOGLE_OAUTH_CLIENT_SECRET')
redirect_uri = "http://localhost:8000/auth/gmail/callback"

print("=== Gmail OAuth Diagnostic ===\n")
print(f"Client ID: {client_id[:30]}..." if client_id else "❌ Client ID: NOT SET")
print(f"Client Secret: {client_secret[:10]}..." if client_secret else "❌ Client Secret: NOT SET")
print(f"Redirect URI: {redirect_uri}")

# Try to create the OAuth flow
try:
    sys.path.insert(0, '.')
    from app.services.gmail import get_oauth_flow
    flow = get_oauth_flow()
    auth_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',
        state='test_user'
    )
    print(f"\n✅ OAuth flow created successfully!")
    print(f"Auth URL starts with: {auth_url[:80]}...")
    print(f"\n⚠️  Make sure this redirect_uri is added to your Google Cloud Console:")
    print(f"   {redirect_uri}")
    print(f"\n⚠️  The OAuth app must also have this test user email registered:")
    print(f"   Go to: https://console.cloud.google.com/apis/credentials/consent")
    print(f"   Under 'Test users', add the Gmail account you're trying to connect")
    print(f"\n⚠️  Note: The Firebase login email and Gmail email can be DIFFERENT!")
    print(f"   The Gmail you connect does NOT need to match the Firebase login email.")
except Exception as e:
    print(f"\n❌ Error creating OAuth flow: {e}")
    import traceback
    traceback.print_exc()
