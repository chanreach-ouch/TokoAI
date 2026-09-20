from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.db import get_db
from app.models.seller import Seller
from app.core.auth import get_password_hash, verify_password, create_access_token

router = APIRouter()

class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register", summary="Register a new seller account")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Seller).where(Seller.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(req.password)
    new_seller = Seller(email=req.email, hashed_password=hashed_password)
    db.add(new_seller)
    await db.commit()
    await db.refresh(new_seller)
    
    return {"status": "success", "message": "Seller created", "seller_id": new_seller.id}

@router.post("/login", summary="Login to get JWT token")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Seller).where(Seller.email == req.email))
    seller = result.scalar_one_or_none()
    
    if not seller or not verify_password(req.password, seller.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    token = create_access_token({"sub": str(seller.id), "email": seller.email})
    return {"access_token": token, "token_type": "bearer"}
