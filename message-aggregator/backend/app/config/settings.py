# File: /message-aggregator/message-aggregator/backend/app/config/settings.py

DATABASE_URL = "sqlite:///./test.db"
SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Add any other configuration settings as needed
# For example, API keys for different platforms can be added here
LINKEDIN_API_KEY = "your_linkedin_api_key"
TWITTER_API_KEY = "your_twitter_api_key"
WHATSAPP_API_KEY = "your_whatsapp_api_key"
DISCORD_API_KEY = "your_discord_api_key"
FACEBOOK_API_KEY = "your_facebook_api_key"
TELEGRAM_API_KEY = "your_telegram_api_key"