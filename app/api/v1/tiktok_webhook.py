from fastapi import APIRouter, Request, HTTPException
from app.core.security import verify_tiktok_signature
from arq import create_pool
from arq.connections import RedisSettings
import os
import json

router = APIRouter()

async def get_arq_pool():
    redis_settings = RedisSettings.from_dsn(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
    return await create_pool(redis_settings)

@router.post("/webhook")
async def tiktok_webhook(request: Request):
    signature = request.headers.get("X-TikTok-Signature")
    body = await request.body()
    
    if not verify_tiktok_signature(signature, body):
        raise HTTPException(status_code=401, detail="Invalid signature")
        
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    message_id = payload.get("message_id", "unknown")
    
    pool = await get_arq_pool()
    await pool.enqueue_job("process_tiktok_message", message_id, payload)
    
    return {"status": "ok"}
