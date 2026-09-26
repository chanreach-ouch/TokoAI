import json
import logging
from app.core.redis import redis_pool
from app.core.db import AsyncSessionLocal

logger = logging.getLogger(__name__)

async def process_tiktok_message(ctx, raw_payload: bytes):
    payload = json.loads(raw_payload)
    
    try:
        # Check standard layout for events
        # Often it is under 'event', but let's assume it's data for this implementation
        # Actually standard TikTok is often at root or 'message'
        message_id = payload.get("message_id")
        sender_id = payload.get("sender_id")
        recipient_id = payload.get("recipient_id")
        message_text = payload.get("text")
        
        if not message_id or not sender_id or not message_text or not recipient_id:
            logger.warning("Invalid payload structure")
            return
            
        # Deduplication using Redis SETNX (TTL: 86400)
        is_new = await redis_pool.setnx(f"msg:{message_id}", "1")
        if not is_new:
            logger.info(f"Duplicate message ignored: {message_id}")
            return
            
        await redis_pool.expire(f"msg:{message_id}", 86400)
        
        from sqlalchemy import select
        from app.models.shop import Shop
        async with AsyncSessionLocal() as session:
            stmt = select(Shop).where(Shop.tiktok_page_id == recipient_id)
            result = await session.execute(stmt)
            shop = result.scalar_one_or_none()
            
        if not shop:
            logger.error(f"Shop not found for recipient_id {recipient_id}")
            return
            
        from app.models.chat import Conversation
        
        from app.models.seller import Seller
        
        async with AsyncSessionLocal() as session:
            # Check if conversation is in human takeover mode
            stmt = select(Conversation).where(
                Conversation.seller_id == shop.owner_id, 
                Conversation.customer_platform_id == sender_id
            )
            result = await session.execute(stmt)
            conversation = result.scalar_one_or_none()
            
            if conversation and conversation.is_human_takeover:
                logger.info(f"AI paused: Human takeover active for {sender_id}")
                return

            # Check SaaS token quota
            stmt = select(Seller).where(Seller.id == shop.owner_id)
            seller_result = await session.execute(stmt)
            seller = seller_result.scalar_one_or_none()
            
            if seller and seller.ai_token_usage >= seller.ai_message_limit:
                from app.integrations.tiktok_client import send_message
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
                
        memory_key = f"session:{shop.id}:{sender_id}"
        recent_memory = await redis_pool.lrange(memory_key, 0, 5)
        
        from app.agent.rag import run_agent
        reply = await run_agent(sender_id, shop.id, message_text, recent_memory)
        
        print(f"\n{'='*50}\n🤖 AI REPLY GENERATED:\n{reply}\n{'='*50}\n", flush=True)
        
        await redis_pool.lpush(memory_key, f"User: {message_text}")
        await redis_pool.lpush(memory_key, f"Agent: {reply}")
        await redis_pool.ltrim(memory_key, 0, 5)
        await redis_pool.expire(memory_key, 3600)
        
        from app.integrations.tiktok_client import send_message
        await send_message(sender_id, reply, shop.id)
        
    except Exception as e:
        logger.error(f"Error processing message: {e}")

async def abandoned_cart_followup(ctx):
    """
    CRON TASK: Finds orders stuck in PENDING for over 2 hours and sends a polite follow-up.
    This replaces TobSar's complex abandoned cart rules with a smart default.
    """
    logger.info("Running abandoned cart follow-up cron...")
    from sqlalchemy import select, and_, text
    from datetime import datetime, timedelta, timezone
    from app.models.order import Order
    from app.integrations.tiktok_client import send_message
    
    two_hours_ago = datetime.now(timezone.utc) - timedelta(hours=2)
    twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)
    
    async with AsyncSessionLocal() as session:
        # Find orders PENDING, between 2 and 24 hours old, that haven't been followed up on yet
        stmt = select(Order).where(
            and_(
                Order.status == 'PENDING',
                Order.created_at < two_hours_ago,
                Order.created_at > twenty_four_hours_ago,
                Order.waybill_url == None # Hack: using this to mark if followed up, or ideally a new column. We'll use a raw update for safety.
            )
        )
        result = await session.execute(stmt)
        orders = result.scalars().all()
        
        for order in orders:
            try:
                # We assume the order.user_id can be mapped to a platform ID. 
                # In a real app, join with the new Customer table.
                from app.models.customer import Customer
                cust_res = await session.execute(select(Customer).where(Customer.id == order.user_id))
                customer = cust_res.scalar_one_or_none()
                
                if customer:
                    follow_up_msg = f"សួស្តីបង! បងអត់ទាន់បានទូទាត់លុយសម្រាប់ Order #{order.id} ទេ។ បងត្រូវការឱ្យប្អូនជួយអ្វីបន្ថែមអត់បង? (Hi! Your order #{order.id} is pending payment. Need any help?)"
                    
                    await send_message(customer.platform_id, follow_up_msg, order.shop_id)
                    logger.info(f"Sent follow-up for Order #{order.id}")
                    
                    # Mark as followed up (e.g. by setting a flag or using a simple workaround here)
                    order.status = "PENDING_FOLLOWED_UP"
                    await session.commit()
            except Exception as e:
                logger.error(f"Failed to follow up order {order.id}: {e}")
