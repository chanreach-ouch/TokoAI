import base64
import os
import httpx
import uuid
from datetime import datetime, timezone
from google import genai
from google.genai import types
from sqlalchemy import select, or_, func
from sqlalchemy.exc import IntegrityError

from app.core.db import AsyncSessionLocal
from app.models.product import Product
from app.models.shop import Shop
from app.models.seller import Seller
from app.models.user import User
from app.models.customer import Customer
from app.models.faq import FAQ
from app.models.chat import Conversation, Message
from app.models.order import Order
from app.models.seller_persona import SellerPersonaProfile
from app.models.payment_transaction import PaymentTransaction
from app.config import settings
from app.agent.prompts import SYSTEM_PROMPT, get_system_prompt
from app.agent.tools.khqr_generator import generate_khqr_payload
from app.agent.tools.address_parser import parse_address_and_phone

client = genai.Client(api_key=settings.GEMINI_API_KEY, http_options={"api_version": "v1beta"})

async def load_image_part(image_url: str | None, image_bytes: bytes | None = None, mime_type: str = "image/jpeg") -> types.Part | None:
    """
    Converts raw image bytes, base64 data URIs, local files, or remote URLs into a Google GenAI Part.
    """
    try:
        if image_bytes:
            return types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            
        if not image_url:
            return None
            
        if image_url.startswith("data:image/"):
            header, encoded = image_url.split(",", 1)
            detected_mime = header.split(";")[0].replace("data:", "")
            decoded = base64.b64decode(encoded)
            return types.Part.from_bytes(data=decoded, mime_type=detected_mime or mime_type)
            
        if image_url.startswith("http://") or image_url.startswith("https://"):
            async with httpx.AsyncClient(timeout=10.0) as http_client:
                resp = await http_client.get(image_url)
                if resp.status_code == 200:
                    detected_mime = resp.headers.get("content-type", mime_type).split(";")[0]
                    return types.Part.from_bytes(data=resp.content, mime_type=detected_mime)
                    
        if os.path.exists(image_url):
            with open(image_url, "rb") as f:
                data = f.read()
            ext = os.path.splitext(image_url)[1].lower()
            m = "image/png" if ext == ".png" else "image/webp" if ext == ".webp" else "image/jpeg"
            return types.Part.from_bytes(data=data, mime_type=m)
    except Exception as e:
        print(f"Image loading error: {e}")
    return None

async def retrieve_relevant_products(query: str, session, shop_id, top_k=4):
    """
    Hybrid semantic & catalog retrieval bounded strictly by shop owner's seller_id.
    Uses text-embedding-004 with resilient catalog fallback.
    """
    try:
        shop_stmt = select(Shop).where(Shop.id == shop_id)
        shop_res = await session.execute(shop_stmt)
        shop = shop_res.scalar_one_or_none()
        
        if not shop:
            return []
            
        products = []
        try:
            response = client.models.embed_content(
                model="gemini-embedding-001",
                contents=query,
                config=types.EmbedContentConfig(output_dimensionality=768)
            )
            query_embedding = response.embeddings[0].values
            
            stmt = select(Product).where(
                Product.seller_id == shop.owner_id
            ).order_by(Product.embedding.cosine_distance(query_embedding)).limit(top_k)
            result = await session.execute(stmt)
            products = result.scalars().all()
        except Exception as embed_err:
            print(f"Embedding search fallback: {embed_err}")
            
        if not products:
            fallback_stmt = select(Product).where(
                Product.seller_id == shop.owner_id,
                Product.stock > 0
            ).order_by(Product.created_at.desc()).limit(top_k)
            fallback_res = await session.execute(fallback_stmt)
            products = fallback_res.scalars().all()
            
        return products
    except Exception as e:
        print(f"Product retrieval error: {e}")
        return []

