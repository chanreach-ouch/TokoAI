from google import genai
from sqlalchemy import select
from app.core.db import AsyncSessionLocal
from app.models.product import Product
from app.models.shop import Shop
from app.config import settings
from app.agent.prompts import SYSTEM_PROMPT

client = genai.Client(api_key=settings.GEMINI_API_KEY)

async def retrieve_relevant_products(query: str, session, shop_id, top_k=2):
    try:
        response = client.models.embed_content(
            model="gemini-embedding-2",
            contents=query,
        )
        query_embedding = response.embeddings[0].values
        
        from app.models.shop import Shop
        # Look up the shop's owner to get the seller_id
        shop_stmt = select(Shop).where(Shop.id == shop_id)
        shop_res = await session.execute(shop_stmt)
        shop = shop_res.scalar_one_or_none()
        
        if not shop:
            return []
            
        stmt = select(Product).where(Product.seller_id == shop.owner_id).order_by(Product.embedding.cosine_distance(query_embedding)).limit(top_k)
        result = await session.execute(stmt)
        return result.scalars().all()
    except Exception as e:
        print(f"Embedding error: {e}")
        return []

from google.genai import types
from app.agent.tools.khqr_generator import generate_khqr_payload
from app.models.user import User
from app.models.customer import Customer
from app.models.faq import FAQ
from app.models.chat import Conversation, Message
from app.models.order import Order
import uuid

