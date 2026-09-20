import httpx
import logging
from app.config import settings

logger = logging.getLogger(__name__)

from app.core.db import AsyncSessionLocal
from app.models.shop import Shop
from sqlalchemy import select

async def send_message(recipient_id: str, text: str, shop_id: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Shop).where(Shop.id == shop_id))
        shop = result.scalar_one_or_none()
        
    if not shop or not shop.tiktok_access_token:
        # Fallback to dev env token if shop has none (for testing)
        token = settings.TIKTOK_ACCESS_TOKEN if getattr(settings, 'TIKTOK_ACCESS_TOKEN', None) else None
        if not token:
            logger.warning(f"No access token found for shop {shop_id}. Cannot send message.")
            return
    else:
        token = shop.tiktok_access_token

    url = "https://open.tiktokapis.com/v2/business/message/send/"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "recipient_id": recipient_id,
        "message": {
            "text": text
        }
    }
    
    async with httpx.AsyncClient() as client:
        try:
            # We don't want to crash if TikTok is invalid during testing
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code != 200:
                logger.warning(f"Failed to send TikTok message: {response.text}")
            else:
                logger.info(f"Message sent to {recipient_id}")
        except Exception as e:
            logger.error(f"Error sending message: {e}")
