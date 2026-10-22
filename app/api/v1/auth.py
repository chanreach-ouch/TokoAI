from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field, field_validator
from app.core.db import get_db
from app.models.seller import Seller
from app.core.auth import get_password_hash, verify_password, create_access_token
import re

router = APIRouter()

class RegisterRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=8)

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not re.match(r"^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$", v):
            raise ValueError("Password must contain at least one letter, one number, and one special character.")
        return v

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
        
    token = create_access_token({
        "sub": str(seller.id), 
        "email": seller.email,
        "is_superadmin": seller.is_superadmin,
        "role": seller.role,
        "shop_id": str(seller.shop_id) if seller.shop_id else None
    })
    return {"access_token": token, "token_type": "bearer"}

from app.core.auth import get_current_seller

@router.get("/me", summary="Get logged-in profile")
async def get_me(seller_id: str = Depends(get_current_seller), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Seller).where(Seller.id == seller_id))
    seller = result.scalar_one_or_none()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    return {
        "id": seller.id,
        "email": seller.email,
        "bot_tone": seller.bot_tone,
        "is_superadmin": seller.is_superadmin,
        "role": seller.role,
        "shop_id": seller.shop_id
    }

from app.core.auth import get_current_owner

class InviteRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=8)
    shop_id: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not re.match(r"^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$", v):
            raise ValueError("Password must contain at least one letter, one number, and one special character.")
        return v

@router.post("/invite", summary="Invite a staff agent to a shop")
async def invite_staff(
    req: InviteRequest, 
    owner_id: str = Depends(get_current_owner), 
    db: AsyncSession = Depends(get_db)
):
    # Verify owner actually owns this shop or auto-resolve owner's shop
    from app.models.shop import Shop
    target_shop = None
    try:
        owner_uuid = uuid.UUID(owner_id)
        if req.shop_id and str(req.shop_id) != "00000000-0000-0000-0000-000000000000":
            result = await db.execute(select(Shop).where(Shop.id == req.shop_id, Shop.owner_id == owner_uuid))
            target_shop = result.scalar_one_or_none()
        else:
            result = await db.execute(select(Shop).where(Shop.owner_id == owner_uuid))
            target_shop = result.scalar_one_or_none()
    except Exception:
        pass

    if not target_shop:
        raise HTTPException(status_code=403, detail="Not authorized or no active shop found to invite staff to.")

    # Check if email exists
    result = await db.execute(select(Seller).where(Seller.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    from app.models.seller import SellerRole
    hashed_password = get_password_hash(req.password)
    new_staff = Seller(
        email=req.email, 
        hashed_password=hashed_password,
        role=SellerRole.AGENT.value,
        shop_id=target_shop.id
    )
    db.add(new_staff)
    await db.commit()
    await db.refresh(new_staff)
    
    return {"status": "success", "message": "Staff invited successfully", "staff_id": new_staff.id}