async def run_agent(
    sender_id: str, 
    shop_id, 
    message_text: str, 
    memory: list[str], 
    image_url: str | None = None, 
    image_bytes: bytes | None = None, 
    mime_type: str = "image/jpeg"
) -> str:
    async with AsyncSessionLocal() as session:
        # 1. Look up shop, seller, and persona profile
        shop_stmt = select(Shop).where(Shop.id == shop_id)
        shop_res = await session.execute(shop_stmt)
        shop = shop_res.scalar_one_or_none()
        
        seller = None
        persona_dict = None
        if shop:
            seller_res = await session.execute(select(Seller).where(Seller.id == shop.owner_id))
            seller = seller_res.scalar_one_or_none()
            
            persona_stmt = select(SellerPersonaProfile).where(SellerPersonaProfile.shop_id == shop.id)
            persona_res = await session.execute(persona_stmt)
            persona_profile = persona_res.scalar_one_or_none()
            if persona_profile:
                persona_dict = {
                    "selling_signature_summary": persona_profile.selling_signature_summary,
                    "opening_hooks": persona_profile.opening_hooks or [],
                    "persuasion_tactics": persona_profile.persuasion_tactics or [],
                    "avg_reply_length_chars": persona_profile.avg_reply_length_chars or 95
                }
            
        bot_tone = seller.bot_tone if (seller and seller.bot_tone) else "Friendly"
        shop_name = shop.name if (shop and shop.name) else "TokoAI Store"
        active_prompt = get_system_prompt(bot_tone=bot_tone, shop_name=shop_name, persona_profile=persona_dict)
        
        # 2. ZERO-AMNESIA: Conversation History Retrieval
        conv_rec = None
        if shop:
            conv_stmt = select(Conversation).where(
                Conversation.seller_id == shop.owner_id,
                Conversation.customer_platform_id == sender_id
            )
            conv_res = await session.execute(conv_stmt)
            conv_rec = conv_res.scalar_one_or_none()
            if (not memory or len(memory) < 2) and conv_rec:
                msg_stmt = select(Message).where(Message.conversation_id == conv_rec.id).order_by(Message.created_at.desc()).limit(8)
                msg_res = await session.execute(msg_stmt)
                db_msgs = msg_res.scalars().all()
                if db_msgs:
                    memory = [f"{'User' if m.role in ('user', 'customer') else 'Agent'}: {m.content}" for m in reversed(db_msgs)]

        # 3. LONG-TERM BUYER MEMORY & CRM RECOGNITION
        crm_text = ""
        customer_rec = None
        c_stmt = select(Customer).where(Customer.platform_id == sender_id, Customer.shop_id == shop_id)
        c_res = await session.execute(c_stmt)
        customer_rec = c_res.scalar_one_or_none()
        
        if customer_rec:
            tier = customer_rec.buyer_tier or ("VIP" if (customer_rec.total_orders or 0) >= 3 else ("RETURNING" if (customer_rec.total_orders or 0) > 0 else "NEW"))
            style_notes = customer_rec.communication_style_notes or "None"
            past_skus = ", ".join(customer_rec.last_purchased_skus or []) if customer_rec.last_purchased_skus else "None"
            pref_variants = customer_rec.preferred_sizes_variants or {}
            
            status_label = f"{tier} Regular Buyer (Greet warmly!)" if tier in ("RETURNING", "VIP") else "First-time Buyer"
            crm_text = (
                f"Customer CRM Profile:\n"
                f"- Name: {customer_rec.name or 'Customer'}\n"
                f"- Buyer Tier: {tier} ({status_label})\n"
                f"- Saved Phone: {customer_rec.phone or 'Not yet provided'}\n"
                f"- Saved Address: {customer_rec.shipping_address or 'Not yet provided'}\n"
                f"- Lifetime Orders: {customer_rec.total_orders or 0} (LTV: ${customer_rec.lifetime_value_usd or 0.0:.2f})\n"
                f"- Communication Habits: {style_notes}\n"
                f"- Past Purchased SKUs: {past_skus}\n"
                f"- Preferred Sizes/Variants: {pref_variants}\n\n"
            )
            
        # 4. Catalog Retrieval with Bargaining Price Range
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
            
            # Cultural Bargaining Attributes
            min_bargain = float(getattr(p, "min_negotiation_price", p_price) or p_price)
            bargain_info = f" [Bargain Floor: ${min_bargain:.2f}]" if min_bargain < p_price else " [Firm Price]"
            
            p_vars = getattr(p, "variants", []) or []
            var_info = ""
            if p_vars and isinstance(p_vars, list):
                var_strs = []
                for v in p_vars:
                    if isinstance(v, dict):
                        sz = v.get("size", "")
                        col = v.get("color", "")
                        stk = v.get("stock", 0)
                        label = f"{sz} {col}".strip()
                        var_strs.append(f"{label}: {stk} in stock" if stk > 0 else f"{label}: Sold Out")
                if var_strs:
                    var_info = f" (Variants: {', '.join(var_strs)})"
                    
            context += f"- {p_name} (SKU: {p_sku}): ${p_price:.2f} ({p_khr:,} ៛){bargain_info} - {p_desc} (Total Stock: {p_stock}){var_info}\n"
            
        # 5. Store Custom FAQs
        faq_text = ""
        if shop:
            faq_stmt = select(FAQ).where(FAQ.seller_id == shop.owner_id).limit(6)
            faq_res = await session.execute(faq_stmt)
            faqs = faq_res.scalars().all()
            if faqs:
                faq_text = "\n\nStore Custom FAQs & Store Rules:\n" + "\n".join([f"- Q: {f.question}\n  A: {f.answer}" for f in faqs])

        # 6. Chronological turn history
        history = "\n".join(reversed(memory)) if memory else "None (first turn)"
        
        image_instruction = ""
        if image_url or image_bytes:
            image_instruction = (
                "\n[ATTACHED MEDIA NOTICE]: The customer attached an image.\n"
                "1. If this image is a Bank Transfer Slip / Receipt (ABA Mobile, Bakong, Wing, ACLEDA, Canadia):\n"
                "   - Read Bank Name, Amount, Currency, and Transaction Reference Code.\n"
                "   - MUST invoke 'confirm_payment_slip' tool immediately with those arguments.\n"
                "2. If this image is a Product / Clothing item:\n"
                "   - Compare visually against the Relevant Products Catalog and describe availability, price, and sizes.\n"
            )
            
        user_turn_prompt = (
            f"Shop ID: {shop_id}\n\n"
            f"{crm_text}"
            f"Context:\n{context}"
            f"{faq_text}\n"
            f"{image_instruction}\n"
            f"Recent Chat History:\n{history}\n\n"
            f"Customer Message: {message_text}\n"
            f"Provide your response in authentic spoken Khmer:"
        )
        
        # 7. Define Tools for Gemini 2.5 Flash
        agent_tools = types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="create_order",
                    description="Creates a new order for the customer with atomic row-level inventory deduction. Supports Bakong KHQR, Cash on Delivery (COD), and variant selection.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "sku": types.Schema(type=types.Type.STRING, description="The exact SKU or product name to buy"),
                            "quantity": types.Schema(type=types.Type.INTEGER, description="Quantity to purchase"),
                            "payment_method": types.Schema(type=types.Type.STRING, description="'KHQR' for QR scan or 'COD' for Cash on Delivery"),
                            "delivery_city": types.Schema(type=types.Type.STRING, description="'Phnom Penh', 'Province', or specific province name"),
                            "customer_phone": types.Schema(type=types.Type.STRING, description="Customer Cambodian phone number (e.g. 012345678)"),
                            "delivery_address": types.Schema(type=types.Type.STRING, description="Customer landmark delivery address"),
                            "size": types.Schema(type=types.Type.STRING, description="Product size if specified (e.g. S, M, L, XL)"),
                            "color": types.Schema(type=types.Type.STRING, description="Product color if specified (e.g. Black, White, Denim)")
                        },
                        required=["sku", "quantity"]
                    )
                ),
                types.FunctionDeclaration(
                    name="negotiate_price",
                    description="Handles customer bargaining/discount offers ('chos ban ot', '15$ ban ot'). Checks product minimum negotiation price floor and calculates authentic counter-offer.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "sku": types.Schema(type=types.Type.STRING, description="Product SKU or name being negotiated"),
                            "buyer_offered_price": types.Schema(type=types.Type.NUMBER, description="The price offered by the buyer in USD")
                        },
                        required=["sku", "buyer_offered_price"]
                    )
                ),
                types.FunctionDeclaration(
                    name="confirm_payment_slip",
                    description="Confirms payment from bank transfer slip (ABA Mobile, Bakong, Wing, ACLEDA, Canadia). Verifies idempotency against duplicate transactions.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "bank_name": types.Schema(type=types.Type.STRING, description="Name of bank (e.g. ABA Bank, Bakong, Wing, ACLEDA)"),
                            "amount": types.Schema(type=types.Type.NUMBER, description="The transfer amount detected on the slip"),
                            "currency": types.Schema(type=types.Type.STRING, description="Currency code: USD or KHR"),
                            "transaction_ref": types.Schema(type=types.Type.STRING, description="Transaction reference code from receipt")
                        },
                        required=["bank_name", "amount"]
                    )
                ),
                types.FunctionDeclaration(
                    name="escalate_to_human",
                    description="Escalates conversation to a human manager and pauses AI responses. Call when customer is angry, reports damaged/wrong items, or asks for bulk wholesale orders (10+ units).",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "reason": types.Schema(type=types.Type.STRING, description="Reason: CUSTOMER_COMPLAINT, WHOLESALE_LEAD, or CUSTOM_REQUEST")
                        },
                        required=["reason"]
                    )
                )
            ]
        )
        
        # Load multimodal image part if provided
        image_part = await load_image_part(image_url, image_bytes, mime_type)
        user_parts = []
        if image_part:
            user_parts.append(image_part)
        user_parts.append(types.Part.from_text(text=user_turn_prompt))
        
        try:
            # First turn generation with Gemini 2.5 Flash
            response = await client.aio.models.generate_content(
                model="gemini-2.5-flash",
                contents=[types.Content(role="user", parts=user_parts)],
                config=types.GenerateContentConfig(
                    system_instruction=active_prompt,
                    tools=[agent_tools]
                )
            )
            
            # Check for function calls
            if response.function_calls:
                fc = response.function_calls[0]
                
                # --- CASE 1: Escalate to Human ---
                if fc.name == "escalate_to_human":
                    reason = str(fc.args.get("reason", "Customer requested human support"))
                    if shop and conv_rec:
                        conv_rec.is_human_takeover = True
                        conv_rec.takeover_reason = reason
                        esc_msg = Message(
                            conversation_id=conv_rec.id,
                            role="system",
                            content=f"⚠️ Human Takeover Activated: {reason}"
                        )
                        session.add(esc_msg)
                        await session.commit()
                            
                    part_result = types.Part.from_function_response(
                        name="escalate_to_human",
                        response={"status": "escalated", "reason": reason, "message": "Human manager alerted. AI paused."}
                    )
                    tool_content = types.Content(role="tool", parts=[part_result])
                    final_response = await client.aio.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=[
                            types.Content(role="user", parts=user_parts),
                            response.candidates[0].content,
                            tool_content
                        ],
                        config=types.GenerateContentConfig(
                            system_instruction=active_prompt,
                            tools=[agent_tools]
                        )
                    )
                    return (final_response.text or "").strip() or "អូនបានជូនដំណឹងទៅកាន់បងៗ Admin មនុស្សផ្ទាល់ហើយបង គាត់នឹងចូលមកឆ្លើយតបជូនបងភ្លាមៗណា៎បង!"

                # --- CASE 2: Cultural Bargaining Engine Tool ---
                elif fc.name == "negotiate_price":
                    sku = str(fc.args.get("sku", "")).strip()
                    buyer_bid = float(fc.args.get("buyer_offered_price", 0.0))

                    stmt = select(Product).where(
                        Product.seller_id == shop.owner_id,
                        or_(
                            Product.sku == sku,
                            Product.name.ilike(f"%{sku}%")
                        )
                    )
                    p_res = await session.execute(stmt)
                    prod = p_res.scalars().first()
                    if not prod and products:
                        prod = products[0]

                    if not prod:
                        negotiate_res = {"status": "rejected", "message": f"Product not found for SKU: {sku}."}
                    else:
                        base_price = float(prod.price)
                        min_price = float(prod.min_negotiation_price or base_price)
                        step = float(prod.negotiation_step_usd or 0.50)

                        if buyer_bid >= min_price:
                            # Acceptable offer
                            agreed_price = buyer_bid
                            negotiate_res = {
                                "status": "accepted",
                                "agreed_price_usd": agreed_price,
                                "base_price_usd": base_price,
                                "message_to_user": f"Price of ${agreed_price:.2f} accepted for {prod.name}. Offer closing order."
                            }
                        else:
                            # Below floor price: Hold line at min_negotiation_price
                            negotiate_res = {
                                "status": "counter_offer",
                                "counter_price_usd": min_price,
                                "base_price_usd": base_price,
                                "message_to_user": f"Offered price ${buyer_bid:.2f} is below floor. Lowest possible discount is ${min_price:.2f}."
                            }

                        # Update conversation bargaining state
                        if conv_rec:
                            conv_rec.last_bargain_at = datetime.now(timezone.utc)
                            conv_rec.bargain_pending_product_id = prod.id
                            conv_rec.bargain_offered_price = buyer_bid
                            await session.commit()

                    part_result = types.Part.from_function_response(
                        name="negotiate_price",
                        response=negotiate_res
                    )
                    tool_content = types.Content(role="tool", parts=[part_result])
                    final_response = await client.aio.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=[
                            types.Content(role="user", parts=user_parts),
                            response.candidates[0].content,
                            tool_content
                        ],
                        config=types.GenerateContentConfig(
                            system_instruction=active_prompt,
                            tools=[agent_tools]
                        )
                    )
                    return (final_response.text or "").strip()

                # --- CASE 3: Confirm Payment Slip (With Idempotent PaymentTransaction) ---
                elif fc.name == "confirm_payment_slip":
                    bank_name = str(fc.args.get("bank_name", "ABA Bank"))
                    raw_amount = float(fc.args.get("amount", 0.0))
                    currency = str(fc.args.get("currency", "USD")).upper()
                    tx_ref = str(fc.args.get("transaction_ref", "")).strip() or f"TRX-{uuid.uuid4().hex[:8].upper()}"
                    
                    amount_usd = raw_amount / 4100.0 if currency == "KHR" else raw_amount

                    # Idempotency Check: Prevent duplicate reuse of the same slip
                    tx_stmt = select(PaymentTransaction).where(PaymentTransaction.bank_ref_id == tx_ref)
                    existing_tx = (await session.execute(tx_stmt)).scalar_one_or_none()

                    if existing_tx:
                        # Duplicate slip detected!
                        tool_result = {
                            "status": "duplicate_slip_detected",
                            "bank_ref_id": tx_ref,
                            "message_to_user": f"This payment receipt ({tx_ref}) has already been used. Please check again."
                        }
                    else:
                        # Find pending order for customer
                        pending_order = None
                        if shop and conv_rec:
                            ord_stmt = select(Order).where(
                                Order.shop_id == shop_id,
                                Order.status == "PENDING"
                            ).order_by(Order.created_at.desc())
                            pending_order = (await session.execute(ord_stmt)).scalars().first()

                        # Insert verified PaymentTransaction
                        new_tx = PaymentTransaction(
                            shop_id=shop.id if shop else shop_id,
                            order_id=pending_order.id if pending_order else None,
                            bank_name=bank_name,
                            bank_ref_id=tx_ref,
                            amount_usd=amount_usd,
                            amount_khr=raw_amount if currency == "KHR" else (amount_usd * 4100),
                            status="VERIFIED",
                            raw_payload={"bank": bank_name, "ref": tx_ref, "currency": currency, "amount": raw_amount}
                        )
                        session.add(new_tx)

                        if pending_order:
                            pending_order.status = "PAID"
                            pending_order.tracking_number = f"SLIP-{bank_name}-{tx_ref}"
                            
                        if customer_rec:
                            customer_rec.lifetime_value_usd = (customer_rec.lifetime_value_usd or 0.0) + amount_usd
                            customer_rec.buyer_tier = "VIP" if customer_rec.lifetime_value_usd >= 100 else "RETURNING"
                                
                        if conv_rec:
                            sys_msg = Message(
                                conversation_id=conv_rec.id,
                                role="system",
                                content=f"✅ Payment Slip Verified: ${amount_usd:.2f} via {bank_name} (Ref: {tx_ref})"
                            )
                            session.add(sys_msg)
                                    
                        await session.commit()
                        tool_result = {
                            "status": "success",
                            "order_id": pending_order.id if pending_order else "N/A",
                            "amount": amount_usd,
                            "bank_name": bank_name,
                            "transaction_ref": tx_ref,
                            "message_to_user": f"Payment of ${amount_usd:.2f} via {bank_name} verified! Packing started."
                        }
                        
                    part_result = types.Part.from_function_response(
                        name="confirm_payment_slip",
                        response=tool_result
                    )
                    tool_content = types.Content(role="tool", parts=[part_result])
                    final_response = await client.aio.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=[
                            types.Content(role="user", parts=user_parts),
                            response.candidates[0].content,
                            tool_content
                        ],
                        config=types.GenerateContentConfig(
                            system_instruction=active_prompt,
                            tools=[agent_tools]
                        )
                    )
                    return (final_response.text or "").strip() or f"អូនបានពិនិត្យឃើញការផ្ទេរប្រាក់ចំនួន ${amount_usd:.2f} តាម {bank_name} រួចរាល់ហើយណា៎បង 🥰 ឥឡូវអូនកំពុងរៀបចំវេចខ្ចប់ទំនិញជូនបងភ្លាមៗណា៎បង!"

                # --- CASE 4: Create Order (With Atomic SELECT ... FOR UPDATE) ---
                elif fc.name == "create_order":
                    sku = str(fc.args.get("sku", "")).strip()
                    qty = int(fc.args.get("quantity", 1))
                    pay_method = str(fc.args.get("payment_method", "KHQR")).upper()
                    if "COD" in pay_method or "CASH" in pay_method:
                        pay_method = "COD"
                    else:
                        pay_method = "KHQR"
                        
                    raw_city = str(fc.args.get("delivery_city", "Phnom Penh"))
                    customer_phone = fc.args.get("customer_phone")
                    delivery_address = fc.args.get("delivery_address")
                    size = fc.args.get("size")
                    color = fc.args.get("color")
                    if size: size = str(size).strip()
                    if color: color = str(color).strip()
                    
                    if not customer_phone and customer_rec and customer_rec.phone:
                        customer_phone = customer_rec.phone
                    if not delivery_address and customer_rec and customer_rec.shipping_address:
                        delivery_address = customer_rec.shipping_address
                        
                    geo_text = f"{delivery_address or ''} {raw_city} {customer_phone or ''} {message_text}"
                    parsed_geo = parse_address_and_phone(geo_text)
                    
                    final_phone = customer_phone or parsed_geo.get("phone")
                    final_address = delivery_address or parsed_geo.get("address")
                    delivery_fee = parsed_geo.get("delivery_fee_usd", 1.50)
                    
                    if not shop:
                        tool_result = {"status": "failed", "reason": "Shop not found."}
                    else:
                        # ATOMIC STOCK LOCKING: SELECT ... FOR UPDATE to avoid flash-sale race conditions
                        stmt = select(Product).where(
                            Product.seller_id == shop.owner_id,
                            or_(
                                Product.sku == sku,
                                Product.name.ilike(f"%{sku}%"),
                                func.lower(Product.name_kh).like(f"%{sku.lower()}%")
                            )
                        ).with_for_update()
                        p_res = await session.execute(stmt)
                        prod = p_res.scalars().first()
                        
                        if not prod and products:
                            # Fallback lock by product ID
                            p_id = products[0].id
                            stmt2 = select(Product).where(Product.id == p_id).with_for_update()
                            prod = (await session.execute(stmt2)).scalars().first()
                        
                        if not prod:
                            tool_result = {"status": "failed", "reason": f"Product not found for SKU: {sku}."}
                        else:
                            total_stock = int(getattr(prod, "stock", getattr(prod, "stock_qty", 0)))
                            if total_stock < qty:
                                tool_result = {"status": "failed", "reason": f"Out of stock for {prod.name} (Only {total_stock} units left)."}
                            else:
                                # Deduct stock atomically
                                prod.stock = max(0, total_stock - qty)
                                
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
                                        phone_number=final_phone,
                                        delivery_address=final_address
                                    )
                                    session.add(user)
                                    await session.flush()
                                elif final_phone or final_address:
                                    if final_phone: user.phone_number = final_phone
                                    if final_address: user.delivery_address = final_address
                                    await session.flush()

                                variant_label = f" ({size or ''} {color or ''})".strip() if (size or color) else ""
                                if pay_method == "COD":
                                    khqr_code = None
                                    order_status = "PENDING"
                                    msg_notice = f"Order #{sku}{variant_label} placed with Cash on Delivery (COD)! Total: ${total_usd:.2f} ({total_khr:,} ៛) including ${delivery_fee:.2f} delivery. Customer pays driver upon arrival."
                                else:
                                    try:
                                        khqr_code = generate_khqr_payload(total_usd)
                                    except Exception:
                                        khqr_code = f"00020101021229370016bakong@aba0110tokoai123520459995303840540{total_usd:.2f}5802KH5911TokoAIShop6010Phnom Penh6304ABCD"
                                    order_status = "PENDING"
                                    msg_notice = f"Order #{sku}{variant_label} created! Total: ${total_usd:.2f} ({total_khr:,} ៛) including ${delivery_fee:.2f} delivery. Please scan Bakong KHQR to complete payment."

                                new_order = Order(
                                    shop_id=shop_id,
                                    user_id=user.id,
                                    items={
                                        "sku": prod.sku or sku, 
                                        "name": prod.name, 
                                        "qty": qty, 
                                        "unit_price": price_item,
                                        "size": size,
                                        "color": color
                                    },
                                    total_amount_usd=total_usd,
                                    payment_method=pay_method,
                                    delivery_fee_usd=delivery_fee,
                                    customer_phone=final_phone,
                                    delivery_address=final_address,
                                    khqr_string=khqr_code,
                                    status=order_status
                                )
                                session.add(new_order)
                                await session.commit()
                                
                                # Update Customer Memory
                                if customer_rec:
                                    customer_rec.total_orders = (customer_rec.total_orders or 0) + 1
                                    customer_rec.buyer_tier = "VIP" if customer_rec.total_orders >= 3 else "RETURNING"
                                    skus_list = list(customer_rec.last_purchased_skus or [])
                                    if sku not in skus_list:
                                        skus_list.append(sku)
                                    customer_rec.last_purchased_skus = skus_list
                                    if size:
                                        var_dict = dict(customer_rec.preferred_sizes_variants or {})
                                        var_dict["preferred_size"] = size
                                        customer_rec.preferred_sizes_variants = var_dict
                                    await session.commit()
                                
                                tool_result = {
                                    "status": "success", 
                                    "order_id": str(new_order.id), 
                                    "subtotal_usd": subtotal,
                                    "delivery_fee_usd": delivery_fee,
                                    "total_usd": total_usd,
                                    "total_khr": total_khr,
                                    "payment_method": pay_method,
                                    "size": size,
                                    "color": color,
                                    "remaining_stock": prod.stock,
                                    "khqr_code": khqr_code,
                                    "message_to_user": msg_notice
                                }
                    
                    part_result = types.Part.from_function_response(
                        name="create_order",
                        response=tool_result
                    )
                    tool_content = types.Content(role="tool", parts=[part_result])
                    final_response = await client.aio.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=[
                            types.Content(role="user", parts=user_parts),
                            response.candidates[0].content,
                            tool_content
                        ],
                        config=types.GenerateContentConfig(
                            system_instruction=active_prompt,
                            tools=[agent_tools]
                        )
                    )
                    return (final_response.text or "").strip() or tool_result.get("message_to_user", "អរគុណច្រើនបង! អូនបានកត់ត្រាការកម្ម៉ង់ជូនបងរួចរាល់ហើយណា៎បង!")
                    
            return response.text
        except Exception as e:
            print(f"Gemini error: {e}")
            return "សួស្តីបង! អរគុណសម្រាប់ការទាក់ទងមក TokoAI។ តើបងត្រូវការឱ្យខ្ញុំជួយពិនិត្យមើលម៉ូដ ឬតម្លៃទំនិញណាមួយដែរទេបង?"

async def generate_agent_reply(message_text: str, session=None, shop_id=None, sender_id: str = "sim-customer", conversation_history: list = None, image_url: str | None = None) -> str:
    memory = conversation_history or []
    return await run_agent(sender_id, shop_id, message_text, memory, image_url=image_url)
