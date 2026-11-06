import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.models.seller import Seller
from app.models.shop import Shop
from app.models.product import Product
from app.models.faq import FAQ
from app.models.customer import Customer
from app.models.chat import Conversation, Message
from app.models.order import Order
from app.models.seller_persona import SellerPersonaProfile
from app.models.payment_transaction import PaymentTransaction
from app.config import settings

def embed_text(text: str) -> list[float]:
    return [0.0] * 768

async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # 1. Fetch or verify admin seller
        result = await session.execute(select(Seller).where(Seller.email == "admin@tokoai.com"))
        seller = result.scalar_one_or_none()
        
        if not seller:
            print("Admin seller not found! Run recreate_db.py first.")
            return

        print(f"Seeding TokoAI v2.0 mock data for: {seller.email} ({seller.id})")

        # 2. Seed or update Shop
        shop_stmt = select(Shop).where(Shop.owner_id == seller.id)
        shop = (await session.execute(shop_stmt)).scalar_one_or_none()
        
        if not shop:
            shop = Shop(
                id=uuid.uuid4(),
                owner_id=seller.id,
                name="TokoAI Fashion Boutique KH",
                tiktok_page_id="mock-shop-123",
                facebook_page_id="mock-fb-page-456",
                bakong_merchant_id="seller@abaa",
                voice_clone_enabled=True,
                voice_model_id="khmer_boutique_female_v1",
                max_voice_seconds=30,
                preferred_reply_modality="ADAPTIVE",
                escalation_rules={
                    "bulk_order_threshold_qty": 10,
                    "bulk_order_threshold_usd": 100.0,
                    "escalate_on_complaint": True,
                    "custom_trigger_keywords": ["refund", "fake", "broken", "complaint", "ខូច", "បោក", "ជួប admin"]
                }
            )
            session.add(shop)
            await session.flush()
            seller.shop_id = shop.id
        else:
            shop.voice_clone_enabled = True
            shop.bakong_merchant_id = "seller@abaa"
            shop.preferred_reply_modality = "ADAPTIVE"
            shop.escalation_rules = {
                "bulk_order_threshold_qty": 10,
                "bulk_order_threshold_usd": 100.0,
                "escalate_on_complaint": True,
                "custom_trigger_keywords": ["refund", "fake", "broken", "complaint", "ខូច", "បោក", "ជួប admin"]
            }

        # 3. Seed Cloned Seller Persona Profile
        persona_stmt = select(SellerPersonaProfile).where(SellerPersonaProfile.shop_id == shop.id)
        persona = (await session.execute(persona_stmt)).scalar_one_or_none()
        if not persona:
            persona = SellerPersonaProfile(
                shop_id=shop.id,
                selling_signature_summary="Warm, responsive boutique owner in natural spoken Khmer using ចា៎បង, អូន, and genuine sisterly care.",
                opening_hooks=[
                    "សួស្តីបង! ម៉ូដនេះទើបមកដល់ក្តៅៗ សាច់ក្រណាត់កប្បាសស្អាតខ្លាំងណា៎បង ✨",
                    "ចា៎បង! ម៉ូដនេះពេញនិយមខ្លាំង សល់តែប៉ុន្មានក្នុងស្តុកទេបងណា៎!",
                    "សួស្តីបងស្រី! ចាប់អារម្មណ៍មើល Size ឬពណ៌មួយណាដែរចា៎?"
                ],
                persuasion_tactics=[
                    "ពន្យល់ពីគុណភាពសាច់ក្រណាត់កប្បាសសុទ្ធ 100% ធានាមិនបែកព្រុយ",
                    "Free Delivery ក្នុងភ្នំពេញជូនភ្លាមៗបើទិញ ២ មុខឡើងទៅ",
                    "ធានាដូរទំហំជូនក្នុងរយៈពេល ៣ ថ្ងៃបើមិនត្រូវ Size",
                    "សេវាដឹករហ័ស ១ ថ្ងៃដល់ផ្ទះ និងបង់លុយពេលទំនិញដល់ (COD)"
                ],
                avg_reply_length_chars=95,
                avg_voice_duration_sec=12.0,
                preferred_reply_modality="ADAPTIVE",
                historical_samples_embedding=[0.05] * 768
            )
            session.add(persona)

        # 4. Seed FAQs
        session.add_all([
            FAQ(seller_id=seller.id, question="Do you ship to Siem Reap?", answer="Yes, we use J&T Express and Virak Buntham. Siem Reap takes 1-2 days ($2.50 fee)."),
            FAQ(seller_id=seller.id, question="How do I pay?", answer="We accept Bakong KHQR scan (ABA, Acleda) with zero fee, and Cash on Delivery (COD)."),
            FAQ(seller_id=seller.id, question="តើមានសេវាដឹកទៅបាត់ដំបងទេ?", answer="ខាងអូនមានសេវាដឹកជញ្ជូនទៅបាត់ដំបងតាម Virak Buntham VET តម្លៃត្រឹមតែ $2.50 ចា៎បង។")
        ])

        # 5. Seed Products with Bargaining Floors & Predictive COGS
        products_data = [
            {
                "name": "Oversized Streetwear Tee (Acid Wash)",
                "name_kh": "អាវយឺត Streetwear ពណ៌ខ្មៅ Acid Wash",
                "sku": "KZ-STREET-TEE",
                "category": "Clothing",
                "description": "Premium 100% heavy cotton oversized t-shirt in vintage wash.",
                "price": 18.00,
                "min_negotiation_price": 15.00,
                "cost_price_usd": 9.50,
                "reorder_threshold": 15,
                "stock": 4, # Low stock <= 5 to trigger CRITICAL_RESTOCK badge
                "variants": [
                    {"size": "S", "color": "Acid Black", "stock": 2},
                    {"size": "M", "color": "Acid Black", "stock": 2},
                    {"size": "L", "color": "Acid Black", "stock": 0},
                    {"size": "XL", "color": "Acid Black", "stock": 0}
                ],
                "image_url": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=600&auto=format&fit=crop"
            },
            {
                "name": "Glow Vitamin C Brightening Serum",
                "name_kh": "សេរ៉ូមវីតាមីនសេ Glow ជួយឱ្យស្បែកភ្លឺថ្លា",
                "sku": "GLOW-VIT-C",
                "category": "Cosmetics",
                "description": "Brightening vitamin C serum for glowing skin. Removes dark spots.",
                "price": 22.00,
                "min_negotiation_price": 18.00,
                "cost_price_usd": 11.00,
                "reorder_threshold": 10,
                "stock": 35,
                "variants": [
                    {"size": "30ml", "stock": 25},
                    {"size": "50ml", "stock": 10}
                ],
                "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop"
            },
            {
                "name": "Minimalist Crossbody Bag",
                "name_kh": "កាបូបស្ពាយចំហៀង Minimalist ស្បែកទន់",
                "sku": "BAG-MINI-01",
                "category": "Accessories",
                "description": "Waterproof matte black leather crossbody bag.",
                "price": 28.00,
                "min_negotiation_price": 24.00,
                "cost_price_usd": 14.00,
                "reorder_threshold": 8,
                "stock": 12,
                "variants": [
                    {"color": "Matte Black", "stock": 8},
                    {"color": "Mocha Brown", "stock": 4}
                ],
                "image_url": "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=600&auto=format&fit=crop"
            }
        ]

        seeded_products = []
        for p_data in products_data:
            p_stmt = select(Product).where(Product.seller_id == seller.id, Product.sku == p_data["sku"])
            existing_p = (await session.execute(p_stmt)).scalar_one_or_none()
            if not existing_p:
                prod = Product(
                    seller_id=seller.id,
                    name=p_data["name"],
                    name_kh=p_data["name_kh"],
                    sku=p_data["sku"],
                    category=p_data["category"],
                    description=p_data["description"],
                    price=p_data["price"],
                    min_negotiation_price=p_data["min_negotiation_price"],
                    allow_free_delivery_negotiation=True,
                    negotiation_step_usd=0.50,
                    cost_price_usd=p_data["cost_price_usd"],
                    reorder_threshold=p_data["reorder_threshold"],
                    stock=p_data["stock"],
                    variants=p_data["variants"],
                    image_url=p_data["image_url"],
                    embedding=embed_text(p_data["name"])
                )
                session.add(prod)
                seeded_products.append(prod)
            else:
                existing_p.min_negotiation_price = p_data["min_negotiation_price"]
                existing_p.cost_price_usd = p_data["cost_price_usd"]
                existing_p.stock = p_data["stock"]
                seeded_products.append(existing_p)

        await session.flush()

        # 6. Seed Customers & Long-Term Memory
        cust1 = Customer(
            shop_id=shop.id,
            platform_id="customer-vip-001",
            platform_source="tiktok",
            name="Srey Rath VIP",
            phone="012 884 921",
            shipping_address="Street 315, Toul Kork, Phnom Penh",
            buyer_tier="VIP",
            communication_style_notes="High intent, prefers Khmeringlish, regular size M buyer",
            preferred_sizes_variants={"preferred_size": "M", "color": "Black"},
            last_purchased_skus=["KZ-STREET-TEE", "GLOW-VIT-C"],
            total_orders=3,
            lifetime_value_usd=62.50
        )
        cust2 = Customer(
            shop_id=shop.id,
            platform_id="customer-lead-002",
            platform_source="messenger",
            name="Chanthy SiemReap",
            phone="015 993 112",
            shipping_address="Near Old Market, Siem Reap",
            buyer_tier="RETURNING",
            communication_style_notes="Bargains often, prefers voice notes",
            preferred_sizes_variants={"preferred_size": "S"},
            last_purchased_skus=["KZ-STREET-TEE"],
            total_orders=1,
            lifetime_value_usd=18.50
        )
        session.add_all([cust1, cust2])
        await session.flush()

        # 7. Seed Conversations & Messages
        now = datetime.now(timezone.utc)
        
        # Conv 1: Active Bargaining
        conv1 = Conversation(
            seller_id=seller.id,
            customer_platform_id=cust1.platform_id,
            is_human_takeover=False,
            last_bargain_at=now - timedelta(minutes=15),
            bargain_pending_product_id=seeded_products[0].id if seeded_products else None,
            bargain_offered_price=15.00
        )
        session.add(conv1)
        await session.flush()
        
        session.add_all([
            Message(conversation_id=conv1.id, role="user", content="B chos ban 15$ ot? Nhom yok size M"),
            Message(conversation_id=conv1.id, role="ai", content="ចា៎បង! ដោយសារបងស្រឡាញ់ ខាងអូនជួយសម្រួលបញ្ចុះជូនពិសេសត្រឹម $15.00 ណា៎បង 🥰 ឥឡូវអូនរៀបចំកក់ទុកជូនបងភ្លាមៗណា៎!")
        ])

        # Conv 2: Voice Note + Wholesale Lead Escalation
        conv2 = Conversation(
            seller_id=seller.id,
            customer_platform_id="customer-wholesale-003",
            is_human_takeover=True,
            takeover_reason="WHOLESALE_LEAD"
        )
        session.add(conv2)
        await session.flush()
        
        session.add_all([
            Message(
                conversation_id=conv2.id, 
                role="user", 
                content="🎤 [Voice Note]: \"សួស្តីបង បើខ្ញុំចង់យក ៥០ អាវ តើបងគិតតម្លៃបោះដុំយ៉ាងម៉េចដែរ?\"",
                media_type="audio",
                audio_duration_sec=14.5,
                transcription="សួស្តីបង បើខ្ញុំចង់យក ៥០ អាវ តើបងគិតតម្លៃបោះដុំយ៉ាងម៉េចដែរ?"
            ),
            Message(
                conversation_id=conv2.id,
                role="system",
                content="⚠️ Smart Escalation Activated: WHOLESALE_LEAD (50 units inquiry)"
            )
        ])

        # 8. Seed Completed Orders & Payment Transactions for Predictive BI
        ord1 = Order(
            shop_id=shop.id,
            user_id=cust1.id,
            items={"sku": "KZ-STREET-TEE", "name": "Oversized Streetwear Tee", "qty": 2, "unit_price": 18.00},
            total_amount_usd=37.50,
            payment_method="KHQR",
            delivery_fee_usd=1.50,
            customer_phone=cust1.phone,
            delivery_address=cust1.shipping_address,
            status="PAID",
            tracking_number="SLIP-ABA-TRX9921"
        )
        ord2 = Order(
            shop_id=shop.id,
            user_id=cust2.id,
            items={"sku": "GLOW-VIT-C", "name": "Glow Vitamin C Serum", "qty": 1, "unit_price": 22.00},
            total_amount_usd=24.50,
            payment_method="COD",
            delivery_fee_usd=2.50,
            customer_phone=cust2.phone,
            delivery_address=cust2.shipping_address,
            status="SHIPPED",
            waybill_url="https://vet.com.kh/tracking/VET-99214"
        )
        session.add_all([ord1, ord2])
        await session.flush()

        tx1 = PaymentTransaction(
            shop_id=shop.id,
            order_id=ord1.id,
            bank_name="ABA Bank",
            bank_ref_id="TRX-ABA-99214872",
            amount_usd=37.50,
            amount_khr=153750.0,
            status="VERIFIED"
        )
        session.add(tx1)

        await session.commit()
        print("TokoAI v2.0 complete seed finished successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
