import json
import logging
from app.core.redis import redis_pool
from app.core.db import AsyncSessionLocal

logger = logging.getLogger(__name__)

async def process_tiktok_message(ctx, raw_payload: bytes):
    payload = json.loads(raw_payload)
    
    try:
        # Check standard layout for events
        # Often it is under 'event', but let's assume it's data for this implementation
        # Actually standard TikTok is often at root or 'message'
        message_id = payload.get("message_id")
        sender_id = payload.get("sender_id")
        recipient_id = payload.get("recipient_id")
        message_text = payload.get("text")
        
        if not message_id or not sender_id or not message_text or not recipient_id:
            logger.warning("Invalid payload structure")
            return
            
        # Deduplication using Redis SETNX (TTL: 86400)
        is_new = await redis_pool.setnx(f"msg:{message_id}", "1")
        if not is_new:
            logger.info(f"Duplicate message ignored: {message_id}")
            return
            
        await redis_pool.expire(f"msg:{message_id}", 86400)
        
        from sqlalchemy import select
        from app.models.shop import Shop
        async with AsyncSessionLocal() as session:
            stmt = select(Shop).where(Shop.tiktok_page_id == recipient_id)
            result = await session.execute(stmt)
            shop = result.scalar_one_or_none()
            
        if not shop:
            logger.error(f"Shop not found for recipient_id {recipient_id}")
            return
            
        memory_key = f"session:{shop.id}:{sender_id}"
        recent_memory = await redis_pool.lrange(memory_key, 0, 5)
        
        from app.agent.rag import run_agent
        reply = await run_agent(sender_id, shop.id, message_text, recent_memory)
        
        print(f"\n{'='*50}\n🤖 AI REPLY GENERATED:\n{reply}\n{'='*50}\n", flush=True)
        
        await redis_pool.lpush(memory_key, f"User: {message_text}")
        await redis_pool.lpush(memory_key, f"Agent: {reply}")
        await redis_pool.ltrim(memory_key, 0, 5)
        await redis_pool.expire(memory_key, 3600)
        
        from app.integrations.tiktok_client import send_message
        await send_message(sender_id, reply, shop.id)
        
    except Exception as e:
        logger.error(f"Error processing message: {e}")
