import requests

url = "http://localhost:8000/api/rag/query"
# Assuming the user is authenticated, we need to bypass auth or just test it
# Let's test the endpoint directly with a dummy user_id if it doesn't strictly verify tokens
# Wait, the frontend sends a JWT token. The backend endpoint probably requires Authorization: Bearer token
