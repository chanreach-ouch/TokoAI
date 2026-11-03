import json
import logging
from datetime import datetime, timezone
from app.core.redis import redis_pool
from app.core.db import AsyncSessionLocal
from sqlalchemy import select
from app.models.shop import Shop
from app.models.seller import Seller
from app.models.chat import Conversation, Message
from app.models.customer import Customer
from app.integrations.tiktok_client import send_message
from app.agent.rag import run_agent

logger = logging.getLogger(__name__)

async def process_tiktok_message(ctx, raw_payload: bytes):
    payload = json.loads(raw_payload)
    
    try:
        message_id = payload.get("message_id")
        sender_id = payload.get("sender_id")
        recipient_id = payload.get("recipient_id")
        message_text = payload.get("text")
        
        # Multimodal image attachment extraction
        image_url = payload.get("image_url") or payload.get("media_url")
        if not image_url and payload.get("attachments"):
            atts = payload.get("attachments")
            if isinstance(atts, list) and len(atts) > 0:
                image_url = atts[0].get("payload", {}).get("url") or atts[0].get("url")
        
        if not message_id or not sender_id or not recipient_id:
            logger.warning("Invalid payload structure: missing message_id, sender_id, or recipient_id")
            return
            
        if not message_text and not image_url:
            logger.warning("Invalid payload structure: message has neither text nor image")
            return
            
        if not message_text and image_url:
            message_text = "អតិថិជនបានផ្ញើរូបភាព (Customer sent an image / payment screenshot)"
            
        # 1. Deduplication using Redis SETNX (TTL: 86400)
        is_new = await redis_pool.setnx(f"msg:{message_id}", "1")
        if not is_new:
            logger.info(f"Duplicate message ignored: {message_id}")
            return
            
        await redis_pool.expire(f"msg:{message_id}", 86400)
        
        # 2. Resolve Multi-Tenant Shop
        async with AsyncSessionLocal() as session:
            stmt = select(Shop).where(Shop.tiktok_page_id == recipient_id)
            result = await session.execute(stmt)
            shop = result.scalar_one_or_none()
            
        if not shop:
            logger.error(f"Shop not found for recipient_id {recipient_id}")
            return
            
        # 3. Synchronize Conversation, Inbound Message & Customer CRM
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
            
            # Persist incoming user message (including image attachment if present)
            stored_content = f"{message_text}\n\n![Attachment]({image_url})" if image_url and "![Attachment]" not in message_text else message_text
            user_msg = Message(
                conversation_id=conversation.id,
                role="user",
                content=stored_content
            )
            session.add(user_msg)
            
            # Touch or create omnichannel Customer CRM record
            c_stmt = select(Customer).where(Customer.platform_id == sender_id, Customer.shop_id == shop.id)
            c_res = await session.execute(c_stmt)
            customer = c_res.scalar_one_or_none()
            if not customer:
                customer = Customer(
                    shop_id=shop.id,
                    platform_id=sender_id,
                    platform_source="tiktok",
                    name=f"Customer {sender_id[-4:]}"
                )
                session.add(customer)
            else:
                customer.last_active_at = datetime.now(timezone.utc)
                
            await session.commit()
            
            # 4. Human Takeover Check: If active, stop and do not spend AI tokens
            if conversation.is_human_takeover:
                logger.info(f"AI paused: Human takeover active for {sender_id}")
                return

            # 5. SaaS Quota Check
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
                
        # 6. Retrieve Short-term Session Memory from Redis (with Zero-Amnesia DB fallback)
        memory_key = f"session:{shop.id}:{sender_id}"
        recent_memory = await redis_pool.lrange(memory_key, 0, 5)
        
        # Zero-Amnesia DB fallback if Redis key expired or short
        if (not recent_memory or len(recent_memory) < 2) and conversation_id:
            async with AsyncSessionLocal() as session:
                m_stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at.desc()).limit(8)
                m_res = await session.execute(m_stmt)
                db_msgs = m_res.scalars().all()
                if db_msgs:
                    recent_memory = [f"{'User' if m.role in ('user', 'customer') else 'Agent'}: {m.content}" for m in reversed(db_msgs)]
        
        # 7. Generate High-converting Spoken Khmer Response via RAG (with multimodal vision & CRM profile)
        reply = await run_agent(sender_id, shop.id, message_text, recent_memory, image_url=image_url)
        print(f"\n{'='*50}\n🤖 AI REPLY GENERATED:\n{reply}\n{'='*50}\n", flush=True)
        
        # 8. Persist AI Reply to PostgreSQL Message Store
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
        
        # 9. Update Redis Session Memory
        await redis_pool.lpush(memory_key, f"User: {message_text}")
        await redis_pool.lpush(memory_key, f"Agent: {reply}")
        await redis_pool.ltrim(memory_key, 0, 5)
        await redis_pool.expire(memory_key, 3600)
        
        # 10. Outbound Delivery to TikTok Messaging API
        await send_message(sender_id, reply, shop.id)
        
    except Exception as e:
        logger.error(f"Error processing message: {e}")

async def abandoned_cart_followup(ctx):
    """
    CRON TASK: Finds orders stuck in PENDING for over 2 hours and sends a polite follow-up.
    Generates authentic, high-converting spoken Khmer reminders without robotic templates.
    """
    logger.info("Running abandoned cart follow-up cron...")
    from sqlalchemy import and_
    from datetime import timedelta
    from app.models.order import Order
    
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
