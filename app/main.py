from fastapi import FastAPI
from app.api.v1 import tiktok_webhook

app = FastAPI(title="TikTok Commerce AI Agent")

app.include_router(tiktok_webhook.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"status": "running"}
