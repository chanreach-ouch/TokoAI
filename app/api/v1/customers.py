from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.core.db import get_db
from app.core.auth import get_current_seller
from app.models.customer import Customer
from app.models.shop import Shop
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/seller/customers", tags=["Customers"])

def detect_carrier(phone: str | None) -> str:
    if not phone:
        return "Local"
    clean = phone.replace(" ", "").replace("-", "")
    if clean.startswith("+855"):
        clean = "0" + clean[4:]
    
    smart_prefixes = ("010", "015", "016", "069", "070", "081", "086", "087", "093", "096", "098")
    cellcard_prefixes = ("011", "012", "014", "017", "061", "076", "077", "078", "079", "085", "089", "092")
    metfone_prefixes = ("060", "066", "067", "068", "071", "088", "090", "097")
    
    for p in smart_prefixes:
        if clean.startswith(p):
            return "Smart"
    for p in cellcard_prefixes:
        if clean.startswith(p):
            return "Cellcard"
    for p in metfone_prefixes:
        if clean.startswith(p):
            return "Metfone"
            
    return "Cellcard"

@router.get("", summary="List all customers for the authenticated seller's shop")
async def get_customers(
    q: str = Query(None, description="Search query by name or phone"),
    seller_id: str = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db)
):
    # Find all shops belonging to this seller
    shop_res = await db.execute(select(Shop.id).where(Shop.owner_id == uuid.UUID(seller_id)))
    shop_ids = shop_res.scalars().all()
    
    if not shop_ids:
        return []
        
    query = select(Customer).where(Customer.shop_id.in_(shop_ids))
    if q and q.strip():
        search_pattern = f"%{q.strip()}%"
        query = query.where(
            or_(
                Customer.name.ilike(search_pattern),
                Customer.phone.ilike(search_pattern),
                Customer.platform_id.ilike(search_pattern),
                Customer.shipping_address.ilike(search_pattern)
            )
        )
        
    query = query.order_by(Customer.last_active_at.desc())
    result = await db.execute(query)
    customers = result.scalars().all()
    
    now = datetime.now(timezone.utc)
    
    records = []
    for c in customers:
        # Calculate humanized last active
        diff = now - c.last_active_at if c.last_active_at else None
        if diff:
            if diff.days > 0:
                last_active_str = f"{diff.days}d ago"
            elif diff.seconds >= 3600:
                last_active_str = f"{diff.seconds // 3600}h ago"
            elif diff.seconds >= 60:
                last_active_str = f"{diff.seconds // 60}m ago"
            else:
                last_active_str = "just now"
        else:
            last_active_str = "recent"
            
        ltv = float(c.lifetime_value_usd or 0.0)
        orders_count = int(c.total_orders or 0)
        is_vip = orders_count >= 5 or ltv >= 100.0
        
        records.append({
            "id": str(c.id),
            "name": c.name or f"Customer {c.platform_id[-4:]}",
            "phone": c.phone or "N/A",
            "carrier": detect_carrier(c.phone),
            "landmark": c.shipping_address or "Phnom Penh",
            "platform": "TikTok Shop" if c.platform_source == "tiktok" else c.platform_source.capitalize(),
            "orders": orders_count,
            "ltv": ltv,
            "lastActive": last_active_str,
            "isVIP": is_vip
        })
        
    return records