async def run_agent(sender_id: str, shop_id, message_text: str, memory: list[str]) -> str:
    async with AsyncSessionLocal() as session:
        # 1. Look up the shop's owner
        shop_stmt = select(Shop).where(Shop.id == shop_id)
        shop_res = await session.execute(shop_stmt)
        shop = shop_res.scalar_one_or_none()
        
        # 2. Retrieve relevant products via pgvector
        products = await retrieve_relevant_products(message_text, session, shop_id)
        
        context = "Relevant Products Catalog:\n"
        if not products:
            context += "- No matching catalog items found for this specific query.\n"
        for p in products:
            p_name = getattr(p, "name_kh", None) or getattr(p, "name", "Product")
            p_sku = getattr(p, "sku", None) or str(p.id)[:8]
            p_price = float(getattr(p, "price", getattr(p, "price_usd", 0.0)))
            p_khr = int(p_price * 4100)
            p_stock = int(getattr(p, "stock", getattr(p, "stock_qty", 0)))
            p_desc = getattr(p, "description", "") or ""
            context += f"- {p_name} (SKU: {p_sku}): ${p_price:.2f} ({p_khr:,} ៛) - {p_desc} (Stock: {p_stock})\n"
            
        # 3. Retrieve store custom FAQs & policies
        faq_text = ""
        if shop:
            faq_stmt = select(FAQ).where(FAQ.seller_id == shop.owner_id).limit(6)
            faq_res = await session.execute(faq_stmt)
            faqs = faq_res.scalars().all()
            if faqs:
                faq_text = "\n\nStore Custom FAQs & Store Rules:\n" + "\n".join([f"- Q: {f.question}\n  A: {f.answer}" for f in faqs])

        history = "\n".join(reversed(memory))
        
        prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"Shop ID: {shop_id}\n\n"
            f"Context:\n{context}"
            f"{faq_text}\n\n"
            f"Delivery Standard: Phnom Penh = $1.50 (6,150 ៛, 1-2 days), Provinces = $2.50 (10,250 ៛, 1-3 days via VET/J&T).\n"
            f"Payment Options: Bakong KHQR (Prepaid instant scan via ABA/Bakong) or Cash on Delivery (COD / បង់លុយពេលទំនិញដល់).\n\n"
            f"Chat History:\n{history}\n\n"
            f"User: {message_text}\nAgent:"
        )
        
        # Define Tools for Gemini
        agent_tools = types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="create_order",
                    description="Creates a new order for the customer. Supports both Bakong KHQR and Cash on Delivery (COD).",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "sku": types.Schema(type=types.Type.STRING, description="The exact SKU or product name to buy"),
                            "quantity": types.Schema(type=types.Type.INTEGER, description="Quantity to purchase"),
                            "payment_method": types.Schema(type=types.Type.STRING, description="'KHQR' for QR scan or 'COD' for Cash on Delivery"),
                            "delivery_city": types.Schema(type=types.Type.STRING, description="'Phnom Penh' or 'Province'"),
                            "customer_phone": types.Schema(type=types.Type.STRING, description="Customer Cambodian phone number if provided"),
                            "delivery_address": types.Schema(type=types.Type.STRING, description="Customer landmark delivery address if provided")
                        },
                        required=["sku", "quantity"]
                    )
                ),
                types.FunctionDeclaration(
                    name="escalate_to_human",
                    description="Escalates conversation to a human store manager and pauses automated AI responses. Call when customer is angry, reports damaged/wrong items, or explicitly asks for a human admin.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "reason": types.Schema(type=types.Type.STRING, description="Reason for escalating to human staff")
                        },
                        required=["reason"]
                    )
                )
            ]
        )
        
        try:
            # Ask Gemini
            response = await client.aio.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[agent_tools]
                )
            )
            
            # Check for function calls
            if response.function_calls:
                fc = response.function_calls[0]
                
                # --- CASE 1: Escalate to Human ---
                if fc.name == "escalate_to_human":
                    reason = str(fc.args.get("reason", "Customer requested human support"))
                    if shop:
                        conv_stmt = select(Conversation).where(
                            Conversation.seller_id == shop.owner_id,
                            Conversation.customer_platform_id == sender_id
                        )
                        conv_res = await session.execute(conv_stmt)
                        conv = conv_res.scalar_one_or_none()
                        if conv:
                            conv.is_human_takeover = True
                            esc_msg = Message(
                                conversation_id=conv.id,
                                role="system",
                                content=f"⚠️ Human Takeover Activated: {reason}"
                            )
                            session.add(esc_msg)
                            await session.commit()
                            
                    part_result = types.Part.from_function_response(
                        name="escalate_to_human",
                        response={"status": "escalated", "message": "Human manager alerted. AI paused."}
                    )
                    final_response = await client.aio.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=[prompt, response.candidates[0].content, part_result],
                        config=types.GenerateContentConfig(tools=[agent_tools])
                    )
                    return final_response.text

                # --- CASE 2: Create Order ---
                elif fc.name == "create_order":
                    sku = str(fc.args.get("sku", "")).strip()
                    qty = int(fc.args.get("quantity", 1))
                    pay_method = str(fc.args.get("payment_method", "KHQR")).upper()
                    if "COD" in pay_method or "CASH" in pay_method:
                        pay_method = "COD"
                    else:
                        pay_method = "KHQR"
                        
                    delivery_city = str(fc.args.get("delivery_city", "Phnom Penh"))
                    customer_phone = fc.args.get("customer_phone")
                    delivery_address = fc.args.get("delivery_address")
                    
                    # Delivery Fee Calculation
                    is_provincial = any(term in delivery_city.lower() for term in ["prov", "reap", "battambang", "kampot", "sihanouk", "ខេត្ត"])
                    delivery_fee = 2.50 if is_provincial else 1.50
                    
                    if not shop:
                        tool_result = {"status": "failed", "reason": "Shop not found."}
                    else:
                        from sqlalchemy import or_, func
                        stmt = select(Product).where(
                            Product.seller_id == shop.owner_id,
                            or_(
                                Product.sku == sku,
                                func.lower(Product.name).like(f"%{sku.lower()}%"),
                                func.lower(Product.name_kh).like(f"%{sku.lower()}%")
                            )
                        )
                        p_res = await session.execute(stmt)
                        prod = p_res.scalars().first()
                        
                        stock = int(getattr(prod, "stock", getattr(prod, "stock_qty", 0))) if prod else 0
                        if not prod or stock < qty:
                            tool_result = {"status": "failed", "reason": f"Out of stock for SKU: {sku}."}
                        else:
                            price_item = float(getattr(prod, "price", getattr(prod, "price_usd", 0.0)))
                            subtotal = price_item * qty
                            total_usd = subtotal + delivery_fee
                            total_khr = int(total_usd * 4100)
                            
                            # Ensure User record exists
                            user_stmt = select(User).where(User.tiktok_open_id == sender_id, User.shop_id == shop_id)
                            u_res = await session.execute(user_stmt)
                            user = u_res.scalar_one_or_none()
                            if not user:
                                user = User(
                                    shop_id=shop_id,
                                    tiktok_open_id=sender_id,
                                    phone_number=customer_phone,
                                    delivery_address=delivery_address
                                )
                                session.add(user)
                                await session.flush()
                            elif customer_phone or delivery_address:
                                if customer_phone: user.phone_number = customer_phone
                                if delivery_address: user.delivery_address = delivery_address
                                await session.flush()

                            # Order Status & KHQR Generation
                            if pay_method == "COD":
                                khqr_code = None
                                order_status = "PENDING"
                                msg_notice = f"Order #{sku} placed with Cash on Delivery (COD)! Total: ${total_usd:.2f} ({total_khr:,} ៛) including ${delivery_fee:.2f} delivery. Customer pays driver upon arrival."
                            else:
                                try:
                                    khqr_code = generate_khqr_payload(total_usd)
                                except Exception:
                                    khqr_code = f"00020101021229370016bakong@aba0110tokoai123520459995303840540{total_usd:.2f}5802KH5911TokoAIShop6010Phnom Penh6304ABCD"
                                order_status = "PENDING"
                                msg_notice = f"Order #{sku} created! Total: ${total_usd:.2f} ({total_khr:,} ៛) including ${delivery_fee:.2f} delivery. Please scan Bakong KHQR to complete payment."

                            new_order = Order(
                                shop_id=shop_id,
                                user_id=user.id,
                                items={"sku": prod.sku or sku, "name": prod.name, "qty": qty, "unit_price": price_item},
                                total_amount_usd=total_usd,
                                payment_method=pay_method,
                                delivery_fee_usd=delivery_fee,
                                customer_phone=customer_phone,
                                delivery_address=delivery_address,
                                khqr_string=khqr_code,
                                status=order_status
                            )
                            session.add(new_order)
                            await session.commit()
                            
                            # Also update/create Customer CRM profile
                            try:
                                c_stmt = select(Customer).where(Customer.platform_id == sender_id, Customer.shop_id == shop_id)
                                c_res = await session.execute(c_stmt)
                                c_rec = c_res.scalar_one_or_none()
                                if not c_rec:
                                    c_rec = Customer(
                                        shop_id=shop_id,
                                        platform_id=sender_id,
                                        platform_source="tiktok",
                                        name=f"Customer {sender_id[-4:]}",
                                        phone=customer_phone,
                                        shipping_address=delivery_address,
                                        total_orders=1,
                                        lifetime_value_usd=total_usd if pay_method == "PAID" else 0.0
                                    )
                                    session.add(c_rec)
                                    await session.commit()
                            except Exception:
                                pass
                            
                            tool_result = {
                                "status": "success", 
                                "order_id": new_order.id, 
                                "subtotal_usd": subtotal,
                                "delivery_fee_usd": delivery_fee,
                                "total_usd": total_usd,
                                "total_khr": total_khr,
                                "payment_method": pay_method,
                                "khqr_code": khqr_code,
                                "message_to_user": msg_notice
                            }
                    
                    part_result = types.Part.from_function_response(
                        name="create_order",
                        response=tool_result
                    )
                    
                    final_response = await client.aio.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=[prompt, response.candidates[0].content, part_result],
                        config=types.GenerateContentConfig(tools=[agent_tools])
                    )
                    return final_response.text
                    
            return response.text
        except Exception as e:
            print(f"Gemini error: {e}")
            return "សួស្តីបង! អរគុណសម្រាប់ការទាក់ទងមក TokoAI។ តើបងត្រូវការឱ្យខ្ញុំជួយពិនិត្យមើលម៉ូដ ឬតម្លៃទំនិញណាមួយដែរទេបង?"

async def generate_agent_reply(message_text: str, session=None, shop_id=None, sender_id: str = "sim-customer", conversation_history: list = None) -> str:
    memory = conversation_history or []
    return await run_agent(sender_id, shop_id, message_text, memory)
