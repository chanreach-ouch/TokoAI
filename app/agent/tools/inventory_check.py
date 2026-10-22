from app.core.db import AsyncSessionLocal
from sqlalchemy import select, or_, func
from app.models.product import Product

async def check_inventory(sku: str) -> int:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Product).where(
                or_(
                    Product.sku == sku,
                    func.lower(Product.name) == sku.lower(),
                    func.lower(Product.name_kh) == sku.lower()
                )
            )
        )
        product = result.scalar_one_or_none()
        if product:
            return int(getattr(product, "stock_qty", product.stock))
        return 0
