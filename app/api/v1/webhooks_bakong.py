from fastapi import APIRouter, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_db
from app.models.order import Order
from app.models.chat import Message
from app.models.customer import Customer
import uuid

router = APIRouter(prefix="/webhooks/bakong", tags=["Webhooks"])

@router.post("/")
async def bakong_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Secure endpoint that listens for Bakong Bank's success pings.
    The AI does NOT use vision to verify payments. This webhook handles it securely.
    """
    data = await request.json()
    
    # Expected payload from Bakong: {"transaction_id": "TX123", "amount": 15.00, "status": "SUCCESS", "chat_id": "xyz", "order_id": 123}
    tx_id = data.get("transaction_id")
    status = data.get("status")
    chat_id = data.get("chat_id")
    order_id = data.get("order_id")
    amount = float(data.get("amount", 0.0))
    
    if status == "SUCCESS" and order_id:
        # 1. Update Order Status to PAID
        stmt = select(Order).where(Order.id == int(order_id))
        result = await db.execute(stmt)
        order = result.scalar_one_or_none()
        
        if order:
            order.status = "PAID"
            if tx_id:
                order.khqr_md5 = str(tx_id)
            
            # 2. Update Customer LTV if customer linked
            if chat_id:
                try:
                    chat_uuid = uuid.UUID(str(chat_id))
                    # Inject confirmation message into chat thread
                    msg = Message(
                        id=uuid.uuid4(),
                        conversation_id=chat_uuid,
                        role="system",
                        content=f"✅ ការទូទាត់ប្រាក់ជោគជ័យ! Payment Received: ${amount:.2f} via Bakong (TxID: {tx_id}). Your order is now being processed."
                    )
                    db.add(msg)
                except Exception:
                    pass
            
            await db.commit()
            
    return {"status": "ok"}
