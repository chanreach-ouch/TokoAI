from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.api.v1.tiktok_webhook import router as tiktok_router
from app.api.v1.seller import router as seller_router
from app.api.v1.auth import router as auth_router
from app.api.v1.orders import router as orders_router
import os

app = FastAPI(title="TokoAI Commerce Agent")

# Ensure static directory exists
os.makedirs("app/static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(tiktok_router, prefix="/api/v1/tiktok")
app.include_router(seller_router, prefix="/api/v1/seller", tags=["Seller Dashboard"])
app.include_router(orders_router, prefix="/api/v1/orders", tags=["Order Management"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
