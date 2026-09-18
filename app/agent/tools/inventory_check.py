from app.core.db import AsyncSessionLocal
from sqlalchemy import select
from app.models.product import Product

async def check_inventory(sku: str) -> int:
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Product).where(Product.sku == sku))
        product = result.scalar_one_or_none()
        if product:
            return product.stock_qty
        return 0
