from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from typing import List, Optional
from app.core.db import get_db
from app.core.auth import get_current_seller
from app.models.seller import Seller
from app.models.product import Product
from app.services.gemini import extract_vision_data, embed_text
from pydantic import BaseModel
import uuid
import json
import os

router = APIRouter(prefix="/products", tags=["Products"])

@router.post("/extract-vision")
async def extract_vision(
    file: UploadFile = File(...),
    seller_id: str = Depends(get_current_seller)
):
    """
    Accepts an image upload from the dashboard and uses Gemini 1.5 Flash 
    to extract product info in JSON format.
    """
    contents = await file.read()
    mime_type = file.content_type
    
    # Save the file temporarily in static/uploads
    upload_dir = "app/static/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as f:
        f.write(contents)
        
    image_url = f"/static/uploads/{file.filename}"
    
    # Send to Gemini Vision
    extracted_data = extract_vision_data(contents, mime_type)
    extracted_data["image_url"] = image_url
    
    return extracted_data

@router.post("")
@router.post("/")
async def create_product(
    request: Request,
    seller_id: str = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db)
):
    """
    Saves the product to the DB with bargaining ranges & predictive COGS.
    Generates a 768d vector embedding for RAG.
    """
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        data = await request.json()
    else:
        form = await request.form()
        data = dict(form)
        
    name = data.get("name")
    if not name:
        raise HTTPException(status_code=422, detail="Product name is required")
        
    price = float(data.get("price", 0.0))
    stock = int(data.get("stock", 0))
    category = data.get("category")
    description = data.get("description")
    image_url = data.get("image_url")
    sku = data.get("sku") or f"SKU-{str(uuid.uuid4().hex[:6]).upper()}"
    name_kh = data.get("name_kh")
    
    # Cultural Bargaining & Predictive Inventory Attributes
    min_negotiation_price = float(data.get("min_negotiation_price", price) or price)
    allow_free_delivery = bool(data.get("allow_free_delivery_negotiation", True))
    negotiation_step = float(data.get("negotiation_step_usd", 0.50) or 0.50)
    cost_price = float(data.get("cost_price_usd", price * 0.55)) if data.get("cost_price_usd") is not None else round(price * 0.55, 2)
    reorder_threshold = int(data.get("reorder_threshold", 10) or 10)
    
    # Process variants (Sizes, Colors, Stock)
    variants = data.get("variants") or []
    if isinstance(variants, str):
        try:
            variants = json.loads(variants)
        except Exception:
            variants = []
            
    if variants and isinstance(variants, list):
        variant_total_stock = sum(int(v.get("stock", 0)) for v in variants if isinstance(v, dict))
        if variant_total_stock > 0 and stock == 0:
            stock = variant_total_stock

    # 1. Generate text for embedding (including variant sizes & colors)
    variant_text = ""
    if variants:
        variant_text = f" Available Variants: {', '.join([f'{v.get('size', '')} {v.get('color', '')}'.strip() for v in variants if isinstance(v, dict)])}"
    product_text = f"Product Name: {name}. Khmer Name: {name_kh or ''}. SKU: {sku}. Category: {category}. Price: ${price}. Description: {description}.{variant_text}"
    
    # 2. Get vector from Gemini
    try:
        embedding = embed_text(product_text)
    except Exception:
        embedding = [0.0] * 768
    
    # 3. Duplicate Check using pgvector cosine distance (<=>)
    try:
        similarity_query = text("""
            SELECT name, 1 - (embedding <=> :emb::vector) as similarity 
            FROM products 
            WHERE seller_id = :seller_id
            ORDER BY embedding <=> :emb::vector
            LIMIT 1
        """)
        result = await db.execute(similarity_query, {"emb": embedding, "seller_id": seller_id})
        top_match = result.fetchone()
        
        if top_match and top_match.similarity and top_match.similarity > 0.98:
            raise HTTPException(
                status_code=409, 
                detail=f"Warning: This looks >98% identical to '{top_match.name}'. Do you want to edit that instead?"
            )
    except HTTPException:
        raise
    except Exception:
        pass
    
    # 4. Save to DB
    new_product = Product(
        id=uuid.uuid4(),
        seller_id=uuid.UUID(seller_id),
        name=name,
        name_kh=name_kh,
        sku=sku,
        category=category,
        description=description,
        price=price,
        stock=stock,
        variants=variants,
        image_url=image_url,
        min_negotiation_price=min_negotiation_price,
        allow_free_delivery_negotiation=allow_free_delivery,
        negotiation_step_usd=negotiation_step,
        cost_price_usd=cost_price,
        reorder_threshold=reorder_threshold,
        embedding=embedding
    )
    
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    
    return {
        "message": "Product saved successfully", 
        "id": str(new_product.id),
        "sku": new_product.sku,
        "name": new_product.name,
        "price": new_product.price,
        "min_negotiation_price": new_product.min_negotiation_price,
        "variants_count": len(variants)
    }

