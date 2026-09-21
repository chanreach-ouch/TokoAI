from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.db import get_db
from app.core.auth import get_current_seller
from app.models.seller import Seller
import uuid

router = APIRouter()

class SettingsUpdate(BaseModel):
    bot_tone: str
    is_active: bool

@router.get("", summary="Get seller settings")
async def get_settings(seller_id: str = Depends(get_current_seller), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Seller).where(Seller.id == uuid.UUID(seller_id)))
    seller = result.scalar_one_or_none()
    
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
        
    return {
        "bot_tone": seller.bot_tone,
        "is_active": seller.is_active,
        "ai_token_usage": seller.ai_token_usage
    }

@router.post("", summary="Update seller settings")
async def update_settings(req: SettingsUpdate, seller_id: str = Depends(get_current_seller), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Seller).where(Seller.id == uuid.UUID(seller_id)))
    seller = result.scalar_one_or_none()
    
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
        
    seller.bot_tone = req.bot_tone
    seller.is_active = req.is_active
    await db.commit()
    
    return {"status": "success", "message": "Settings updated successfully"}
