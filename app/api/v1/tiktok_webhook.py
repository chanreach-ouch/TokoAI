from fastapi import APIRouter, Request, Header, HTTPException
from app.core.security import verify_tiktok_hmac
from arq import create_pool
from arq.connections import RedisSettings
from app.config import settings

router = APIRouter()

@router.post("/webhook")
async def tiktok_webhook(
    request: Request,
    x_tiktok_signature: str = Header(None)
):
    if not x_tiktok_signature:
        raise HTTPException(status_code=401, detail="Missing signature")
        
    await verify_tiktok_hmac(request, x_tiktok_signature)
    
    body = await request.body()
    
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
    arq_pool = await create_pool(redis_settings)
    await arq_pool.enqueue_job('process_tiktok_message', body)
    
    return {"status": "ok"}
