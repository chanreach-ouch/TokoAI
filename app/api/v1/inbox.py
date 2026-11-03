from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.db import get_db
from app.core.auth import get_current_seller
from app.models.chat import Conversation, Message
import uuid

router = APIRouter()

@router.get("", summary="Get all active conversations")
async def get_conversations(seller_id: str = Depends(get_current_seller), db: AsyncSession = Depends(get_db)):
    from app.models.customer import Customer
    
    # Fetch all conversations for this seller, eagerly load their messages to get the latest one
    result = await db.execute(
        select(Conversation)
        .where(Conversation.seller_id == uuid.UUID(seller_id))
        .options(selectinload(Conversation.messages))
        .order_by(Conversation.updated_at.desc())
    )
    conversations = result.scalars().all()
    
    # Batch lookup customer CRM profiles
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
        last_message = msgs[-1].content if msgs else "No messages yet"
        cust = customers_map.get(conv.customer_platform_id)
        
        response.append({
            "id": str(conv.id),
            "customer_id": conv.customer_platform_id,
            "customer_name": cust.name if (cust and cust.name) else f"Buyer @{conv.customer_platform_id[:8]}",
            "customer_phone": cust.phone if cust else None,
            "customer_address": cust.shipping_address if cust else None,
            "customer_orders": cust.total_orders if cust else 0,
            "customer_ltv": cust.lifetime_value_usd if cust else 0.0,
            "is_human_takeover": conv.is_human_takeover,
            "last_message": last_message,
            "updated_at": conv.updated_at
        })
        
    return response

@router.get("/{conversation_id}", summary="Get full chat history for a conversation")
async def get_conversation_history(conversation_id: str, seller_id: str = Depends(get_current_seller), db: AsyncSession = Depends(get_db)):
    from app.models.customer import Customer

    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == uuid.UUID(conversation_id), Conversation.seller_id == uuid.UUID(seller_id))
        .options(selectinload(Conversation.messages))
    )
    conv = result.scalar_one_or_none()
    
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    msgs = sorted(conv.messages, key=lambda m: m.created_at)
    
    # Lookup customer profile
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
        "is_human_takeover": conv.is_human_takeover,
        "messages": [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
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
        
    # Toggle the boolean
    conv.is_human_takeover = not conv.is_human_takeover
    await db.commit()
    
    return {
        "status": "success", 
        "is_human_takeover": conv.is_human_takeover,
        "message": f"Takeover {'enabled' if conv.is_human_takeover else 'disabled'}"
    }

from pydantic import BaseModel
from fastapi import Request
from app.core.rate_limit import limiter

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
        
    # Auto-enable human takeover when sending a manual reply
    conv.is_human_takeover = True
    
    # Save the message with valid model schema (role='human_agent')
    new_message = Message(
        conversation_id=conv.id,
        role="human_agent",
        content=req.content
    )
    
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)
    
    # Outbound delivery to TikTok & Redis AI Memory Synchronization
    from app.models.shop import Shop
    from app.integrations.tiktok_client import send_message
    from app.core.redis import redis_pool
    
    try:
        shop_res = await db.execute(select(Shop).where(Shop.owner_id == uuid.UUID(seller_id)))
        shop = shop_res.scalar_one_or_none()
        if shop and conv.customer_platform_id:
            # 1. Outbound delivery to TikTok DM
            await send_message(
                recipient_id=conv.customer_platform_id,
                text=req.content,
                shop_id=str(shop.id)
            )
            
            # 2. Synchronize Redis session memory so AI context knows about the human reply
            memory_key = f"session:{shop.id}:{conv.customer_platform_id}"
            await redis_pool.lpush(memory_key, f"Agent (Staff): {req.content}")
            await redis_pool.ltrim(memory_key, 0, 5)
            await redis_pool.expire(memory_key, 3600)
    except Exception:
        # Non-blocking if TikTok access token is dev-mode or network error
        pass
    
    return {
        "status": "success", 
        "message_id": str(new_message.id),
        "is_human_takeover": conv.is_human_takeover
    }
