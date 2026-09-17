from sqlalchemy import text
from app.core.db import async_session_maker
from google import genai
from google.genai import types
import os
import logging

logger = logging.getLogger(__name__)

api_key = os.getenv("GEMINI_API_KEY", "dummy_key")
client = genai.Client(api_key=api_key) if api_key != "dummy_key" else None

async def query_products(query: str, limit: int = 3):
    if not client:
        return []

    try:
        response = client.models.embed_content(
            model='text-embedding-004',
            contents=query,
            config=types.EmbedContentConfig(output_dimensionality=768)
        )
        query_embedding = response.embeddings[0].values
    except Exception as e:
        logger.error(f"Failed to embed query: {e}")
        return []

    async with async_session_maker() as session:
        result = await session.execute(
            text("""
                SELECT sku, name_en, name_kh, price_usd, stock_qty,
                       1 - (embedding <=> :embedding::vector) AS similarity
                FROM products
                ORDER BY embedding <=> :embedding::vector
                LIMIT :limit
            """),
            {"embedding": str(query_embedding), "limit": limit}
        )
        
        return [dict(row._mapping) for row in result]
