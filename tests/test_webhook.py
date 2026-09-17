import pytest
import hmac
import hashlib
import json
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import TIKTOK_APP_SECRET
from unittest.mock import patch, AsyncMock

client = TestClient(app)

def generate_signature(body: bytes) -> str:
    return hmac.new(
        TIKTOK_APP_SECRET.encode('utf-8'),
        body,
        hashlib.sha256
    ).hexdigest()

def test_webhook_invalid_signature():
    payload = {"message_id": "test_123"}
    response = client.post(
        "/api/v1/webhook",
        json=payload,
        headers={"X-TikTok-Signature": "invalid_signature"}
    )
    assert response.status_code == 401

@patch("app.api.v1.tiktok_webhook.get_arq_pool")
def test_webhook_valid_signature(mock_get_arq_pool):
    mock_pool = AsyncMock()
    mock_get_arq_pool.return_value = mock_pool
    
    payload = {"message_id": "test_123"}
    body = json.dumps(payload).encode('utf-8')
    signature = generate_signature(body)
    
    response = client.post(
        "/api/v1/webhook",
        content=body,
        headers={"X-TikTok-Signature": signature}
    )
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    mock_pool.enqueue_job.assert_called_once_with("process_tiktok_message", "test_123", payload)

@pytest.mark.asyncio
async def test_product_rag_query():
    # In a full integration test, this would query the DB.
    # For now, we mock the query_products response.
    from app.agent.rag import query_products
    with patch("app.agent.rag.query_products", new_callable=AsyncMock) as mock_query:
        mock_query.return_value = [
            {"sku": "KZ-CASTOR-PRO", "name_en": "KZ Castor Pro", "price_usd": 19.0}
        ]
        
        results = await query_products("I want Castor Pro")
        assert len(results) > 0
        assert results[0]["sku"] == "KZ-CASTOR-PRO"
