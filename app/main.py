from fastapi import FastAPI
from app.api.v1.tiktok_webhook import router as tiktok_router

app = FastAPI(title="TikTok Commerce AI Agent")

app.include_router(tiktok_router, prefix="/api/v1/tiktok")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
