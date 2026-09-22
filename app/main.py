from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.api.v1.tiktok_webhook import router as tiktok_router
from app.api.v1.webhooks_bakong import router as bakong_router
from app.api.v1.products import router as products_router
from app.api.v1.seller import router as seller_router
from app.api.v1.auth import router as auth_router
from app.api.v1.orders import router as orders_router
from app.api.v1.settings import router as settings_router
from app.api.v1.faqs import router as faqs_router
from app.api.v1.inbox import router as inbox_router
from app.api.v1.admin import router as admin_router
from app.api.v1.analytics import router as analytics_router
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TokoAI Commerce Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directory exists
os.makedirs("app/static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Platform Admin"])
app.include_router(tiktok_router, prefix="/api/v1")
app.include_router(bakong_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(seller_router, prefix="/api/v1/seller", tags=["Seller Shops"])
app.include_router(settings_router, prefix="/api/v1/seller/settings", tags=["Seller Settings"])
app.include_router(faqs_router, prefix="/api/v1/seller/faqs", tags=["Seller FAQs"])
app.include_router(inbox_router, prefix="/api/v1/seller/inbox", tags=["Seller Inbox"])
app.include_router(analytics_router, prefix="/api/v1/seller/analytics", tags=["Seller Analytics"])
app.include_router(orders_router, prefix="/api/v1/orders", tags=["Order Management"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
