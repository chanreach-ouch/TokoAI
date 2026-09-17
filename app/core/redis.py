import redis.asyncio as redis
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

redis_pool = redis.ConnectionPool.from_url(REDIS_URL)
redis_client = redis.Redis(connection_pool=redis_pool)

async def get_redis():
    return redis_client
