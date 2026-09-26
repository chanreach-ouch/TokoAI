from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import uuid
from app.core.db import get_db
from app.models.order import Order
from app.models.shop import Shop
from app.core.auth import get_current_seller

router = APIRouter()

class OrderStatusUpdate(BaseModel):
    status: str

from sqlalchemy import select, func

@router.get("/", summary="List all orders for the seller's shops")
async def list_orders(
    skip: int = 0, 
    limit: int = 50,
    db: AsyncSession = Depends(get_db), 
    seller_id: str = Depends(get_current_seller)
):
    # Find all shops owned by this seller
    result = await db.execute(select(Shop).where(Shop.owner_id == uuid.UUID(seller_id)))
    shops = result.scalars().all()
    shop_ids = [s.id for s in shops]
    
    if not shop_ids:
        return {"data": [], "total": 0}
        
    # Get total count
    count_result = await db.execute(select(func.count(Order.id)).where(Order.shop_id.in_(shop_ids)))
    total = count_result.scalar()
    
    # Get paginated orders for these shops
    order_result = await db.execute(
        select(Order)
        .where(Order.shop_id.in_(shop_ids))
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    orders = order_result.scalars().all()
    
    return {"data": orders, "total": total}

@router.patch("/{order_id}", summary="Update order status")
async def update_order_status(
    order_id: int, 
    update: OrderStatusUpdate, 
    db: AsyncSession = Depends(get_db), 
    seller_id: str = Depends(get_current_seller)
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Verify ownership
    shop_result = await db.execute(select(Shop).where(Shop.id == order.shop_id))
    shop = shop_result.scalar_one_or_none()
    if not shop or str(shop.owner_id) != seller_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this order")
        
    order.status = update.status
    await db.commit()
    return {"status": "success", "message": "Order updated", "new_status": order.status}

class WaybillRequest(BaseModel):
    provider: str # "J&T" or "VET"

from app.integrations.logistics import generate_jnt_waybill, generate_vet_waybill
from app.models.user import User

@router.post("/{order_id}/waybill", summary="Generate shipping waybill")
async def generate_waybill(
    order_id: int, 
    req: WaybillRequest,
    db: AsyncSession = Depends(get_db), 
    seller_id: str = Depends(get_current_seller)
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Verify ownership
    shop_result = await db.execute(select(Shop).where(Shop.id == order.shop_id))
    shop = shop_result.scalar_one_or_none()
    if not shop or str(shop.owner_id) != seller_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this order")

    # Ensure paid
    if order.status != "PAID":
        raise HTTPException(status_code=400, detail="Cannot generate waybill for unpaid order")

    # Get customer details
    user_result = await db.execute(select(User).where(User.id == order.user_id))
    user = user_result.scalar_one_or_none()
    if not user or not user.phone_number or not user.delivery_address:
        raise HTTPException(status_code=400, detail="Customer phone or address is missing")

    if req.provider == "J&T":
        waybill = await generate_jnt_waybill(order.id, user.phone_number, user.delivery_address, order.items)
    elif req.provider == "VET":
        waybill = await generate_vet_waybill(order.id, user.phone_number, user.delivery_address, order.items)
    else:
        raise HTTPException(status_code=400, detail="Invalid provider")

    # Update order
    order.tracking_number = waybill["tracking_number"]
    order.waybill_url = waybill["waybill_url"]
    order.logistics_provider = waybill["provider"]
    order.status = "SHIPPED"
    
    await db.commit()
    return waybill
