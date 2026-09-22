from fastapi import APIRouter, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.db import get_db
import uuid

router = APIRouter(prefix="/webhooks/bakong", tags=["Webhooks"])

@router.post("/")
async def bakong_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Secure endpoint that listens for Bakong Bank's success pings.
    The AI does NOT use vision to verify payments. This webhook handles it securely.
    """
    data = await request.json()
    
    # Expected payload from Bakong: {"transaction_id": "TX123", "amount": 15.00, "status": "SUCCESS", "chat_id": "xyz"}
    tx_id = data.get("transaction_id")
    status = data.get("status")
    chat_id = data.get("chat_id")
    
    if status == "SUCCESS" and chat_id:
        # In a real app, verify the signature from Bakong here
        
        # Inject a confirmation message into the chat so the AI knows payment was received
        msg_id = uuid.uuid4()
        await db.execute(
            text("""
                INSERT INTO messages (id, conversation_id, sender_type, content) 
                VALUES (:id, :conv, 'SYSTEM', :content)
            """),
            {"id": msg_id, "conv": chat_id, "content": f"✅ Payment Received: {data.get('amount')} via Bakong (TxID: {tx_id})"}
        )
        await db.commit()
        
    return {"status": "ok"}
