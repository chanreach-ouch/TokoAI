from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.db import get_db
from app.core.auth import get_current_owner
from app.models.seller import Seller
import uuid

router = APIRouter()

class SettingsUpdate(BaseModel):
    bot_tone: str
    is_active: bool

@router.get("", summary="Get seller settings")
async def get_settings(seller_id: str = Depends(get_current_owner), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Seller).where(Seller.id == uuid.UUID(seller_id)))
    seller = result.scalar_one_or_none()
    
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
        
    return {
        "bot_tone": seller.bot_tone,
        "is_active": seller.is_active,
        "ai_token_usage": seller.ai_token_usage,
        "ai_message_limit": seller.ai_message_limit,
        "subscription_tier": seller.subscription_tier
    }

@router.post("", summary="Update seller settings")
async def update_settings(req: SettingsUpdate, seller_id: str = Depends(get_current_owner), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Seller).where(Seller.id == uuid.UUID(seller_id)))
    seller = result.scalar_one_or_none()
    
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
        
    seller.bot_tone = req.bot_tone
    seller.is_active = req.is_active
    await db.commit()
    
    return {"status": "success", "message": "Settings updated successfully"}

class SimulationRequest(BaseModel):
    message: str
    bot_tone: str | None = None

from app.agent.rag import generate_agent_reply
from app.models.shop import Shop

@router.post("/simulate", summary="Simulate agent reply for testing")
async def simulate_reply(
    req: SimulationRequest,
    seller_id: str = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db)
):
    # Find shop for this seller
    shop_res = await db.execute(select(Shop).where(Shop.owner_id == uuid.UUID(seller_id)))
    shop = shop_res.scalars().first()
    shop_id = str(shop.id) if shop else "00000000-0000-0000-0000-000000000000"
    
    reply = await generate_agent_reply(
        message_text=req.message,
        session=db,
        shop_id=shop_id,
        sender_id=f"sim-{seller_id[:8]}"
    )
    
    return {
        "reply": reply,
        "shop_id": shop_id,
        "input": req.message
    }
