import json
import uuid
import base64
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from google import genai
from google.genai import types
from app.core.db import AsyncSessionLocal, get_db
from app.models.product import Product
from app.models.shop import Shop
from app.config import settings

router = APIRouter()
client = genai.Client(api_key=settings.GEMINI_API_KEY)

from app.core.auth import get_current_seller
import os
import shutil

@router.post("/products/upload", summary="Securely upload a product")
async def upload_product(
    shop_id: uuid.UUID = Form(...),
    name: str = Form(...),
    price_usd: float = Form(...),
    stock_qty: int = Form(...),
    sku: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    seller_id: str = Depends(get_current_seller)
):
    try:
        # 0. Verify shop ownership
        from sqlalchemy import select
        result = await db.execute(select(Shop).where(Shop.id == shop_id, Shop.owner_id == seller_id))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Not authorized to upload to this shop")

        # 1. Read Image
        image_bytes = await file.read()
        
        # Save image to disk
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = f"app/static/uploads/{unique_filename}"
        with open(file_path, "wb") as f:
            f.write(image_bytes)
            
        image_url = f"/static/uploads/{unique_filename}"
        
        # 2. AI Auto-Enrichment (Gemini Vision)
        prompt = f"""
        You are an expert e-commerce copywriter for the Cambodian market.
        Analyze this image and the product name: "{name}".
        Research its technical specifications and what makes it special.
        Write a highly detailed product description (in both English and Khmer).
        Also provide common 'Khmeringlish' or slang search terms for it.
        Return ONLY a valid JSON object with two keys:
        - "description": "The detailed description text"
        - "aliases": ["list", "of", "search", "terms"]
        """
        
        vision_response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=file.content_type),
                prompt
            ]
        )
        
        # Parse the JSON response
        try:
            clean_json = vision_response.text.replace('```json', '').replace('```', '').strip()
            ai_data = json.loads(clean_json)
        except Exception as e:
            raise HTTPException(status_code=500, detail="Failed to parse AI response: " + str(e))
            
        description = ai_data.get("description", f"A great product: {name}")
        aliases = ai_data.get("aliases", [name])
        
        # 3. Vectorize for RAG
        embed_text = f"{name} {description} {' '.join(aliases)}"
        embed_response = client.models.embed_content(
            model="gemini-embedding-2",
            contents=embed_text,
        )
        embedding = embed_response.embeddings[0].values
        
        # 4. Save to Database
        new_product = Product(
            shop_id=shop_id,
            sku=sku,
            name_en=name,
            name_kh=name,
            aliases=aliases,
            description=description,
            price_usd=price_usd,
            stock_qty=stock_qty,
            image_url=image_url,
            embedding=embedding
        )
        
        db.add(new_product)
        await db.commit()
        await db.refresh(new_product)
        
        return {
            "status": "success",
            "message": "Product analyzed and saved successfully!",
            "product_id": new_product.id,
            "image_url": image_url,
            "ai_description": description,
            "aliases_generated": aliases
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel

class ShopCreate(BaseModel):
    tiktok_page_id: str
    name: str
    bakong_merchant_id: str | None = None
    tiktok_access_token: str | None = None

@router.post("/shop", summary="Create or update shop")
async def create_or_update_shop(
    shop: ShopCreate, 
    db: AsyncSession = Depends(get_db),
    seller_id: str = Depends(get_current_seller)
):
    from sqlalchemy import select
    try:
        # Check if shop exists
        result = await db.execute(select(Shop).where(Shop.tiktok_page_id == shop.tiktok_page_id))
        existing_shop = result.scalar_one_or_none()
        
        if existing_shop:
            if str(existing_shop.owner_id) != seller_id and existing_shop.owner_id is not None:
                raise HTTPException(status_code=403, detail="Shop belongs to another user")
                
            existing_shop.name = shop.name
            existing_shop.owner_id = uuid.UUID(seller_id)
            if shop.bakong_merchant_id:
                existing_shop.bakong_merchant_id = shop.bakong_merchant_id
            if shop.tiktok_access_token:
                existing_shop.tiktok_access_token = shop.tiktok_access_token
            await db.commit()
            return {"status": "success", "message": "Shop updated", "shop_id": existing_shop.id}
            
        new_shop = Shop(
            tiktok_page_id=shop.tiktok_page_id,
            owner_id=uuid.UUID(seller_id),
            name=shop.name,
            bakong_merchant_id=shop.bakong_merchant_id,
            tiktok_access_token=shop.tiktok_access_token
        )
        db.add(new_shop)
        await db.commit()
        await db.refresh(new_shop)
        return {"status": "success", "message": "Shop created", "shop_id": new_shop.id}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
