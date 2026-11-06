from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timezone, timedelta
from app.core.db import get_db
from app.core.auth import get_current_seller
from app.models.chat import Conversation
from app.models.product import Product
from app.models.seller import Seller
from app.models.shop import Shop
from app.models.order import Order
from app.models.customer import Customer
import uuid

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

@router.get("/business-intelligence", summary="Predictive BI, SKU velocity, stockout forecast & automated P&L COGS")
async def get_business_intelligence(
    seller_id: str = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db)
):
    seller_uuid = uuid.UUID(seller_id)
    
    # 1. Fetch seller's shops
    shop_res = await db.execute(select(Shop).where(Shop.owner_id == seller_uuid))
    shops = shop_res.scalars().all()
    shop_ids = [s.id for s in shops]
    
    if not shop_ids:
        return {
            "products_forecast": [],
            "pnl_summary": {
                "gross_revenue_usd": 0.0,
                "total_cogs_usd": 0.0,
                "gross_profit_usd": 0.0,
                "gross_margin_pct": 0.0
            },
            "critical_stockouts_count": 0,
            "drop_off_metrics": {"cart_abandoned": 0, "payment_pending": 0, "bargain_exit": 0}
        }
        
    # 2. Fetch all products for seller
    p_stmt = select(Product).where(Product.seller_id == seller_uuid)
    p_res = await db.execute(p_stmt)
    products = p_res.scalars().all()
    
    # 3. Fetch past 30 days orders
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    ord_stmt = select(Order).where(
        Order.shop_id.in_(shop_ids),
        Order.created_at >= thirty_days_ago
    )
    ord_res = await db.execute(ord_stmt)
    recent_orders = ord_res.scalars().all()
    
    # Calculate SKU sales velocity
    sales_count_7d = {}
    sales_count_30d = {}
    
    gross_revenue = 0.0
    total_cogs = 0.0
    pending_count = 0
    abandoned_count = 0
    
    for o in recent_orders:
        is_paid = o.status in ("PAID", "SHIPPED", "CONFIRMED")
        if o.status == "PENDING":
            pending_count += 1
        elif o.status in ("CANCELLED", "PENDING_FOLLOWED_UP"):
            abandoned_count += 1
            
        if is_paid:
            gross_revenue += float(o.total_amount_usd or 0.0)
            
        if o.items and isinstance(o.items, dict):
            sku = o.items.get("sku") or "unknown"
            qty = int(o.items.get("qty", 1))
            
            if is_paid:
                sales_count_30d[sku] = sales_count_30d.get(sku, 0) + qty
                if o.created_at and o.created_at >= seven_days_ago:
                    sales_count_7d[sku] = sales_count_7d.get(sku, 0) + qty
                    
    # Build per-product predictive intelligence
    forecasts = []
    critical_count = 0
    
    for p in products:
        sku = p.sku or str(p.id)[:8]
        qty_7d = sales_count_7d.get(sku, 0)
        daily_velocity = round(qty_7d / 7.0, 2)
        
        current_stock = int(p.stock or 0)
        unit_price = float(p.price or 0.0)
        cost_price = float(p.cost_price_usd or (unit_price * 0.55)) # default 55% COGS if unconfigured
        
        # Calculate P&L attribution
        units_sold_30d = sales_count_30d.get(sku, 0)
        total_cogs += (cost_price * units_sold_30d)
        
        # Days until stockout
        if current_stock == 0:
            days_until_stockout = 0.0
            status = "OUT_OF_STOCK"
            critical_count += 1
        elif daily_velocity > 0:
            days_until_stockout = round(current_stock / daily_velocity, 1)
            if days_until_stockout <= 5.0:
                status = "CRITICAL_RESTOCK"
                critical_count += 1
            elif days_until_stockout <= 10.0:
                status = "LOW_STOCK"
            else:
                status = "HEALTHY"
        else:
            days_until_stockout = 99.0
            status = "LOW_VELOCITY" if current_stock > 20 else "HEALTHY"
            
        recommended_reorder = max(p.reorder_threshold or 10, int(daily_velocity * 14)) if status in ("CRITICAL_RESTOCK", "OUT_OF_STOCK") else 0
        
        forecasts.append({
            "product_id": str(p.id),
            "sku": sku,
            "name": p.name,
            "current_stock": current_stock,
            "retail_price_usd": unit_price,
            "cost_price_usd": cost_price,
            "min_negotiation_price": p.min_negotiation_price or unit_price,
            "unit_margin_usd": round(unit_price - cost_price, 2),
            "unit_margin_pct": round(((unit_price - cost_price) / unit_price * 100), 1) if unit_price > 0 else 0.0,
            "daily_velocity": daily_velocity,
            "units_sold_30d": units_sold_30d,
            "days_until_stockout": days_until_stockout,
            "stock_status": status,
            "recommended_reorder_qty": recommended_reorder
        })
        
    # Sort forecasts: Critical stockouts first, then highest velocity
    forecasts.sort(key=lambda x: (0 if x["stock_status"] in ("CRITICAL_RESTOCK", "OUT_OF_STOCK") else 1, -x["daily_velocity"]))
    
    gross_profit = gross_revenue - total_cogs
    gross_margin_pct = round((gross_profit / gross_revenue * 100), 1) if gross_revenue > 0 else 0.0
    
    # Drop-off analysis from conversations
    conv_stmt = select(func.count(Conversation.id)).where(
        Conversation.seller_id == seller_uuid,
        Conversation.last_bargain_at != None
    )
    bargain_exit_count = (await db.execute(conv_stmt)).scalar() or 0
    
    return {
        "products_forecast": forecasts,
        "pnl_summary": {
            "gross_revenue_usd": round(gross_revenue, 2),
            "gross_revenue_khr": int(gross_revenue * 4100),
            "total_cogs_usd": round(total_cogs, 2),
            "gross_profit_usd": round(gross_profit, 2),
            "gross_margin_pct": gross_margin_pct
        },
        "critical_stockouts_count": critical_count,
        "drop_off_metrics": {
            "cart_abandoned": abandoned_count,
            "payment_pending": pending_count,
            "bargain_exit": bargain_exit_count
        }
    }
