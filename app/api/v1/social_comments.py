import logging
import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.db import get_db, AsyncSessionLocal
from app.models.shop import Shop
from app.models.customer import Customer
from app.models.chat import Conversation, Message
from app.integrations.tiktok_client import send_message

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks/social-comments", tags=["Social Comments Lead Capture"])

PURCHASE_INTENT_KEYWORDS = [
    "tlai man", "price", "how much", "man", "chos", "discount", "stock", 
    "size", "ពណ៌", "តម្លៃ", "ប៉ុន្មាន", "កម្ម៉ង់", "order", "delivery", "ដឹក", "yok", "ទិញ"
]

class CommentWebhookPayload(BaseModel):
    shop_id: Optional[str] = None
    tiktok_page_id: Optional[str] = None
    facebook_page_id: Optional[str] = None
    post_id: str
    comment_id: str
    sender_id: str
    sender_name: Optional[str] = "Customer"
    comment_text: str
    platform: Optional[str] = "tiktok" # "tiktok" or "facebook"

@router.post("/", summary="Ingest social video/post comments and trigger comment-to-DM funnel")
async def handle_social_comment(
    payload: CommentWebhookPayload,
    db: AsyncSession = Depends(get_db)
):
    text_lower = payload.comment_text.lower().strip()
    
    # Check purchase intent
    has_intent = any(kw in text_lower for kw in PURCHASE_INTENT_KEYWORDS)
    if not has_intent:
        return {"status": "ignored", "reason": "No purchase intent detected in comment"}

    # Resolve Shop
    shop = None
    if payload.shop_id:
        shop = (await db.execute(select(Shop).where(Shop.id == uuid.UUID(payload.shop_id)))).scalar_one_or_none()
    elif payload.tiktok_page_id:
        shop = (await db.execute(select(Shop).where(Shop.tiktok_page_id == payload.tiktok_page_id))).scalar_one_or_none()
    elif payload.facebook_page_id:
        shop = (await db.execute(select(Shop).where(Shop.facebook_page_id == payload.facebook_page_id))).scalar_one_or_none()

    if not shop:
        # Fallback to first shop for simulation
        shop = (await db.execute(select(Shop))).scalars().first()

    if not shop:
        raise HTTPException(status_code=404, detail="No shop found for comment attribution")

    # 1. Generate Public Comment Reply
    public_reply = (
        f"សួស្តីបង {payload.sender_name}! អូនបានផ្ញើព័ត៌មានលម្អិត និងតម្លៃពិសេសចូលក្នុងប្រអប់សារ (DM) ជូនបងរួចរាល់ហើយណា៎បង 🥰"
    )

    # 2. Touch or create omnichannel Customer record
    c_stmt = select(Customer).where(Customer.platform_id == payload.sender_id, Customer.shop_id == shop.id)
    customer = (await db.execute(c_stmt)).scalar_one_or_none()
    if not customer:
        customer = Customer(
            shop_id=shop.id,
            platform_id=payload.sender_id,
            platform_source=payload.platform or "tiktok",
            name=payload.sender_name,
            communication_style_notes=f"Lead captured from comment: '{payload.comment_text}'"
        )
        db.add(customer)
    else:
        customer.communication_style_notes = f"Last comment: '{payload.comment_text}'"

    # 3. Create or find conversation thread
    conv_stmt = select(Conversation).where(
        Conversation.seller_id == shop.owner_id,
        Conversation.customer_platform_id == payload.sender_id
    )
    conv = (await db.execute(conv_stmt)).scalar_one_or_none()
    if not conv:
        conv = Conversation(
            seller_id=shop.owner_id,
            customer_platform_id=payload.sender_id,
            is_human_takeover=False
        )
        db.add(conv)
        await db.flush()

    # 4. Craft high-converting private DM hook
    private_dm_text = (
        f"សួស្តីបង {payload.sender_name}! ឃើញបងបានសួរនាំលើវីដេអូ/ផុសរបស់យើង 🥰 "
        f"ម៉ូដនេះខាងអូនមានក្នុងស្តុកស្រាប់ណា៎បង។ តើបងចាប់អារម្មណ៍ Size ឬពណ៌មួយណាដែរចា៎?"
    )

    # Persist lead hook in chat history
    db.add(Message(conversation_id=conv.id, role="user", content=f"[Public Comment]: {payload.comment_text}"))
    db.add(Message(conversation_id=conv.id, role="ai", content=private_dm_text))
    await db.commit()

    # 5. Outbound delivery to TikTok/FB DM
    try:
        await send_message(payload.sender_id, private_dm_text, shop.id)
    except Exception as e:
        logger.warning(f"Failed to send automated DM: {e}")

    return {
        "status": "captured",
        "public_reply": public_reply,
        "private_dm": private_dm_text,
        "customer_id": str(customer.id),
        "conversation_id": str(conv.id)
    }
