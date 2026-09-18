import asyncio
from sqlalchemy import text
from app.core.db import engine, AsyncSessionLocal
from app.models.base import Base
from app.models import User, Product, Order, Conversation
from app.config import settings

# Since google-genai is used to generate embeddings
from google import genai
import os

client = genai.Client(api_key=settings.GEMINI_API_KEY)

inventory = [
    {
        "sku": "KZ-CASTOR-BASS",
        "name_en": "KZ Castor Bass Version",
        "name_kh": "កាស KZ Castor ជំនាន់បាស",
        "aliases": ["castor bass", "kz bass", "កាសបាស"],
        "description": "dual dynamic driver, heavy sub-bass",
        "price_usd": 14.00,
        "stock_qty": 50,
    },
    {
        "sku": "KZ-CASTOR-HARMAN",
        "name_en": "KZ Castor Harman Target",
        "name_kh": "កាស KZ Castor ជំនាន់ Harman",
        "aliases": ["castor harman", "kz harman", "កាស harman"],
        "description": "balanced vocal and clarity",
        "price_usd": 14.00,
        "stock_qty": 40,
    },
    {
        "sku": "KZ-CASTOR-PRO",
        "name_en": "KZ Castor Pro",
        "name_kh": "កាស KZ Castor Pro",
        "aliases": ["castor pro", "kz pro", "កាសប្រូ"],
        "description": "upgraded driver, clean treble, silver-plated cable",
        "price_usd": 19.00,
        "stock_qty": 20,
    },
    {
        "sku": "KZ-TYPEC-DAC",
        "name_en": "KZ Type-C Hi-Res DAC Cable",
        "name_kh": "ខ្សែប្រភេទ C មាន DAC",
        "aliases": ["type c cable", "dac cable", "ខ្សែ c"],
        "description": "digital type-c adapter",
        "price_usd": 6.00,
        "stock_qty": 100,
    },
]

async def seed():
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        for item in inventory:
            # Generate embedding using text-embedding-004
            text_to_embed = f"{item['name_en']} {item['name_kh']} {item['description']}"
            try:
                response = client.models.embed_content(
                    model="text-embedding-004",
                    contents=text_to_embed,
                )
                embedding = response.embeddings[0].values
            except Exception as e:
                print(f"Failed to generate embedding for {item['sku']}: {e}")
                # Mock embedding for test if it fails
                embedding = [0.0] * 768

            product = Product(
                sku=item["sku"],
                name_en=item["name_en"],
                name_kh=item["name_kh"],
                aliases=item["aliases"],
                description=item["description"],
                price_usd=item["price_usd"],
                stock_qty=item["stock_qty"],
                embedding=embedding,
            )
            session.add(product)
        await session.commit()
    print("Seed completed successfully.")

if __name__ == "__main__":
    asyncio.run(seed())
