from fastapi import APIRouter, Request, Header, HTTPException, Body
from app.core.security import verify_tiktok_hmac
from arq import create_pool
from arq.connections import RedisSettings
from app.config import settings

router = APIRouter()

@router.post("/webhook")
async def tiktok_webhook(
    request: Request,
    x_tiktok_signature: str = Header(None),
    payload: dict = Body(None, description="The JSON payload from TikTok")
):
    if not x_tiktok_signature:
        raise HTTPException(status_code=401, detail="Missing signature")
        
    await verify_tiktok_hmac(request, x_tiktok_signature)
    
    body = await request.body()
    
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
    arq_pool = await create_pool(redis_settings)
    await arq_pool.enqueue_job('process_tiktok_message', body)
    
    return {"status": "ok"}

from pydantic import BaseModel
import uuid
from app.agent.rag import run_agent
from app.core.redis import redis_pool

class TestChatRequest(BaseModel):
    shop_id: uuid.UUID
    sender_id: str = "test_buyer_123"
    text: str

@router.post("/test-chat", summary="Test the AI Chatbot directly in Swagger")
async def test_chat(req: TestChatRequest):
    """
    This endpoint is explicitly for developer testing in Swagger UI.
    It runs synchronously and returns the AI's generated text directly in the HTTP response.
    """
    # Fetch chat history from Redis
    memory_key = f"session:{req.shop_id}:{req.sender_id}"
    recent_memory = await redis_pool.lrange(memory_key, 0, 5)
    
    # Run the AI agent directly (FastAPI will wait for this to finish)
    reply = await run_agent(req.sender_id, str(req.shop_id), req.text, recent_memory)
    
    # Save the new messages to memory
    await redis_pool.lpush(memory_key, f"User: {req.text}")
    await redis_pool.lpush(memory_key, f"Agent: {reply}")
    await redis_pool.ltrim(memory_key, 0, 5)
    await redis_pool.expire(memory_key, 3600)
    
    return {
        "status": "success", 
        "reply": reply
    }
