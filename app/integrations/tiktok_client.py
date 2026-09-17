import httpx
import os
import logging
import asyncio

logger = logging.getLogger(__name__)
TIKTOK_ACCESS_TOKEN = os.getenv("TIKTOK_ACCESS_TOKEN", "dummy_token")

async def send_tiktok_dm(recipient_id: str, text: str, image_url: str = None, retries: int = 3):
    url = "https://business-api.tiktok.com/open_api/v1.3/message/send/"
    headers = {
        "Access-Token": TIKTOK_ACCESS_TOKEN,
        "Content-Type": "application/json"
    }
    
    payload = {
        "recipient_id": recipient_id,
        "message": {
            "text": text
        }
    }
    
    if image_url:
        payload["message"]["image_url"] = image_url

    async with httpx.AsyncClient() as client:
        for attempt in range(retries):
            try:
                response = await client.post(url, json=payload, headers=headers, timeout=10.0)
                response.raise_for_status()
                logger.info(f"Message sent to {recipient_id}")
                return response.json()
            except httpx.HTTPError as e:
                logger.warning(f"TikTok API error (attempt {attempt+1}/{retries}): {e}")
                if attempt == retries - 1:
                    logger.error(f"Failed to send message to {recipient_id} after {retries} attempts.")
                    raise
                await asyncio.sleep(2 ** attempt)
