import requests
import json
import hmac
import hashlib
import uuid
import sys
import os

# Try to load the secret from .env if it exists
try:
    with open(".env", "r") as f:
        env_lines = f.readlines()
    secret = next((line.split("=")[1].strip() for line in env_lines if line.startswith("TIKTOK_APP_SECRET=")), "default_secret")
except Exception:
    secret = "default_secret"

message_text = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "How much is the black streetwear tee?"

payload = {
    "message_id": str(uuid.uuid4()),
    "sender_id": "customer-777",
    "recipient_id": "mock-shop-123", # The mock shop we created
    "text": message_text
}

payload_bytes = json.dumps(payload).encode("utf-8")
signature = hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()

headers = {
    "Content-Type": "application/json",
    "x-tiktok-signature": signature
}

print(f"Sending message from TikTok Customer: '{message_text}'")
response = requests.post("http://localhost:8000/api/v1/webhooks/tiktok/", data=payload_bytes, headers=headers)

if response.status_code == 200:
    print("Success! Webhook received.")
    print("Check your docker logs (docker logs tokoai_worker) to see the AI agent's response!")
else:
    print(f"Failed: {response.status_code} - {response.text}")
