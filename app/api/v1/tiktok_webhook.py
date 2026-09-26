from fastapi import APIRouter, Request, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.db import get_db
from app.services.gemini import generate_chat_reply, embed_query
import uuid
import hmac
import hashlib
import os
from app.core.rate_limit import limiter

router = APIRouter(prefix="/webhooks/tiktok", tags=["Webhooks"])

@router.post("/")
@limiter.limit("30/minute")
async def tiktok_webhook(
    request: Request, 
    db: AsyncSession = Depends(get_db),
    x_tiktok_signature: str = Header(None)
):
    """
    Receives incoming DMs from TikTok.
    Flow: 
    1. Parse text/image
    2. Vector search DB for products (HNSW indexed)
    3. Feed to Gemini Multimodal RAG
    4. Save response to DB and return to TikTok
    """
    payload_body = await request.body()
    
    # Security: Verify HMAC Signature from TikTok
    secret = os.getenv("TIKTOK_APP_SECRET", "default_secret").encode("utf-8")
    expected_signature = hmac.new(secret, payload_body, hashlib.sha256).hexdigest()
    
    # In production, enforce strict checking. For testing, we allow missing signatures if secret is default
    if os.getenv("TIKTOK_APP_SECRET"):
        if not x_tiktok_signature or not hmac.compare_digest(expected_signature, x_tiktok_signature):
            raise HTTPException(status_code=401, detail="Invalid Webhook Signature")

    from app.core.redis import get_arq_pool
    arq_pool = await get_arq_pool()
    await arq_pool.enqueue_job("process_tiktok_message", payload_body)
    
    return {"status": "success", "message": "Enqueued"}
