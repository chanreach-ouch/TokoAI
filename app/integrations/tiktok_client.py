import httpx
import logging
from app.config import settings

logger = logging.getLogger(__name__)

async def send_message(recipient_id: str, text: str):
    url = "https://open.tiktokapis.com/v2/business/message/send/"
    headers = {
        "Authorization": f"Bearer {settings.TIKTOK_ACCESS_TOKEN}",
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
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            logger.info(f"Message sent to {recipient_id}")
        except httpx.HTTPStatusError as exc:
            logger.error(f"Failed to send message: {exc.response.text}")
        except Exception as e:
            logger.error(f"Error sending message: {e}")
