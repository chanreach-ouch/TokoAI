import hmac
import hashlib
from unittest.mock import patch, AsyncMock
from app.config import settings
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_webhook_invalid_signature():
    response = client.post(
        "/api/v1/webhooks/tiktok/",
        headers={"x-tiktok-signature": "invalid"},
        content=b'{"data": "test"}'
    )
    assert response.status_code == 401

@patch("app.api.v1.tiktok_webhook.get_arq_pool", new_callable=AsyncMock)
def test_webhook_valid_signature(mock_get_arq_pool):
    payload = b'{"data": {"message_id": "123", "sender_id": "456", "text": "hello"}}'
    secret = settings.TIKTOK_APP_SECRET.encode('utf-8')
    signature = hmac.new(secret, payload, hashlib.sha256).hexdigest()
    
    # Mock the ARQ pool
    mock_pool = AsyncMock()
    mock_get_arq_pool.return_value = mock_pool
    
    response = client.post(
        "/api/v1/webhooks/tiktok/",
        headers={"x-tiktok-signature": signature},
        content=payload
    )
    assert response.status_code == 200
    assert response.json() == {"status": "success", "message": "Enqueued"}
    mock_pool.enqueue_job.assert_called_once_with("process_tiktok_message", payload)
