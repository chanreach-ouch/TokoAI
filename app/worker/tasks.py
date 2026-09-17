import logging
from app.core.redis import get_redis

logger = logging.getLogger(__name__)

async def process_tiktok_message(ctx, message_id: str, payload: dict):
    redis = await get_redis()
    
    is_new = await redis.setnx(f"msg:{message_id}", "1")
    if not is_new:
        logger.info(f"Duplicate message ignored: {message_id}")
        return "duplicate"
    
    await redis.expire(f"msg:{message_id}", 86400)
    
    # Agent processing will be called here
    logger.info(f"Processing new message: {message_id}")
    
    return "processed"
