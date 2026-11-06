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
from app.api.v1.customers import router as customers_router
from app.api.v1.social_comments import router as social_comments_router
from app.api.v1.consultant import router as consultant_router
import os
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.rate_limit import limiter

description = """
**TokoAI Commerce Agent API (Cambodia Edition v2.0)**

Core backend engine powering TokoAI, an autonomous multi-tenant AI conversational commerce SaaS platform.

### Core Capabilities:
* **Historical Persona Cloning**: Clones shop owner's authentic spoken Khmer sales habits, first-message hooks, and objection tactics.
* **Multimodal Voice AI**: Transcribes Khmer/Khmeringlish voice notes and supports cloned voice responses.
* **Cultural Bargaining Engine**: 3-tier negotiation protocol defending price and executing counter-offers without breaching floors.
* **Predictive BI & AI Consultant**: Real-time SKU velocity, stockout forecasts (<5 days), automated COGS P&L, and executive AI business advising.
* **High-Concurrency Anti-Crash**: Redis 2.5s sliding window message debouncing and atomic PostgreSQL row locks.
"""

app = FastAPI(
    title="TokoAI Commerce Agent",
    description=description,
    version="2.0.0",
    contact={
        "name": "TokoAI Engineering Team",
        "email": "admin@tokoai.com",
    }
)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Ensure static directory exists
os.makedirs("app/static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Platform Admin"])
app.include_router(tiktok_router, prefix="/api/v1")
app.include_router(bakong_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(seller_router, prefix="/api/v1/seller", tags=["Seller Shops & Persona"])
app.include_router(settings_router, prefix="/api/v1/seller/settings", tags=["Seller Settings"])
app.include_router(faqs_router, prefix="/api/v1/seller/faqs", tags=["Seller FAQs"])
app.include_router(inbox_router, prefix="/api/v1/seller/inbox", tags=["Seller Inbox"])
app.include_router(analytics_router, prefix="/api/v1/seller/analytics", tags=["Seller Analytics & BI"])
app.include_router(customers_router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1/orders", tags=["Order Management"])
app.include_router(social_comments_router, prefix="/api/v1")
app.include_router(consultant_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}
