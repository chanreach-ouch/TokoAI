import hmac
import hashlib
import os

TIKTOK_APP_SECRET = os.getenv("TIKTOK_APP_SECRET", "dummy_secret")

def verify_tiktok_signature(signature: str, body: bytes) -> bool:
    if not signature:
        return False
    
    expected_mac = hmac.new(
        TIKTOK_APP_SECRET.encode('utf-8'),
        body,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_mac, signature)
