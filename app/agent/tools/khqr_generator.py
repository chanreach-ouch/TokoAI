import os
import hashlib

BAKONG_MERCHANT_ID = os.getenv("BAKONG_MERCHANT_ID", "dummy_merchant")
BAKONG_ACCOUNT_NAME = os.getenv("BAKONG_ACCOUNT_NAME", "dummy_account")

def generate_khqr(amount: float, order_id: str, currency: str = "USD") -> dict:
    payload = f"{BAKONG_MERCHANT_ID}:{amount}:{currency}:{order_id}"
    md5_hash = hashlib.md5(payload.encode()).hexdigest()
    
    deeplink = f"https://bakong.kh/pay?khqr={md5_hash}"
    qr_image = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={deeplink}"
    
    return {
        "khqr_md5": md5_hash,
        "deeplink": deeplink,
        "qr_image": qr_image,
        "payload": payload
    }
