from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_db
from app.core.auth import get_superadmin
from app.models.seller import Seller
import uuid

router = APIRouter()

@router.get("/sellers", summary="Get all platform sellers")
async def get_all_sellers(admin_id: str = Depends(get_superadmin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Seller).order_by(Seller.created_at.desc()))
    sellers = result.scalars().all()
    
    return [
        {
            "id": str(s.id),
            "email": s.email,
            "created_at": s.created_at,
            "is_active": s.is_active,
            "bot_tone": s.bot_tone,
            "ai_token_usage": s.ai_token_usage,
            "is_superadmin": s.is_superadmin
        } for s in sellers
    ]

@router.post("/sellers/{seller_id}/toggle-suspend", summary="Suspend or reactivate a seller")
async def toggle_suspend_seller(seller_id: str, admin_id: str = Depends(get_superadmin), db: AsyncSession = Depends(get_db)):
    # Prevent admin from suspending themselves
    if seller_id == admin_id:
        raise HTTPException(status_code=400, detail="Cannot suspend your own admin account")
        
    result = await db.execute(select(Seller).where(Seller.id == uuid.UUID(seller_id)))
    seller = result.scalar_one_or_none()
    
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
        
    seller.is_active = not seller.is_active
    await db.commit()
    
    return {
        "status": "success",
        "is_active": seller.is_active,
        "message": f"Seller account {'reactivated' if seller.is_active else 'suspended'}"
    }
