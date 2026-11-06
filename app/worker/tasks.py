import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List

from sqlalchemy import select, and_, or_
from app.core.redis import redis_pool
from app.core.db import AsyncSessionLocal
from app.core.debouncer import push_and_debounce
from app.services.voice_service import transcribe_khmer_voice_note
from app.models.shop import Shop
from app.models.seller import Seller
from app.models.chat import Conversation, Message
from app.models.customer import Customer
from app.models.order import Order
from app.models.product import Product
from app.integrations.tiktok_client import send_message
from app.agent.rag import run_agent

logger = logging.getLogger(__name__)

async def process_tiktok_message(ctx, raw_payload: bytes):
    """
    ARQ Worker Task: Processes inbound TikTok & Facebook DMs with:
    1. Deduplication (SETNX)
    2. Redis 2.5s Sliding Window Debouncer (collapses rapid burst messages into 1 turn)
    3. Multimodal Voice Note STT (Gemini 2.5 Flash)
    4. Rule-Based Smart Escalation Handover
    5. Spoken Khmer AI Sales Closer via RAG
    6. Modality Adaptation (Voice / Text)
    """
    payload = json.loads(raw_payload)
    
    try:
        message_id = payload.get("message_id")
        sender_id = payload.get("sender_id")
        recipient_id = payload.get("recipient_id")
        message_text = payload.get("text") or ""
        
        # Audio / Voice Note extraction
        audio_url = payload.get("audio_url")
        # Image attachment extraction
        image_url = payload.get("image_url") or payload.get("media_url")
        
        if payload.get("attachments") and isinstance(payload.get("attachments"), list):
            for att in payload.get("attachments"):
                att_type = att.get("type", "").lower()
                att_url = att.get("payload", {}).get("url") or att.get("url")
                if "audio" in att_type or (att_url and any(att_url.endswith(ext) for ext in [".ogg", ".mp4", ".wav", ".m4a", ".mp3"])):
                    audio_url = att_url
                elif "image" in att_type or (att_url and any(att_url.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"])):
                    image_url = att_url
        
        if not message_id or not sender_id or not recipient_id:
            logger.warning("Invalid payload structure: missing message_id, sender_id, or recipient_id")
            return
            
        # 1. Deduplication using Redis SETNX (TTL: 86400)
        is_new = await redis_pool.setnx(f"msg:{message_id}", "1")
        if not is_new:
            logger.info(f"Duplicate message ignored: {message_id}")
            return
        await redis_pool.expire(f"msg:{message_id}", 86400)
        
        # 2. Redis 2.5s Sliding Window Debouncer
        # Buffer rapid messages into single conversational turn
        incoming_item = {
            "message_id": message_id,
            "text": message_text,
            "image_url": image_url,
            "audio_url": audio_url
        }
        
        elected_batch = await push_and_debounce(recipient_id, sender_id, incoming_item)
        if elected_batch is None:
            # Yield: A newer message arrived during 2.5s debounce; that worker will close the batch
            return
            
        # We are the elected closer for this batch! Consolidate texts and media
        combined_texts = []
        batch_image_url = None
        batch_audio_url = None
        
        for msg in elected_batch:
            t = (msg.get("text") or "").strip()
            if t:
                combined_texts.append(t)
            if not batch_image_url and msg.get("image_url"):
                batch_image_url = msg.get("image_url")
            if not batch_audio_url and msg.get("audio_url"):
                batch_audio_url = msg.get("audio_url")
                
        consolidated_text = "\n".join(combined_texts)
        voice_transcription = None
        audio_duration = 0.0
        
        # 3. Multimodal Voice Note STT with Gemini 2.5 Flash
        if batch_audio_url:
            voice_transcription, audio_duration = await transcribe_khmer_voice_note(audio_url=batch_audio_url)
            if voice_transcription:
                prefix = f"🎤 [Voice Note]: \"{voice_transcription}\""
                consolidated_text = f"{prefix}\n{consolidated_text}".strip()
                
        if not consolidated_text and batch_image_url:
            consolidated_text = "អតិថិជនបានផ្ញើរូបភាព (Customer sent an image / payment screenshot)"
            
        if not consolidated_text and not batch_image_url and not batch_audio_url:
            logger.warning("Empty batch after debouncing, skipping.")
            return

        # 4. Resolve Multi-Tenant Shop
        async with AsyncSessionLocal() as session:
            stmt = select(Shop).where(or_(Shop.tiktok_page_id == recipient_id, Shop.facebook_page_id == recipient_id))
            result = await session.execute(stmt)
            shop = result.scalar_one_or_none()
            if not shop:
                # Fallback match by ID
                try:
                    shop_uuid = uuid.UUID(recipient_id)
                    stmt_id = select(Shop).where(Shop.id == shop_uuid)
                    shop = (await session.execute(stmt_id)).scalar_one_or_none()
                except Exception:
                    pass
            
        if not shop:
            logger.error(f"Shop not found for recipient_id {recipient_id}")
            return
            
        # 5. Synchronize Conversation, Messages & Customer CRM
        conversation_id = None
        async with AsyncSessionLocal() as session:
            stmt = select(Conversation).where(
                Conversation.seller_id == shop.owner_id, 
                Conversation.customer_platform_id == sender_id
            )
            result = await session.execute(stmt)
            conversation = result.scalar_one_or_none()
            
            if not conversation:
                conversation = Conversation(
                    seller_id=shop.owner_id,
                    customer_platform_id=sender_id,
                    is_human_takeover=False
                )
                session.add(conversation)
                await session.flush()
                
            conversation_id = conversation.id
            
            # Persist incoming user message
            stored_content = consolidated_text
            if batch_image_url and "![Attachment]" not in stored_content:
                stored_content = f"{stored_content}\n\n![Attachment]({batch_image_url})"
                
            user_msg = Message(
                conversation_id=conversation.id,
                role="user",
                content=stored_content,
                media_type="audio" if batch_audio_url else ("image" if batch_image_url else "text"),
                media_url=batch_audio_url or batch_image_url,
                audio_duration_sec=audio_duration if batch_audio_url else None,
                transcription=voice_transcription
            )
            session.add(user_msg)
            
            # Touch or create omnichannel Customer CRM record
            c_stmt = select(Customer).where(Customer.platform_id == sender_id, Customer.shop_id == shop.id)
            customer = (await session.execute(c_stmt)).scalar_one_or_none()
            if not customer:
                customer = Customer(
                    shop_id=shop.id,
                    platform_id=sender_id,
                    platform_source="tiktok" if not shop.facebook_page_id else "messenger",
                    name=f"Customer {sender_id[-4:]}",
                    buyer_tier="NEW"
                )
                session.add(customer)
            else:
                customer.last_active_at = datetime.now(timezone.utc)
                if batch_audio_url and "prefers voice" not in (customer.communication_style_notes or ""):
                    customer.communication_style_notes = f"{customer.communication_style_notes or ''}, prefers voice notes".strip(", ")
                    
            await session.commit()
            
            # 6. Human Takeover Check: If already active, abort immediately
            if conversation.is_human_takeover:
                logger.info(f"AI paused: Human takeover active for {sender_id} (Reason: {conversation.takeover_reason})")
                return

            # 7. RULE-BASED SMART ESCALATION ENGINE
            escalation_rules = shop.escalation_rules or {
                "bulk_order_threshold_qty": 10,
                "bulk_order_threshold_usd": 100.0,
                "escalate_on_complaint": True,
                "custom_trigger_keywords": ["refund", "fake", "broken", "complaint", "ខូច", "បោក", "ជួប admin"]
            }
            
            escalation_reason = None
            text_lower = consolidated_text.lower()
            
            # Check custom trigger keywords
            custom_kws = escalation_rules.get("custom_trigger_keywords") or []
            for kw in custom_kws:
                if kw.lower() in text_lower:
                    escalation_reason = "CUSTOMER_COMPLAINT" if any(w in kw.lower() for w in ["refund", "fake", "broken", "ខូច", "បោក"]) else "CUSTOM_KEYWORD"
                    break
                    
            # Check complaint intent
            if not escalation_reason and escalation_rules.get("escalate_on_complaint"):
                complaint_words = ["ខូច", "មិនដូចរូប", "បោក", "សងលុយ", "ចង់ជួបមនុស្ស", "ខឹង", "ប្តឹង", "complaint", "scam"]
                if any(w in text_lower for w in complaint_words):
                    escalation_reason = "CUSTOMER_COMPLAINT"
                    
            # Check wholesale / bulk lead intent
            wholesale_words = ["យកបោះដុំ", "តម្លៃបោះដុំ", "យក10", "យក20", "យក50", "យក100", "wholesale", "bulk"]
            if not escalation_reason and any(w in text_lower for w in wholesale_words):
                escalation_reason = "WHOLESALE_LEAD"
                
            if escalation_reason:
                conversation.is_human_takeover = True
                conversation.takeover_reason = escalation_reason
                session.add(Message(
                    conversation_id=conversation.id,
                    role="system",
                    content=f"⚠️ Smart Escalation Activated: {escalation_reason}"
                ))
                await session.commit()
                
                # Send polite notification to buyer that human manager is on the way
                esc_reply = "អរគុណបង! អូនបានបញ្ជូនសារនេះទៅកាន់បងៗ Admin មនុស្សផ្ទាល់ហើយបង គាត់នឹងចូលមកឆ្លើយតបជូនបងភ្លាមៗណា៎បង!"
                await send_message(sender_id, esc_reply, shop.id)
                return

            # 8. SaaS Quota Check
            seller_stmt = select(Seller).where(Seller.id == shop.owner_id)
            seller_result = await session.execute(seller_stmt)
            seller = seller_result.scalar_one_or_none()
            
            if seller and seller.ai_token_usage >= seller.ai_message_limit:
                await send_message(
                    sender_id, 
                    "សុំទោសបង ពេលនេះប្រព័ន្ធ AI របស់យើងកំពុងរវល់។ ក្រុមការងារយើងនឹងតបត្រលប់ទៅវិញក្នុងពេលឆាប់ៗនេះ។ (AI Quota Exceeded)", 
                    shop.id
                )
                logger.warning(f"AI Quota exceeded for shop {shop.id}")
                return
                
            # Increment quota
            if seller:
                seller.ai_token_usage += 1
                await session.commit()
                
        # 9. Session Memory Retrieval (with Zero-Amnesia DB fallback)
        memory_key = f"session:{shop.id}:{sender_id}"
        recent_memory = await redis_pool.lrange(memory_key, 0, 5)
        
        if (not recent_memory or len(recent_memory) < 2) and conversation_id:
            async with AsyncSessionLocal() as session:
                m_stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at.desc()).limit(8)
                m_res = await session.execute(m_stmt)
                db_msgs = m_res.scalars().all()
                if db_msgs:
                    recent_memory = [f"{'User' if m.role in ('user', 'customer') else 'Agent'}: {m.content}" for m in reversed(db_msgs)]
        
        # 10. Generate High-Converting Spoken Khmer Response via RAG
        reply = await run_agent(sender_id, shop.id, consolidated_text, recent_memory, image_url=batch_image_url)
        print(f"\n{'='*50}\n🤖 AI REPLY GENERATED:\n{reply}\n{'='*50}\n", flush=True)
        
        # 11. Persist AI Reply to Message Store
        if conversation_id:
            async with AsyncSessionLocal() as session:
                ai_msg = Message(
                    conversation_id=conversation_id,
                    role="ai",
                    content=reply
                )
                session.add(ai_msg)
                
                conv_upd_stmt = select(Conversation).where(Conversation.id == conversation_id)
                conv_upd_res = await session.execute(conv_upd_stmt)
                conv_to_upd = conv_upd_res.scalar_one_or_none()
                if conv_to_upd:
                    conv_to_upd.updated_at = datetime.now(timezone.utc)
                    
                await session.commit()
        
        # 12. Update Redis Session Memory
        await redis_pool.lpush(memory_key, f"User: {consolidated_text}")
        await redis_pool.lpush(memory_key, f"Agent: {reply}")
        await redis_pool.ltrim(memory_key, 0, 5)
        await redis_pool.expire(memory_key, 3600)
        
        # 13. Outbound Delivery
        await send_message(sender_id, reply, shop.id)
        
    except Exception as e:
        logger.error(f"Error processing message: {e}")

async def abandoned_bargain_followup(ctx):
    """
    CRON TASK: Identifies price-negotiated inquiries that stalled 45 to 90 minutes ago
    and sends an authentic spoken Khmer win-back discount offer.
    """
    logger.info("Running cultural bargaining win-back follow-up cron...")
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(minutes=90)
    window_end = now - timedelta(minutes=45)
    
    async with AsyncSessionLocal() as session:
        # Find conversations with recent bargain but no subsequent order
        stmt = select(Conversation).where(
            and_(
                Conversation.last_bargain_at != None,
                Conversation.last_bargain_at >= window_start,
                Conversation.last_bargain_at <= window_end,
                Conversation.is_human_takeover == False
            )
        )
        res = await session.execute(stmt)
        bargains = res.scalars().all()
        
        for conv in bargains:
            try:
                # Check if customer already placed an order since bargaining
                ord_stmt = select(Order).where(
                    Order.created_at >= conv.last_bargain_at,
                    Order.status != "CANCELLED"
                )
                placed_order = (await session.execute(ord_stmt)).scalars().first()
                if placed_order:
                    continue
                    
                prod_name = "ម៉ូដនេះ"
                if conv.bargain_pending_product_id:
                    p_res = await session.execute(select(Product).where(Product.id == conv.bargain_pending_product_id))
                    p = p_res.scalar_one_or_none()
                    if p:
                        prod_name = p.name
                        
                offered_price = conv.bargain_offered_price or 15.0
                winback_msg = (
                    f"សួស្តីបង! អូនឃើញបងចាប់អារម្មណ៍ {prod_name} កាលពីអម្បាញ់មិញ 🥰 "
                    f"ឥឡូវបងយកទេ អូនជួយបញ្ចុះជូនពិសេស ${offered_price:.2f} ផ្ញើជូនបងឥឡូវនេះតែម្ដងណា៎បង! "
                    f"តើបងចង់ឱ្យអូនរៀបចំផ្ញើជូនទៅទីតាំងណាដែរចា៎? ✨"
                )
                
                # Fetch shop
                shop_stmt = select(Shop).where(Shop.owner_id == conv.seller_id)
                shop = (await session.execute(shop_stmt)).scalars().first()
                if shop:
                    await send_message(conv.customer_platform_id, winback_msg, shop.id)
                    session.add(Message(conversation_id=conv.id, role="ai", content=winback_msg))
                    conv.last_bargain_at = None # Clear bargain latch so we don't spam
                    await session.commit()
                    logger.info(f"Sent bargaining win-back message to {conv.customer_platform_id}")
            except Exception as e:
                logger.error(f"Error in bargain follow-up for conv {conv.id}: {e}")

async def abandoned_cart_followup(ctx):
    """
    CRON TASK: Finds orders stuck in PENDING for over 2 hours and sends an authentic spoken Khmer reminder.
    """
    logger.info("Running abandoned cart follow-up cron...")
    two_hours_ago = datetime.now(timezone.utc) - timedelta(hours=2)
    twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)
    
    async with AsyncSessionLocal() as session:
        stmt = select(Order).where(
            and_(
                Order.status == 'PENDING',
                Order.created_at < two_hours_ago,
                Order.created_at > twenty_four_hours_ago,
                Order.waybill_url == None
            )
        )
        result = await session.execute(stmt)
        orders = result.scalars().all()
        
        for order in orders:
            try:
                cust_res = await session.execute(select(Customer).where(Customer.id == order.user_id))
                customer = cust_res.scalar_one_or_none()
                
                if customer:
                    item_name = "ទំនិញ"
                    if order.items and isinstance(order.items, dict):
                        item_name = order.items.get("name") or "ទំនិញ"
                        
                    follow_up_msg = (
                        f"សួស្តីបង {customer.name or ''}! ឃើញបងបានកក់ {item_name} ទុក ខ្លាចដាច់ស្តុកមុនណា៎បង "
                        f"ចង់ឱ្យប្អូនរៀបចំខ្ចប់ផ្ញើជូនឥឡូវនេះអត់បង? បើបងមិនទាន់ស្រួលវេរលុយ បងអាចជ្រើសរើសទូទាត់ពេលអ្នកដឹកជញ្ជូនយកទៅដល់ផ្ទាល់ (COD) ក៏បានដែរណា៎បង 🥰"
                    )
                    
                    await send_message(customer.platform_id, follow_up_msg, order.shop_id)
                    logger.info(f"Sent follow-up for Order #{order.id}")
                    
                    order.status = "PENDING_FOLLOWED_UP"
                    await session.commit()
            except Exception as e:
                logger.error(f"Failed to follow up order {order.id}: {e}")
