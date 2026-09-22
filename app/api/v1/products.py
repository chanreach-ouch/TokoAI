from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List
from app.core.db import get_db
from app.core.auth import get_current_seller
from app.models.seller import Seller
from app.models.product import Product
from app.services.gemini import extract_vision_data, embed_text
import uuid
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
    
    # Save the file temporarily (or permanently in static/uploads)
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

@router.post("/")
async def create_product(
    name: str = Form(...),
    category: str = Form(None),
    description: str = Form(None),
    price: float = Form(...),
    stock: int = Form(0),
    image_url: str = Form(None),
    seller_id: str = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db)
):
    """
    Saves the product to the DB and generates a vector embedding for RAG.
    Also performs a quick duplicate check.
    """
    # 1. Generate text for embedding
    product_text = f"Product Name: {name}. Category: {category}. Price: ${price}. Description: {description}"
    
    # 2. Get vector from Gemini
    embedding = embed_text(product_text)
    
    # 3. Duplicate Check using pgvector cosine distance (<=>)
    # distance = 1 - cosine_similarity. So distance < 0.02 means > 98% similarity.
    similarity_query = text("""
        SELECT name, 1 - (embedding <=> :emb::vector) as similarity 
        FROM products 
        WHERE seller_id = :seller_id
        ORDER BY embedding <=> :emb::vector
        LIMIT 1
    """)
    
    result = await db.execute(similarity_query, {"emb": embedding, "seller_id": seller_id})
    top_match = result.fetchone()
    
    if top_match and top_match.similarity > 0.98:
        raise HTTPException(
            status_code=409, 
            detail=f"Warning: This looks >98% identical to '{top_match.name}'. Do you want to edit that instead?"
        )
    
    # 4. Save to DB
    new_product = Product(
        id=uuid.uuid4(),
        seller_id=seller_id,
        name=name,
        category=category,
        description=description,
        price=price,
        stock=stock,
        image_url=image_url,
        embedding=embedding
    )
    
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    
    return {"message": "Product saved successfully", "id": str(new_product.id)}

@router.get("/")
async def get_products(
    seller_id: str = Depends(get_current_seller),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetches all products for the dashboard UI.
    """
    result = await db.execute(text("SELECT id, name, price, stock, category, image_url FROM products WHERE seller_id = :s"), {"s": current_user.id})
    products = result.mappings().fetchall()
    return products
