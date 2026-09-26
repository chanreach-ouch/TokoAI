import redis.asyncio as aioredis
from app.config import settings
from arq import create_pool
from arq.connections import RedisSettings

redis_pool = aioredis.from_url(settings.REDIS_URL, decode_responses=True)

_arq_pool = None

async def get_arq_pool():
    global _arq_pool
    if not _arq_pool:
        _arq_pool = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    return _arq_pool
