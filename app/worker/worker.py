from arq.connections import RedisSettings
from app.config import settings
from app.worker.tasks import process_tiktok_message

class WorkerSettings:
    functions = [process_tiktok_message]
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
