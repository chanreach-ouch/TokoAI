from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.config import settings

# High-concurrency asyncpg connection pool with pre-ping health verification
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True
)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
