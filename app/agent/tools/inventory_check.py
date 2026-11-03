from app.core.db import AsyncSessionLocal
from sqlalchemy import select, or_, func
from app.models.product import Product
import uuid

async def check_inventory(sku: str, seller_id: str | uuid.UUID | None = None) -> int:
    """
    Checks stock level for a SKU or product name with multi-tenant seller_id scoping.
    """
    async with AsyncSessionLocal() as session:
        query = select(Product).where(
            or_(
                Product.sku == sku,
                func.lower(Product.name) == sku.lower(),
                func.lower(Product.name_kh) == sku.lower()
            )
        )
        if seller_id is not None:
            seller_uuid = uuid.UUID(str(seller_id)) if isinstance(seller_id, str) else seller_id
            query = query.where(Product.seller_id == seller_uuid)

        result = await session.execute(query)
        product = result.scalar_one_or_none()
        if product:
            return int(getattr(product, "stock_qty", product.stock))
        return 0
