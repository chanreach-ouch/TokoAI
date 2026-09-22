from fastapi import APIRouter, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.db import get_db
from app.services.gemini import generate_chat_reply, embed_query
import uuid

router = APIRouter(prefix="/webhooks/tiktok", tags=["Webhooks"])

@router.post("/")
async def tiktok_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Receives incoming DMs from TikTok.
    Flow: 
    1. Parse text/image
    2. Vector search DB for products (HNSW indexed)
    3. Feed to Gemini Multimodal RAG
    4. Save response to DB and return to TikTok
    """
    data = await request.json()
    
    seller_id = data.get("seller_id")
    customer_id = data.get("customer_id")
    message_text = data.get("text", "")
    has_image = data.get("has_image", False)
    
    # In a real TikTok API, you'd download the image bytes from the provided URL
    image_bytes = None
    image_mime = None
    if has_image:
        image_bytes = b"dummy_image_data" # Simulated download
        image_mime = "image/jpeg"
        # We append a visual note so text embedding handles the generic intent
        message_text += " [Customer sent an image]"

    if not seller_id or not customer_id:
        return {"status": "ignored"}

    # 1. Fetch Seller Tone & FAQs
    seller_info = await db.execute(text("SELECT bot_tone FROM sellers WHERE id = :s"), {"s": seller_id})
    seller = seller_info.fetchone()
    bot_tone = seller.bot_tone if seller else "Friendly"
    
    faq_info = await db.execute(text("SELECT question, answer FROM faqs WHERE seller_id = :s"), {"s": seller_id})
    faqs = faq_info.mappings().fetchall()
    faq_list = [f"Q: {f['question']} A: {f['answer']}" for f in faqs]

    # 2. HNSW Vector Search for top products
    customer_vector = embed_query(message_text)
    
    search_query = text("""
        SELECT id, name, price, stock, image_url, 
               1 - (embedding <=> :emb::vector) as similarity
        FROM products
        WHERE seller_id = :s
        ORDER BY embedding <=> :emb::vector
        LIMIT 3
    """)
    prod_results = await db.execute(search_query, {"emb": customer_vector, "s": seller_id})
    matched_products = [dict(p) for p in prod_results.mappings().fetchall()]

    # 3. Call Multimodal Chat Engine
    reply_text, attached_image_url = generate_chat_reply(
        customer_msg=message_text,
        seller_tone=bot_tone,
        faqs=faq_list,
        matched_products=matched_products,
        has_image=has_image,
        image_bytes=image_bytes,
        image_mime=image_mime
    )

    # 4. Save to DB (mocking conversation fetching for brevity)
    # Ensure a conversation exists
    conv_id = uuid.uuid4() # Mock: assume we found/created the active conversation
    
    # Save Customer Message
    await db.execute(
        text("INSERT INTO messages (id, conversation_id, sender_type, content) VALUES (:id, :conv, 'CUSTOMER', :content)"),
        {"id": uuid.uuid4(), "conv": conv_id, "content": message_text}
    )
    
    # Save AI Reply
    await db.execute(
        text("INSERT INTO messages (id, conversation_id, sender_type, content) VALUES (:id, :conv, 'AI', :content)"),
        {"id": uuid.uuid4(), "conv": conv_id, "content": reply_text}
    )
    await db.commit()

    return {
        "status": "success",
        "reply": reply_text,
        "attached_image": attached_image_url
    }
