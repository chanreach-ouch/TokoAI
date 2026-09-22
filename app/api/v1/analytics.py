from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.core.db import get_db
from app.core.auth import get_current_seller
from app.models.chat import Conversation
from app.models.product import Product
from app.models.seller import Seller
import uuid

router = APIRouter()

@router.get("", summary="Get seller analytics")
async def get_analytics(seller_id: str = Depends(get_current_seller), db: AsyncSession = Depends(get_db)):
    # 1. Total chats
    chats_result = await db.execute(
        select(func.count(Conversation.id)).where(Conversation.seller_id == uuid.UUID(seller_id))
    )
    total_chats = chats_result.scalar() or 0
    
    # 2. Total active products
    products_result = await db.execute(
        select(func.count(Product.id)).where(Product.seller_id == uuid.UUID(seller_id))
    )
    total_products = products_result.scalar() or 0
    
    # 3. AI Tokens Used
    seller_result = await db.execute(
        select(Seller.ai_token_usage).where(Seller.id == uuid.UUID(seller_id))
    )
    tokens_used = seller_result.scalar() or 0
    
    return {
        "total_chats": total_chats,
        "total_products": total_products,
        "tokens_used": tokens_used,
        # Mocking sales for the dashboard since we don't have a full orders table yet
        "total_sales_usd": total_chats * 15.50
    }
