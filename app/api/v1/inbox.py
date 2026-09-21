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
    # Fetch all conversations for this seller, eagerly load their messages to get the latest one
    result = await db.execute(
        select(Conversation)
        .where(Conversation.seller_id == uuid.UUID(seller_id))
        .options(selectinload(Conversation.messages))
        .order_by(Conversation.updated_at.desc())
    )
    conversations = result.scalars().all()
    
    response = []
    for conv in conversations:
        # Sort messages safely assuming there might be none
        msgs = sorted(conv.messages, key=lambda m: m.created_at)
        last_message = msgs[-1].content if msgs else "No messages yet"
        
        response.append({
            "id": str(conv.id),
            "customer_id": conv.customer_platform_id,
            "is_human_takeover": conv.is_human_takeover,
            "last_message": last_message,
            "updated_at": conv.updated_at
        })
        
    return response

@router.get("/{conversation_id}", summary="Get full chat history for a conversation")
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
    
    return {
        "id": str(conv.id),
        "customer_id": conv.customer_platform_id,
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
