from google import genai
from sqlalchemy import select
from app.core.db import AsyncSessionLocal
from app.models.product import Product
from app.config import settings
from app.agent.prompts import SYSTEM_PROMPT

client = genai.Client(api_key=settings.GEMINI_API_KEY)

async def retrieve_relevant_products(query: str, session, top_k=2):
    try:
        response = client.models.embed_content(
            model="text-embedding-004",
            contents=query,
        )
        query_embedding = response.embeddings[0].values
        
        stmt = select(Product).order_by(Product.embedding.cosine_distance(query_embedding)).limit(top_k)
        result = await session.execute(stmt)
        return result.scalars().all()
    except Exception as e:
        print(f"Embedding error: {e}")
        return []

async def run_agent(sender_id: str, message_text: str, memory: list[str]) -> str:
    async with AsyncSessionLocal() as session:
        products = await retrieve_relevant_products(message_text, session)
        
        context = "Relevant Products:\n"
        for p in products:
            context += f"- {p.name_kh} (SKU: {p.sku}): ${p.price_usd} - {p.description} (Stock: {p.stock_qty})\n"
            
        history = "\n".join(reversed(memory))
        
        prompt = f"{SYSTEM_PROMPT}\n\nContext:\n{context}\n\nChat History:\n{history}\n\nUser: {message_text}\nAgent:"
        
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return response.text
        except Exception as e:
            print(f"Gemini error: {e}")
            return "សុំទោសបង ពេលនេះមានបញ្ហាបច្ចេកទេសបន្តិច។"
