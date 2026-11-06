from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
import uuid

from app.core.db import get_db
from app.core.auth import get_current_seller
from app.core.rate_limit import limiter
from app.models.chat import Conversation, Message
from app.models.customer import Customer
from app.models.shop import Shop
from app.integrations.tiktok_client import send_message
from app.core.redis import redis_pool

router = APIRouter()

@router.get("", summary="Get all active conversations with telemetry & escalation badges")
async def get_conversations(seller_id: str = Depends(get_current_seller), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.seller_id == uuid.UUID(seller_id))
        .options(selectinload(Conversation.messages))
        .order_by(Conversation.updated_at.desc())
    )
    conversations = result.scalars().all()
    
    customer_ids = [c.customer_platform_id for c in conversations]
    customers_map = {}
    if customer_ids:
        c_stmt = select(Customer).where(Customer.platform_id.in_(customer_ids))
        c_res = await db.execute(c_stmt)
        for cust in c_res.scalars().all():
            customers_map[cust.platform_id] = cust
    
    response = []
    for conv in conversations:
        msgs = sorted(conv.messages, key=lambda m: m.created_at)
        last_msg_obj = msgs[-1] if msgs else None
        last_message = last_msg_obj.content if last_msg_obj else "No messages yet"
        last_media_type = last_msg_obj.media_type if last_msg_obj else "text"
        
        cust = customers_map.get(conv.customer_platform_id)
        
        response.append({
            "id": str(conv.id),
            "customer_id": conv.customer_platform_id,
            "customer_name": cust.name if (cust and cust.name) else f"Buyer @{conv.customer_platform_id[:8]}",
            "customer_phone": cust.phone if cust else None,
            "customer_address": cust.shipping_address if cust else None,
            "customer_orders": cust.total_orders if cust else 0,
            "customer_ltv": cust.lifetime_value_usd if cust else 0.0,
            "buyer_tier": cust.buyer_tier if cust else "NEW",
            "communication_style_notes": cust.communication_style_notes if cust else None,
            "is_human_takeover": conv.is_human_takeover,
            "takeover_reason": conv.takeover_reason,
            "last_bargain_at": conv.last_bargain_at,
            "bargain_offered_price": conv.bargain_offered_price,
            "last_message": last_message,
            "last_media_type": last_media_type,
            "updated_at": conv.updated_at
        })
        
    return response

@router.get("/{conversation_id}", summary="Get full chat history with voice audio notes and buyer telemetry")
async def get_conversation_history(conversation_id: str, seller_id: str = Depends(get_current_seller), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == uuid.UUID(conversation_id), Conversation.seller_id == uuid.UUID(seller_id))
        .options(selectinload(Conversation.messages))
    )
    conv = result.scalar_one_or_none()
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    msgs = sorted(conv.messages, key=lambda m: m.created_at)
    
    c_stmt = select(Customer).where(Customer.platform_id == conv.customer_platform_id)
    c_res = await db.execute(c_stmt)
    cust = c_res.scalars().first()
    
    return {
        "id": str(conv.id),
        "customer_id": conv.customer_platform_id,
        "customer_name": cust.name if (cust and cust.name) else f"Buyer @{conv.customer_platform_id[:8]}",
        "customer_phone": cust.phone if cust else None,
        "customer_address": cust.shipping_address if cust else None,
        "customer_orders": cust.total_orders if cust else 0,
        "customer_ltv": cust.lifetime_value_usd if cust else 0.0,
        "buyer_tier": cust.buyer_tier if cust else "NEW",
        "communication_style_notes": cust.communication_style_notes if cust else None,
        "preferred_sizes_variants": cust.preferred_sizes_variants if cust else {},
        "last_purchased_skus": cust.last_purchased_skus if cust else [],
        "is_human_takeover": conv.is_human_takeover,
        "takeover_reason": conv.takeover_reason,
        "last_bargain_at": conv.last_bargain_at,
        "bargain_offered_price": conv.bargain_offered_price,
        "messages": [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "media_type": getattr(m, "media_type", "text") or "text",
                "media_url": getattr(m, "media_url", None),
                "audio_duration_sec": getattr(m, "audio_duration_sec", None),
                "transcription": getattr(m, "transcription", None),
                "created_at": m.created_at
            } for m in msgs
        ]
    }

@router.post("/{conversation_id}/takeover", summary="Toggle human takeover for a conversation")
async def toggle_takeover(conversation_id: str, seller_id: str = Depends(get_current_seller), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == uuid.UUID(conversation_id), Conversation.seller_id == uuid.UUID(seller_id))
    )
    conv = result.scalar_one_or_none()
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    conv.is_human_takeover = not conv.is_human_takeover
    if not conv.is_human_takeover:
        conv.takeover_reason = None # Clear reason when returning to AI auto-pilot
    else:
        conv.takeover_reason = "MANUAL_TAKEOVER"
        
    await db.commit()
    
    return {
        "status": "success", 
        "is_human_takeover": conv.is_human_takeover,
        "takeover_reason": conv.takeover_reason,
        "message": f"Takeover {'enabled' if conv.is_human_takeover else 'disabled'}"
    }

class ReplyRequest(BaseModel):
    content: str

@router.post("/{conversation_id}/reply", summary="Send a manual human reply")
@limiter.limit("20/minute")
async def send_manual_reply(
    request: Request,
    conversation_id: str, 
    req: ReplyRequest,
    seller_id: str = Depends(get_current_seller), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == uuid.UUID(conversation_id), Conversation.seller_id == uuid.UUID(seller_id))
    )
    conv = result.scalar_one_or_none()
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    conv.is_human_takeover = True
    conv.takeover_reason = "MANUAL_TAKEOVER"
    
    new_message = Message(
        conversation_id=conv.id,
        role="human_agent",
        content=req.content,
        media_type="text"
    )
    
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)
    
    try:
        shop_res = await db.execute(select(Shop).where(Shop.owner_id == uuid.UUID(seller_id)))
        shop = shop_res.scalar_one_or_none()
        if shop and conv.customer_platform_id:
            await send_message(
                recipient_id=conv.customer_platform_id,
                text=req.content,
                shop_id=str(shop.id)
            )
            
            memory_key = f"session:{shop.id}:{conv.customer_platform_id}"
            await redis_pool.lpush(memory_key, f"Agent (Staff): {req.content}")
            await redis_pool.ltrim(memory_key, 0, 5)
            await redis_pool.expire(memory_key, 3600)
    except Exception:
        pass
    
    return {
        "status": "success", 
        "message_id": str(new_message.id),
        "is_human_takeover": conv.is_human_takeover
    }
