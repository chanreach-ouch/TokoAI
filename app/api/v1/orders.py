from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from pydantic import BaseModel
import uuid
from app.core.db import get_db
from app.models.order import Order
from app.models.shop import Shop
from app.models.product import Product
from app.models.user import User
from app.core.auth import get_current_seller
from app.integrations.logistics import generate_jnt_waybill, generate_vet_waybill

router = APIRouter()

class OrderStatusUpdate(BaseModel):
    status: str

@router.get("/", summary="List all orders for the seller's shops")
async def list_orders(
    skip: int = 0, 
    limit: int = 50,
    db: AsyncSession = Depends(get_db), 
    seller_id: str = Depends(get_current_seller)
):
    result = await db.execute(select(Shop).where(Shop.owner_id == uuid.UUID(seller_id)))
    shops = result.scalars().all()
    shop_ids = [s.id for s in shops]
    
    if not shop_ids:
        return {"data": [], "total": 0}
        
    count_result = await db.execute(select(func.count(Order.id)).where(Order.shop_id.in_(shop_ids)))
    total = count_result.scalar()
    
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
        
    old_status = order.status
    order.status = update.status
    
    # Automatic Inventory Stock Restoration if Order is Cancelled
    if update.status == "CANCELLED" and old_status != "CANCELLED":
        if order.items and isinstance(order.items, dict):
            sku = order.items.get("sku")
            qty = int(order.items.get("qty", 1))
            size = order.items.get("size")
            color = order.items.get("color")
            
            p_stmt = select(Product).where(
                Product.seller_id == shop.owner_id,
                or_(
                    Product.sku == sku,
                    Product.name == order.items.get("name")
                )
            )
            p_res = await db.execute(p_stmt)
            prod = p_res.scalars().first()
            if prod:
                prod.stock = int(prod.stock) + qty
                if prod.variants and isinstance(prod.variants, list):
                    updated_variants = []
                    for v in prod.variants:
                        if isinstance(v, dict):
                            match_s = not size or str(v.get("size", "")).strip().lower() == str(size).strip().lower()
                            match_c = not color or str(v.get("color", "")).strip().lower() == str(color).strip().lower()
                            if match_s and match_c:
                                v["stock"] = int(v.get("stock", 0)) + qty
                            updated_variants.append(v)
                    prod.variants = updated_variants
                    
    await db.commit()
    return {"status": "success", "message": "Order updated", "new_status": order.status}

class WaybillRequest(BaseModel):
    provider: str # "J&T" or "VET"

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
        
    shop_result = await db.execute(select(Shop).where(Shop.id == order.shop_id))
    shop = shop_result.scalar_one_or_none()
    if not shop or str(shop.owner_id) != seller_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this order")

    if order.status not in ["PAID", "CONFIRMED", "COD"]:
        raise HTTPException(status_code=400, detail="Cannot generate waybill for unpaid order (must be PAID, CONFIRMED, or COD)")

    if req.provider == "J&T":
        waybill_data = await generate_jnt_waybill(
            order_id=order.id,
            customer_phone=order.customer_phone or "012000000",
            customer_address=order.delivery_address or "Phnom Penh",
            items=order.items
        )
    else:
        waybill_data = await generate_vet_waybill(
            order_id=order.id,
            customer_phone=order.customer_phone or "012000000",
            customer_address=order.delivery_address or "Phnom Penh",
            items=order.items
        )

    order.tracking_number = waybill_data["tracking_number"]
    order.waybill_url = waybill_data["waybill_url"]
    order.logistics_provider = waybill_data["provider"]
    order.status = "SHIPPED"
    
    await db.commit()
    
    return {
        "status": "success",
        "waybill": waybill_data,
        "order_status": order.status
    }
