import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.seller import Seller
from app.models.product import Product
from app.models.faq import FAQ
import os

def embed_text(text: str) -> list[float]:
    # Dummy vector fallback if no API key needed
    return [0.0] * 768

from app.config import settings

async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(select(Seller).where(Seller.email == "admin@tokoai.com"))
        seller = result.scalar_one_or_none()
        
        if not seller:
            print("Admin seller not found! Run recreate_db.py first.")
            return

        print(f"Seeding rich product catalog with size & color variants for: {seller.email}")

        # Seed FAQs
        faqs = [
            FAQ(seller_id=seller.id, question="Do you ship to Siem Reap?", answer="Yes, we use J&T Express for nationwide delivery. Siem Reap takes 1-2 days."),
            FAQ(seller_id=seller.id, question="How do I pay?", answer="We accept Bakong KHQR, ABA, and Cash on Delivery (COD).")
        ]
        session.add_all(faqs)

        # Seed Products with realistic fashion variants & individual stocks
        products_data = [
            {
                "name": "Oversized Streetwear Tee (Black)",
                "name_kh": "អាវយឺត Streetwear ពណ៌ខ្មៅ",
                "sku": "KZ-STREET-TEE",
                "category": "Clothing",
                "description": "Premium cotton oversized t-shirt in black. High quality, breathable fabric.",
                "price": 12.00,
                "stock": 50,
                "variants": [
                    {"size": "S", "color": "Black", "stock": 10},
                    {"size": "M", "color": "Black", "stock": 25},
                    {"size": "L", "color": "Black", "stock": 0}, # Out of stock for upselling tests
                    {"size": "XL", "color": "Black", "stock": 15}
                ],
                "image_url": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=600&auto=format&fit=crop"
            },
            {
                "name": "Glow Vitamin C Serum",
                "name_kh": "សេរ៉ូមវីតាមីនសេ Glow",
                "sku": "GLOW-VIT-C",
                "category": "Cosmetics",
                "description": "Brightening vitamin C serum for glowing skin. Removes dark spots.",
                "price": 18.50,
                "stock": 20,
                "variants": [
                    {"size": "30ml", "stock": 15},
                    {"size": "50ml", "stock": 5}
                ],
                "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop"
            },
            {
                "name": "Minimalist Crossbody Bag",
                "name_kh": "កាបូបស្ពាយចំហៀង Minimalist",
                "sku": "BAG-MINI-01",
                "category": "Accessories",
                "description": "Small black leather crossbody bag. Stylish and waterproof.",
                "price": 25.00,
                "stock": 5,
                "variants": [
                    {"color": "Matte Black", "stock": 3},
                    {"color": "Mocha Brown", "stock": 2}
                ],
                "image_url": "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=600&auto=format&fit=crop"
            }
        ]

        for p_data in products_data:
            text_to_embed = f"{p_data['name']} - {p_data.get('name_kh', '')} - {p_data['category']} - {p_data['description']}"
            print(f"Generating embedding for: {p_data['name']}...")
            vector = embed_text(text_to_embed)
            
            product = Product(
                seller_id=seller.id,
                name=p_data['name'],
                name_kh=p_data.get('name_kh'),
                sku=p_data.get('sku'),
                category=p_data['category'],
                description=p_data['description'],
                price=p_data['price'],
                stock=p_data['stock'],
                variants=p_data.get('variants', []),
                image_url=p_data['image_url'],
                embedding=vector
            )
            session.add(product)
            
        await session.commit()
        print("Mock catalog with variants seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
