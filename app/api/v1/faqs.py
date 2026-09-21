from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.db import get_db
from app.core.auth import get_current_seller
from app.models.faq import FAQ
import uuid

router = APIRouter()

class FAQCreate(BaseModel):
    question: str
    answer: str

@router.get("", summary="Get all FAQs for the seller")
async def get_faqs(seller_id: str = Depends(get_current_seller), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FAQ).where(FAQ.seller_id == uuid.UUID(seller_id)))
    faqs = result.scalars().all()
    
    return [
        {
            "id": str(f.id),
            "question": f.question,
            "answer": f.answer,
            "created_at": f.created_at
        } for f in faqs
    ]

@router.post("", summary="Add a new FAQ")
async def create_faq(req: FAQCreate, seller_id: str = Depends(get_current_seller), db: AsyncSession = Depends(get_db)):
    new_faq = FAQ(
        seller_id=uuid.UUID(seller_id),
        question=req.question,
        answer=req.answer
    )
    db.add(new_faq)
    await db.commit()
    await db.refresh(new_faq)
    
    return {"status": "success", "faq_id": str(new_faq.id)}

@router.delete("/{faq_id}", summary="Delete an FAQ")
async def delete_faq(faq_id: str, seller_id: str = Depends(get_current_seller), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FAQ).where(FAQ.id == uuid.UUID(faq_id), FAQ.seller_id == uuid.UUID(seller_id)))
    faq = result.scalar_one_or_none()
    
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
        
    await db.delete(faq)
    await db.commit()
    
    return {"status": "success", "message": "FAQ deleted"}
