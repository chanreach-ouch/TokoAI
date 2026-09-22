import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.models.base import Base
from sqlalchemy import text
from app.models.seller import Seller
from app.models.product import Product
from app.models.chat import Conversation, Message
from app.models.faq import FAQ
from app.models.order import Order
from app.models.shop import Shop
from app.models.user import User
import uuid, bcrypt

# Localhost URL since we are running on host
DATABASE_URL = "postgresql+asyncpg://postgres:postgres@postgres:5432/tokoai"
engine = create_async_engine(DATABASE_URL, echo=False)

async def recreate():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        salt = bcrypt.gensalt()
        pw = bcrypt.hashpw(b'admin123', salt).decode('utf-8')
        await conn.execute(text("""
            INSERT INTO sellers (id, email, hashed_password, is_superadmin, is_active, bot_tone, ai_token_usage, created_at) 
            VALUES (:id, :email, :pw, true, true, 'Professional', 0, NOW())
        """), {'id': uuid.uuid4(), 'email': 'admin@tokoai.com', 'pw': pw})
        
        # Also create HNSW index!
        await conn.execute(text("CREATE INDEX ON products USING hnsw (embedding vector_cosine_ops);"))
        print('Tables created, index added, and admin seeded!')

asyncio.run(recreate())
