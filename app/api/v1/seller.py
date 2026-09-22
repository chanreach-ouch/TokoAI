import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.models.shop import Shop
from app.core.auth import get_current_seller
from pydantic import BaseModel

router = APIRouter()

class ShopCreate(BaseModel):
    tiktok_page_id: str
    name: str
    bakong_merchant_id: str | None = None
    tiktok_access_token: str | None = None

@router.post("/shop", summary="Create or update shop")
async def create_or_update_shop(
    shop: ShopCreate, 
    db: AsyncSession = Depends(get_db),
    seller_id: str = Depends(get_current_seller)
):
    from sqlalchemy import select
    try:
        # Check if shop exists
        result = await db.execute(select(Shop).where(Shop.tiktok_page_id == shop.tiktok_page_id))
        existing_shop = result.scalar_one_or_none()
        
        if existing_shop:
            if str(existing_shop.owner_id) != seller_id and existing_shop.owner_id is not None:
                raise HTTPException(status_code=403, detail="Shop belongs to another user")
                
            existing_shop.name = shop.name
            existing_shop.owner_id = uuid.UUID(seller_id)
            if shop.bakong_merchant_id:
                existing_shop.bakong_merchant_id = shop.bakong_merchant_id
            if shop.tiktok_access_token:
                existing_shop.tiktok_access_token = shop.tiktok_access_token
            await db.commit()
            return {"status": "success", "message": "Shop updated", "shop_id": existing_shop.id}
            
        new_shop = Shop(
            tiktok_page_id=shop.tiktok_page_id,
            owner_id=uuid.UUID(seller_id),
            name=shop.name,
            bakong_merchant_id=shop.bakong_merchant_id,
            tiktok_access_token=shop.tiktok_access_token
        )
        db.add(new_shop)
        await db.commit()
        await db.refresh(new_shop)
        return {"status": "success", "message": "Shop created", "shop_id": new_shop.id}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
