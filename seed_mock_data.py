import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.seller import Seller
from app.models.product import Product
from app.models.faq import FAQ
import google.generativeai as genai
import os

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def embed_text(text: str) -> list[float]:
    # Use dummy vectors so we don't need a real Gemini key just to seed data!
    # The AI will still work for our 3 test products because they'll all be returned in the RAG context.
    return [0.0] * 768

from app.config import settings

async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Get the admin seller
        result = await session.execute(select(Seller).where(Seller.email == "admin@tokoai.com"))
        seller = result.scalar_one_or_none()
        
        if not seller:
            print("Admin seller not found! Run recreate_db.py first.")
            return

        print(f"Seeding data for seller: {seller.email}")

        # Seed FAQs
        faqs = [
            FAQ(seller_id=seller.id, question="Do you ship to Siem Reap?", answer="Yes, we use J&T Express for nationwide delivery. Siem Reap takes 1-2 days."),
            FAQ(seller_id=seller.id, question="How do I pay?", answer="We accept Bakong KHQR, ABA, and Cash on Delivery (COD).")
        ]
        session.add_all(faqs)

        # Seed Products
        products_data = [
            {
                "name": "Oversized Streetwear Tee (Black)",
                "category": "Clothing",
                "description": "Premium cotton oversized t-shirt in black. High quality, breathable fabric. Perfect for casual wear.",
                "price": 12.00,
                "stock": 50,
                "image_url": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=600&auto=format&fit=crop"
            },
            {
                "name": "Glow Vitamin C Serum",
                "category": "Cosmetics",
                "description": "Brightening vitamin C serum for glowing skin. Removes dark spots.",
                "price": 18.50,
                "stock": 20,
                "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop"
            },
            {
                "name": "Minimalist Crossbody Bag",
                "category": "Accessories",
                "description": "Small black leather crossbody bag. Stylish and waterproof.",
                "price": 25.00,
                "stock": 5,
                "image_url": "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=600&auto=format&fit=crop"
            }
        ]

        for p_data in products_data:
            text_to_embed = f"{p_data['name']} - {p_data['category']} - {p_data['description']}"
            print(f"Generating embedding for: {p_data['name']}...")
            vector = embed_text(text_to_embed)
            
            product = Product(
                seller_id=seller.id,
                name=p_data['name'],
                category=p_data['category'],
                description=p_data['description'],
                price=p_data['price'],
                stock=p_data['stock'],
                image_url=p_data['image_url'],
                embedding=vector
            )
            session.add(product)
            
        await session.commit()
        print("Mock data seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
