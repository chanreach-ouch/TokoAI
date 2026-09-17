import os
from arq.connections import RedisSettings
from app.worker.tasks import process_tiktok_message

class WorkerSettings:
    functions = [process_tiktok_message]
    redis_settings = RedisSettings.from_dsn(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
