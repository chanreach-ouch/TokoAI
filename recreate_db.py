import asyncio
from app.core.db import engine
from app.models.base import Base
from sqlalchemy import text
from app.models.seller import Seller
from app.models.product import Product
from app.models.chat import Conversation, Message
from app.models.faq import FAQ
import uuid
import bcrypt

async def recreate():
    async with engine.begin() as conn:
        await conn.execute(text("DROP SCHEMA public CASCADE;"))
        await conn.execute(text("CREATE SCHEMA public;"))
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        await conn.run_sync(Base.metadata.create_all)
        print("Database wiped and recreated with vector extension!")
        
        # Seed an admin user
        salt = bcrypt.gensalt()
        hashed_pw = bcrypt.hashpw(b"admin123", salt).decode('utf-8')
        admin_id = uuid.uuid4()
        
        await conn.execute(
            text("""
                INSERT INTO sellers (id, email, hashed_password, role, is_superadmin, is_active, bot_tone, ai_trust_mode, ai_token_usage, ai_message_limit, subscription_tier, created_at) 
                VALUES (:id, :email, :pw, 'OWNER', true, true, 'Professional', 'BALANCED', 0, 50, 'FREE', NOW())
            """),
            {"id": admin_id, "email": "admin@tokoai.com", "pw": hashed_pw}
        )
        print("Admin seeded: admin@tokoai.com / admin123")

if __name__ == "__main__":
    asyncio.run(recreate())
