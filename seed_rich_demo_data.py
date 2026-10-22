import asyncio
import uuid
from datetime import datetime, timezone
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models.seller import Seller
from app.models.shop import Shop
from app.models.product import Product
from app.models.customer import Customer
from app.models.user import User
from app.models.order import Order
from app.models.chat import Conversation, Message
from app.models.faq import FAQ

from app.models.base import Base

async def seed_rich_data():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("Ensured all tables exist.")
    
    async with async_session() as session:
        # Fetch all sellers
        result = await session.execute(select(Seller))
        sellers = result.scalars().all()
        if not sellers:
            print("No sellers found.")
            return

        print(f"Found {len(sellers)} sellers.")

        for seller in sellers:
            print(f"Processing seller: {seller.email} ({seller.id})")
            
            # Ensure seller has a shop
            shop_result = await session.execute(select(Shop).where(Shop.owner_id == seller.id))
            shop = shop_result.scalar_one_or_none()
            if not shop:
                shop = Shop(
                    id=uuid.uuid4(),
                    owner_id=seller.id,
                    tiktok_page_id=f"tiktok-shop-{str(seller.id)[:8]}",
                    name="TokoAI Phnom Penh Flagship",
                    bakong_merchant_id="tokoai_merchant@aba",
                    created_at=datetime.now(timezone.utc)
                )
                session.add(shop)
                await session.flush()
            
            seller.shop_id = shop.id

            # Seed Products if none exist for this seller
            prod_result = await session.execute(select(Product).where(Product.seller_id == seller.id))
            existing_prods = prod_result.scalars().all()
            if not existing_prods:
                sample_products = [
                    Product(
                        id=uuid.uuid4(),
                        seller_id=seller.id,
                        name="Oversized Streetwear Tee (Phnom Penh Edition)",
                        name_kh="អាវយឺត Streetwear ម៉ូដភ្នំពេញ",
                        sku="KZ-CASTOR-PRO",
                        category="Apparel",
                        description="Heavyweight 240 GSM organic cotton t-shirt with signature Phnom Penh graphic. Oversized boxy silhouette, ribbed collar.",
                        price=19.00,
                        stock=45,
                        image_url="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop",
                        embedding=[0.0] * 768
                    ),
                    Product(
                        id=uuid.uuid4(),
                        seller_id=seller.id,
                        name="Glow Vitamin C Serum (30ml)",
                        name_kh="សេរ៉ូមវីតាមីន C ជួយស្បែកមុខភ្លឺថ្លា (30ml)",
                        sku="GLOW-VITC-30",
                        category="Cosmetics",
                        description="Triple-active antioxidant brightening serum formulated with 15% Ethyl Ascorbic Acid and Hyaluronic Acid for tropical climates.",
                        price=24.50,
                        stock=28,
                        image_url="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop",
                        embedding=[0.0] * 768
                    ),
                    Product(
                        id=uuid.uuid4(),
                        seller_id=seller.id,
                        name="Khmer Kroma Heritage Canvas Tote",
                        name_kh="កាបូបក្រណាត់កាតុងក្រមាបុរាណខ្មែរ",
                        sku="KHMER-KROMA-TOTE",
                        category="Accessories",
                        description="Traditional Khmer Kroma plaid woven into high-density 16oz canvas. Reinforced dual carry straps, brass snap enclosure.",
                        price=14.00,
                        stock=60,
                        image_url="https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop",
                        embedding=[0.0] * 768
                    ),
                    Product(
                        id=uuid.uuid4(),
                        seller_id=seller.id,
                        name="Cyberpunk Phnom Penh Heavy Hoodie",
                        name_kh="អាវរងារក្រាស់ Cyberpunk ភ្នំពេញ",
                        sku="CYBER-PP-HOODIE",
                        category="Apparel",
                        description="400 GSM brushed fleece with reflective Khmer typography screenprint. Custom metal aglets, kangaroo pocket.",
                        price=38.00,
                        stock=15,
                        image_url="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800&auto=format&fit=crop",
                        embedding=[0.0] * 768
                    )
                ]
                session.add_all(sample_products)

            # Seed Customers
            cust_result = await session.execute(select(Customer).where(Customer.shop_id == shop.id))
            if not cust_result.scalars().first():
                sample_customers = [
                    Customer(
                        id=uuid.uuid4(),
                        shop_id=shop.id,
                        platform_id="customer-777",
                        platform_source="tiktok",
                        name="Sokha Ry",
                        phone="012 884 921",
                        shipping_address="House 42, St 271, Toul Kork, Phnom Penh (Near Primary School)",
                        lifetime_value_usd=128.00,
                        total_orders=3,
                        last_active_at=datetime.now(timezone.utc),
                        created_at=datetime.now(timezone.utc)
                    ),
                    Customer(
                        id=uuid.uuid4(),
                        shop_id=shop.id,
                        platform_id="customer-888",
                        platform_source="tiktok",
                        name="Bopha Meas",
                        phone="015 332 990",
                        shipping_address="Condo 12B, St 302, BKK1, Phnom Penh",
                        lifetime_value_usd=85.50,
                        total_orders=2,
                        last_active_at=datetime.now(timezone.utc),
                        created_at=datetime.now(timezone.utc)
                    ),
                    Customer(
                        id=uuid.uuid4(),
                        shop_id=shop.id,
                        platform_id="customer-999",
                        platform_source="tiktok",
                        name="Vibol Keo",
                        phone="098 771 204",
                        shipping_address="Wat Bo Road, Siem Reap (Opposite Night Market)",
                        lifetime_value_usd=42.00,
                        total_orders=1,
                        last_active_at=datetime.now(timezone.utc),
                        created_at=datetime.now(timezone.utc)
                    ),
                    Customer(
                        id=uuid.uuid4(),
                        shop_id=shop.id,
                        platform_id="customer-101",
                        platform_source="tiktok",
                        name="Channary Tep",
                        phone="077 551 883",
                        shipping_address="Svay Por, Battambang (Near Sangke River)",
                        lifetime_value_usd=64.00,
                        total_orders=2,
                        last_active_at=datetime.now(timezone.utc),
                        created_at=datetime.now(timezone.utc)
                    )
                ]
                session.add_all(sample_customers)

            # Seed Users for orders
            prefix = str(seller.id)[:4]
            u1_id = f"{prefix}-cust-777"
            u2_id = f"{prefix}-cust-888"
            u3_id = f"{prefix}-cust-999"
            
            u1 = User(
                shop_id=shop.id,
                tiktok_open_id=u1_id,
                phone_number="012 884 921",
                delivery_address="House 42, St 271, Toul Kork, Phnom Penh (Near Primary School)"
            )
            u2 = User(
                shop_id=shop.id,
                tiktok_open_id=u2_id,
                phone_number="015 332 990",
                delivery_address="Condo 12B, St 302, BKK1, Phnom Penh"
            )
            u3 = User(
                shop_id=shop.id,
                tiktok_open_id=u3_id,
                phone_number="098 771 204",
                delivery_address="Wat Bo Road, Siem Reap (Opposite Night Market)"
            )
            session.add_all([u1, u2, u3])
            await session.flush()
            users = [u1, u2, u3]

            # Seed Orders
            order_res = await session.execute(select(Order).where(Order.shop_id == shop.id))
            if not order_res.scalars().first():
                sample_orders = [
                    Order(
                        shop_id=shop.id,
                        user_id=users[0].id,
                        items=[{"sku": "KZ-CASTOR-PRO", "name": "Oversized Streetwear Tee (Phnom Penh Edition)", "price": 19.00, "quantity": 1}],
                        total_amount_usd=20.50,
                        payment_method="KHQR",
                        delivery_fee_usd=1.50,
                        customer_phone="012 884 921",
                        delivery_address="House 42, St 271, Toul Kork, Phnom Penh",
                        status="PAID",
                        khqr_string="00020101021229370016bakong@aba0110tokoai123520459995303840540520.505802KH5911TokoAIShop6010Phnom Penh6304A7B2",
                        tracking_number="JT-KH-9928172",
                        logistics_provider="J&T Express",
                        waybill_url="https://express.jt.com.kh/waybill/JT-KH-9928172"
                    ),
                    Order(
                        shop_id=shop.id,
                        user_id=users[1].id,
                        items=[{"sku": "GLOW-VITC-30", "name": "Glow Vitamin C Serum (30ml)", "price": 24.50, "quantity": 2}],
                        total_amount_usd=51.50,
                        payment_method="KHQR",
                        delivery_fee_usd=2.50,
                        customer_phone="015 332 990",
                        delivery_address="Wat Bo Road, Siem Reap (Opposite Night Market)",
                        status="PAID",
                        khqr_string="00020101021229370016bakong@aba0110tokoai123520459995303840540551.505802KH5911TokoAIShop6010Phnom Penh6304C9D1",
                        tracking_number="VET-SR-441092",
                        logistics_provider="Virak Buntham VET",
                        waybill_url="https://virakbuntham.com/tracking/VET-SR-441092"
                    ),
                    Order(
                        shop_id=shop.id,
                        user_id=users[2].id,
                        items=[{"sku": "CYBER-PP-HOODIE", "name": "Cyberpunk Phnom Penh Heavy Hoodie", "price": 38.00, "quantity": 1}],
                        total_amount_usd=39.50,
                        payment_method="COD",
                        delivery_fee_usd=1.50,
                        customer_phone="098 771 204",
                        delivery_address="Condo 12B, St 302, BKK1, Phnom Penh",
                        status="PENDING",
                        khqr_string=None
                    ),
                    Order(
                        shop_id=shop.id,
                        user_id=users[0].id,
                        items=[{"sku": "KHMER-KROMA-TOTE", "name": "Khmer Kroma Heritage Canvas Tote", "price": 14.00, "quantity": 2}],
                        total_amount_usd=29.50,
                        payment_method="KHQR",
                        delivery_fee_usd=1.50,
                        customer_phone="012 884 921",
                        delivery_address="House 42, St 271, Toul Kork, Phnom Penh",
                        status="SHIPPED",
                        tracking_number="JT-KH-8837191",
                        logistics_provider="J&T Express",
                        waybill_url="https://express.jt.com.kh/waybill/JT-KH-8837191"
                    )
                ]
                session.add_all(sample_orders)

            # Seed Conversations & Messages
            conv_res = await session.execute(select(Conversation).where(Conversation.seller_id == seller.id))
            if not conv_res.scalars().first():
                c1 = Conversation(
                    id=uuid.uuid4(),
                    seller_id=seller.id,
                    customer_platform_id="customer-777",
                    is_human_takeover=False,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                c2 = Conversation(
                    id=uuid.uuid4(),
                    seller_id=seller.id,
                    customer_platform_id="customer-888",
                    is_human_takeover=False,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                c3 = Conversation(
                    id=uuid.uuid4(),
                    seller_id=seller.id,
                    customer_platform_id="customer-999",
                    is_human_takeover=True,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                session.add_all([c1, c2, c3])
                await session.flush()

                m1 = [
                    Message(conversation_id=c1.id, role="user", content="B Kz castor hx ng pro khos knea mx?"),
                    Message(conversation_id=c1.id, role="ai", content="សួស្តីបង! Oversized Streetwear Tee នេះសាច់ក្រណាត់កប្បាស Cotton 100% ទន់ត្រជាក់ មិនស្អុះស្អាប់ទេបង។ សមរម្យសម្រាប់អាកាសធាតុក្តៅនៅភ្នំពេញបង។ បងចង់បាន Size M ឬ L ដែរ?"),
                    Message(conversation_id=c1.id, role="user", content="Size L b, mean black te?"),
                    Message(conversation_id=c1.id, role="ai", content="មានក្នុងស្តុកបង! តម្លៃ $19.00 (77,900 ៛)។ ខ្ញុំបង្កើតវិក្កយបត្រ KHQR ជូនបងស្កេនទូទាត់ភ្លាមៗបានបងណា៎ 🚚"),
                    Message(conversation_id=c1.id, role="user", content="Ok send khqr mk b"),
                    Message(conversation_id=c1.id, role="ai", content="នេះជាកូដ Bakong KHQR សម្រាប់ទូទាត់ $19.00 បងស្កេនតាម ABA ឬ Bakong app បានភ្លាមៗបង! បន្ទាប់ពីទូទាត់រួច TokoAI នឹងវេចខ្ចប់ផ្ញើតាម J&T Express ជូនបង។")
                ]
                m2 = [
                    Message(conversation_id=c2.id, role="user", content="How much is the Glow Vitamin C Serum?"),
                    Message(conversation_id=c2.id, role="ai", content="សួស្តីបង Bopha! Glow Vitamin C Serum តម្លៃ $24.50 ក្នុងមួយដបបង។ ជួយឱ្យស្បែកមុខភ្លឺថ្លាបំបាត់ស្នាមអុចខ្មៅបានយ៉ាងលឿនបង។"),
                    Message(conversation_id=c2.id, role="user", content="Free delivery te bong?"),
                    Message(conversation_id=c2.id, role="ai", content="កម្ម៉ង់ ២ ដបឡើងទៅ TokoAI free delivery ក្នុងភ្នំពេញជូនបងភ្លាម! បងយក ២ ដបតែម្តងទេបង?")
                ]
                m3 = [
                    Message(conversation_id=c3.id, role="user", content="Ship to Siem Reap te bong?"),
                    Message(conversation_id=c3.id, role="ai", content="ដឹកទូទាំង ២៥ ខេត្តក្រុងបង! ទៅសៀមរាប TokoAI ផ្ញើតាម Virak Buntham VET រយៈពេល ១-២ ថ្ងៃដល់មុខផ្ទះបង។"),
                    Message(conversation_id=c3.id, role="user", content="Can I request cash on delivery (COD)?")
                ]
                session.add_all(m1 + m2 + m3)

        await session.commit()
        print("Rich demo data successfully seeded across all sellers!")

if __name__ == "__main__":
    asyncio.run(seed_rich_data())
