import base64
import io
import qrcode
from crccheck.crc import Crc16CcittFalse
from app.config import settings

def generate_khqr_payload(amount_usd: float) -> str:
    def tlv(tag: str, value: str) -> str:
        length = f"{len(value):02d}"
        return f"{tag}{length}{value}"
    
    payload = ""
    payload += tlv("00", "01")
    payload += tlv("01", "11")
    
    merchant_id = settings.BAKONG_MERCHANT_ID
    merchant_info = tlv("00", "bakong.com.kh") + tlv("01", merchant_id)
    payload += tlv("29", merchant_info)
    
    payload += tlv("52", "5999")
    payload += tlv("53", "840")
    payload += tlv("54", f"{amount_usd:.2f}")
    payload += tlv("58", "KH")
    payload += tlv("59", settings.BAKONG_ACCOUNT_NAME)
    payload += tlv("60", "Phnom Penh")
    
    payload += "6304"
    crc = Crc16CcittFalse.calc(payload.encode('utf-8'))
    checksum = f"{crc:04X}"
    return payload + checksum

def generate_khqr_image_base64(amount_usd: float) -> str:
    payload = generate_khqr_payload(amount_usd)
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
    qr.add_data(payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")
