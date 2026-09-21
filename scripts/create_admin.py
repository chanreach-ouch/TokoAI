import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import engine, async_session_maker
from app.models.seller import Seller
from app.core.auth import get_password_hash

async def create_admin_user():
    async with async_session_maker() as db:
        # Check if admin already exists
        result = await db.execute(select(Seller).where(Seller.email == "admin@tokoai.com"))
        admin = result.scalar_one_or_none()
        
        if not admin:
            # Create the admin user
            hashed_password = get_password_hash("admin123")
            new_seller = Seller(email="admin@tokoai.com", hashed_password=hashed_password)
            db.add(new_seller)
            await db.commit()
            print("Admin user created successfully!")
        else:
            print("Admin user already exists!")

if __name__ == "__main__":
    asyncio.run(create_admin_user())
