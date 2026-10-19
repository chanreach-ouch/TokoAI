import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.config import settings
import uuid

async def seed_shop():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Get Admin
        result = await session.execute(text("SELECT id FROM sellers WHERE email='admin@tokoai.com' LIMIT 1"))
        seller_id = result.scalar_one_or_none()
        
        if not seller_id:
            print("No admin found")
            return
            
        print(f"Admin ID: {seller_id}")
        
        # Insert Shop
        shop_id = str(uuid.uuid4())
        await session.execute(text(f"""
            INSERT INTO shops (id, owner_id, name, tiktok_page_id, created_at)
            VALUES ('{shop_id}', '{seller_id}', 'Admin Test Shop', 'mock-shop-123', NOW())
            ON CONFLICT DO NOTHING;
        """))
        
        # Update Seller
        await session.execute(text(f"UPDATE sellers SET shop_id='{shop_id}' WHERE id='{seller_id}'"))
        await session.commit()
        print("Mock shop 'mock-shop-123' created and linked!")

if __name__ == "__main__":
    asyncio.run(seed_shop())
