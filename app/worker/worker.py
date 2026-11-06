from arq.connections import RedisSettings
from arq.cron import cron
from app.config import settings
from app.worker.tasks import process_tiktok_message, abandoned_cart_followup, abandoned_bargain_followup

class WorkerSettings:
    functions = [process_tiktok_message]
    cron_jobs = [
        cron(abandoned_cart_followup, minute=0), # Runs every hour at minute 0
        cron(abandoned_bargain_followup, minute={15, 45}) # Runs every 30 minutes to win back bargained leads
    ]
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
