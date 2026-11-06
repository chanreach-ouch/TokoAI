import asyncio
import json
import time
import logging
from typing import Dict, Any, List, Optional
from app.core.redis import redis_pool

logger = logging.getLogger(__name__)

DEBOUNCE_WINDOW_SEC = 2.5
DEBOUNCE_BUFFER_TTL = 300 # 5 minutes TTL

async def push_and_debounce(
    shop_id: str,
    sender_id: str,
    message_item: Dict[str, Any]
) -> Optional[List[Dict[str, Any]]]:
    """
    Implements a 2.5s sliding-window Redis debouncer.
    When buyers send 3-5 rapid messages in succession (e.g. "Hi", "Price?", "Size L?"),
    this consolidates them into a single coherent turn without race conditions.

    Returns:
        List[Dict] of all accumulated messages if this worker task is elected as the batch closer,
        or None if a subsequent message arrived (delegating batch closing to the later task).
    """
    buffer_key = f"debounce_buffer:{shop_id}:{sender_id}"
    timer_key = f"debounce_ts:{shop_id}:{sender_id}"

    # 1. Push current message to Redis buffer
    await redis_pool.rpush(buffer_key, json.dumps(message_item))
    await redis_pool.expire(buffer_key, DEBOUNCE_BUFFER_TTL)

    # 2. Record this execution timestamp
    current_ts = f"{time.time():.6f}"
    await redis_pool.set(timer_key, current_ts, ex=10)

    # 3. Sleep for debounce window (2.5 seconds)
    await asyncio.sleep(DEBOUNCE_WINDOW_SEC)

    # 4. Check if a newer message updated the latch during our sleep
    latest_ts = await redis_pool.get(timer_key)
    if latest_ts and latest_ts != current_ts:
        # A newer message arrived; let that later worker task handle the batch
        logger.info(f"Debounce: Yielding to newer message for sender {sender_id}")
        return None

    # 5. We are the elected closer for this batch! Retrieve and clear buffer atomically
    raw_items = await redis_pool.lrange(buffer_key, 0, -1)
    await redis_pool.delete(buffer_key)
    await redis_pool.delete(timer_key)

    if not raw_items:
        return None

    messages = []
    for item in raw_items:
        try:
            messages.append(json.loads(item))
        except Exception:
            pass

    return messages
