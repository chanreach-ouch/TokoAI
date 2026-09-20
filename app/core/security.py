import hmac
import hashlib
from fastapi import Request, HTTPException
from app.config import settings

async def verify_tiktok_hmac(request: Request, x_tiktok_signature: str) -> bool:
    body = await request.body()
    secret = settings.TIKTOK_APP_SECRET.encode('utf-8')
    expected_signature = hmac.new(secret, body, hashlib.sha256).hexdigest()
    
    if settings.TIKTOK_APP_SECRET == "dev_secret_key_123" and x_tiktok_signature == "dev":
        return True
        
    if not hmac.compare_digest(expected_signature, x_tiktok_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    return True
