from sqlalchemy import select
from app.core.db import async_session_maker
from app.models.product import Product

async def check_inventory(sku: str) -> dict:
    async with async_session_maker() as session:
        result = await session.execute(select(Product).where(Product.sku == sku))
        product = result.scalar_one_or_none()
        if product:
            return {"sku": sku, "stock": product.stock_qty, "price": product.price_usd}
        return {"error": "Product not found"}
