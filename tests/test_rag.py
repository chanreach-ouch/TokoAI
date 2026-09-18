import pytest
from unittest.mock import AsyncMock, patch, MagicMock

@pytest.mark.asyncio
async def test_retrieve_relevant_products():
    from app.agent.rag import retrieve_relevant_products
    
    class MockProduct:
        def __init__(self, sku):
            self.sku = sku
            self.name_kh = "Mock"
            self.price_usd = 10.0
            self.description = "Mock"
            self.stock_qty = 1
            
    mock_session = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [MockProduct("KZ-CASTOR-PRO")]
    mock_session.execute.return_value = mock_result
    
    with patch("app.agent.rag.client.models.embed_content") as mock_embed:
        class MockEmbedding:
            values = [0.1] * 768
        class MockResponse:
            embeddings = [MockEmbedding()]
        
        mock_embed.return_value = MockResponse()
        
        products = await retrieve_relevant_products("Castor Pro", mock_session)
        assert len(products) == 1
        assert products[0].sku == "KZ-CASTOR-PRO"
