from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.core.db import get_db
from app.core.auth import get_current_seller
from app.models.chat import Conversation
from app.models.product import Product
from app.models.seller import Seller
import uuid

from app.models.shop import Shop
from app.models.order import Order
from app.models.customer import Customer

router = APIRouter()

@router.get("", summary="Get seller analytics")
async def get_analytics(seller_id: str = Depends(get_current_seller), db: AsyncSession = Depends(get_db)):
    seller_uuid = uuid.UUID(seller_id)
    
    # 1. Total chats
    chats_result = await db.execute(
        select(func.count(Conversation.id)).where(Conversation.seller_id == seller_uuid)
    )
    total_chats = chats_result.scalar() or 0
    
    # 2. Total active products
    products_result = await db.execute(
        select(func.count(Product.id)).where(Product.seller_id == seller_uuid)
    )
    total_products = products_result.scalar() or 0
    
    # 3. AI Tokens Used
    seller_result = await db.execute(
        select(Seller.ai_token_usage).where(Seller.id == seller_uuid)
    )
    tokens_used = seller_result.scalar() or 0

    # 4. Total Sales and Orders from Real Orders
    shop_res = await db.execute(select(Shop.id).where(Shop.owner_id == seller_uuid))
    shop_ids = shop_res.scalars().all()
    
    total_sales_usd = 0.0
    paid_orders_count = 0
    total_orders_count = 0
    total_customers_count = 0
    
    if shop_ids:
        # Sum completed/paid/shipped orders
        sales_stmt = select(
            func.coalesce(func.sum(Order.total_amount_usd), 0.0),
            func.count(Order.id)
        ).where(
            Order.shop_id.in_(shop_ids),
            Order.status.in_(["PAID", "SHIPPED", "CONFIRMED"])
        )
        sales_res = await db.execute(sales_stmt)
        sales_row = sales_res.first()
        if sales_row:
            total_sales_usd = float(sales_row[0])
            paid_orders_count = int(sales_row[1])

        # Total all orders
        all_orders_stmt = select(func.count(Order.id)).where(Order.shop_id.in_(shop_ids))
        total_orders_count = (await db.execute(all_orders_stmt)).scalar() or 0

        # Customer CRM count
        cust_stmt = select(func.count(Customer.id)).where(Customer.shop_id.in_(shop_ids))
        total_customers_count = (await db.execute(cust_stmt)).scalar() or 0

    conversion_rate = round((paid_orders_count / total_chats * 100), 1) if total_chats > 0 else 0.0
    total_sales_khr = int(total_sales_usd * 4100)
    
    return {
        "total_chats": total_chats,
        "total_products": total_products,
        "tokens_used": tokens_used,
        "total_sales_usd": total_sales_usd,
        "total_sales_khr": total_sales_khr,
        "paid_orders": paid_orders_count,
        "total_orders": total_orders_count,
        "total_customers": total_customers_count,
        "conversion_rate_pct": conversion_rate
    }
