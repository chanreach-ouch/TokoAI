import uuid
import asyncio

async def generate_jnt_waybill(order_id: int, customer_phone: str, customer_address: str, items: dict):
    """
    Mock integration for J&T Express Cambodia API.
    In production, this would make an HTTP POST to J&T's order creation endpoint.
    """
    # Simulate network latency
    await asyncio.sleep(1)
    
    tracking_number = f"JT{str(uuid.uuid4().int)[:10]}"
    waybill_url = f"https://jtexpress.com.kh/tracking/{tracking_number}"
    
    return {
        "status": "success",
        "provider": "J&T Express",
        "tracking_number": tracking_number,
        "waybill_url": waybill_url
    }

async def generate_vet_waybill(order_id: int, customer_phone: str, customer_address: str, items: dict):
    """
    Mock integration for Virak Buntham (VET) Express API.
    """
    await asyncio.sleep(1)
    
    tracking_number = f"VET-{str(uuid.uuid4().hex)[:8].upper()}"
    waybill_url = f"https://vetexpress.com/track/{tracking_number}"
    
    return {
        "status": "success",
        "provider": "Virak Buntham",
        "tracking_number": tracking_number,
        "waybill_url": waybill_url
    }