@router.get("")
@router.get("/")
async def get_products(
    seller_id: str = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetches all products for the dashboard UI with bargaining & predictive fields.
    """
    result = await db.execute(
        select(Product)
        .where(Product.seller_id == uuid.UUID(seller_id))
        .order_by(Product.created_at.desc())
    )
    products = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "name_kh": p.name_kh or p.name,
            "sku": p.sku or str(p.id)[:8],
            "price": float(p.price),
            "stock": int(p.stock),
            "variants": p.variants or [],
            "category": p.category,
            "description": p.description,
            "image_url": p.image_url,
            "min_negotiation_price": float(p.min_negotiation_price or p.price),
            "allow_free_delivery_negotiation": bool(p.allow_free_delivery_negotiation),
            "negotiation_step_usd": float(p.negotiation_step_usd or 0.50),
            "cost_price_usd": float(p.cost_price_usd or 0.0),
            "reorder_threshold": int(p.reorder_threshold or 10)
        } for p in products
    ]

class ProductUpdate(BaseModel):
    stock: Optional[int] = None
    price: Optional[float] = None
    name: Optional[str] = None
    variants: Optional[list] = None
    min_negotiation_price: Optional[float] = None
    allow_free_delivery_negotiation: Optional[bool] = None
    negotiation_step_usd: Optional[float] = None
    cost_price_usd: Optional[float] = None
    reorder_threshold: Optional[int] = None

@router.patch('/{product_id}')
async def update_product(
    product_id: str,
    req: ProductUpdate,
    seller_id: str = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Product).where(Product.id == uuid.UUID(product_id), Product.seller_id == uuid.UUID(seller_id))
    result = await db.execute(stmt)
    prod = result.scalar_one_or_none()
    if not prod:
        raise HTTPException(status_code=404, detail='Product not found')
        
    if req.variants is not None:
        prod.variants = req.variants
        total_var_stock = sum(int(v.get("stock", 0)) for v in req.variants if isinstance(v, dict))
        if total_var_stock >= 0:
            prod.stock = total_var_stock
    elif req.stock is not None:
        prod.stock = max(0, req.stock)
        
    if req.price is not None:
        prod.price = max(0.0, req.price)
    if req.name is not None:
        prod.name = req.name
    if req.min_negotiation_price is not None:
        prod.min_negotiation_price = req.min_negotiation_price
    if req.allow_free_delivery_negotiation is not None:
        prod.allow_free_delivery_negotiation = req.allow_free_delivery_negotiation
    if req.negotiation_step_usd is not None:
        prod.negotiation_step_usd = req.negotiation_step_usd
    if req.cost_price_usd is not None:
        prod.cost_price_usd = req.cost_price_usd
    if req.reorder_threshold is not None:
        prod.reorder_threshold = req.reorder_threshold
        
    await db.commit()
    return {
        'status': 'success', 
        'id': str(prod.id), 
        'stock': prod.stock, 
        'price': prod.price,
        'min_negotiation_price': prod.min_negotiation_price,
        'variants': prod.variants or []
    }

@router.delete('/{product_id}')
async def delete_product(
    product_id: str,
    seller_id: str = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Product).where(Product.id == uuid.UUID(product_id), Product.seller_id == uuid.UUID(seller_id))
    result = await db.execute(stmt)
    prod = result.scalar_one_or_none()
    if not prod:
        raise HTTPException(status_code=404, detail='Product not found')
        
    await db.delete(prod)
    await db.commit()
    return {'status': 'success', 'message': 'Product deleted successfully'}
