import asyncio
from app.core.db import engine
from app.models.base import Base

# Import all models so Base metadata is populated
from app.models.seller import Seller
from app.models.shop import Shop
from app.models.product import Product
from app.models.order import Order
from app.models.user import User

from sqlalchemy import text

async def init_db():
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        print("Database tables created successfully.")

if __name__ == "__main__":
    asyncio.run(init_db())
