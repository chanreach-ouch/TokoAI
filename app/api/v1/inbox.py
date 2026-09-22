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

from pydantic import BaseModel

class ReplyRequest(BaseModel):
    content: str

@router.post("/{conversation_id}/reply", summary="Send a manual human reply")
async def send_manual_reply(
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
    
    # Save the message
    new_message = Message(
        conversation_id=conv.id,
        sender_type="SELLER",
        role="assistant",
        content=req.content
    )
    
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)
    
    # Normally here you would also push this message out via TikTok API 
    # to the actual customer. For now we just log it in the DB.
    
    return {
        "status": "success", 
        "message_id": str(new_message.id),
        "is_human_takeover": conv.is_human_takeover
    }
