import asyncio
import csv
import os
from sqlalchemy import text
from app.core.db import engine, Base
from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.models.conversation import Conversation
from google import genai
from google.genai import types

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    logger.info("Initializing vector store...")
    
    # Run migrations and setup pgvector
    async with engine.begin() as conn:
        logger.info("Creating pgvector extension...")
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        logger.info("Creating tables...")
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    api_key = os.getenv("GEMINI_API_KEY", "dummy_key")
    if api_key == "dummy_key":
        logger.warning("No GEMINI_API_KEY provided. Using dummy vector embeddings for testing.")
        client = None
    else:
        client = genai.Client(api_key=api_key)

    products = [
        {"sku": "KZ-CASTOR-BASS", "name_en": "KZ Castor Bass Version", "name_kh": "កាស KZ Castor បាស", "price_usd": 14.0, "stock_qty": 100, "aliases": ["castor bass", "bass version"]},
        {"sku": "KZ-CASTOR-HARMAN", "name_en": "KZ Castor Harman", "name_kh": "កាស KZ Castor ធម្មតា", "price_usd": 14.0, "stock_qty": 50, "aliases": ["castor harman"]},
        {"sku": "KZ-CASTOR-PRO", "name_en": "KZ Castor Pro", "name_kh": "កាស KZ Castor Pro", "price_usd": 19.0, "stock_qty": 30, "aliases": ["castor pro"]},
        {"sku": "KZ-TYPEC-DAC", "name_en": "KZ Type-C DAC Cable", "name_kh": "ខ្សែ Type-C DAC KZ", "price_usd": 6.0, "stock_qty": 200, "aliases": ["dac cable", "type c cord"]}
    ]

    async with engine.begin() as conn:
        for p in products:
            text_to_embed = f"{p['name_en']} {p['name_kh']} {' '.join(p['aliases'])}"
            embedding = [0.0] * 768
            
            if client:
                try:
                    response = client.models.embed_content(
                        model='text-embedding-004',
                        contents=text_to_embed,
                        config=types.EmbedContentConfig(output_dimensionality=768)
                    )
                    embedding = response.embeddings[0].values
                except Exception as e:
                    logger.error(f"Error getting embedding for {p['sku']}: {e}")
            
            await conn.execute(
                text("""
                    INSERT INTO products (sku, name_en, name_kh, aliases, price_usd, stock_qty, embedding)
                    VALUES (:sku, :name_en, :name_kh, :aliases, :price_usd, :stock_qty, :embedding)
                """),
                {
                    "sku": p["sku"],
                    "name_en": p["name_en"],
                    "name_kh": p["name_kh"],
                    "aliases": str(p["aliases"]).replace("'", '"'),
                    "price_usd": p["price_usd"],
                    "stock_qty": p["stock_qty"],
                    "embedding": embedding
                }
            )
            logger.info(f"Seeded product: {p['sku']}")
            
    logger.info("Database seeding complete!")

if __name__ == "__main__":
    asyncio.run(main())
