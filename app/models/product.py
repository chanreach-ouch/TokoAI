from sqlalchemy import Column, String, Integer, Float, ForeignKey, Text, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector
from app.models.base import Base
import uuid
from datetime import datetime

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("sellers.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = Column(String, nullable=False)
    name_kh = Column(String, nullable=True)
    sku = Column(String, index=True, nullable=True)
    category = Column(String, default="General")
    description = Column(Text)
    
    price = Column(Float, nullable=False) # Base price in USD
    stock = Column(Integer, default=0) # Available inventory
    cost_price_usd = Column(Float, default=0.0) # For automated P&L / COGS calculation
    image_url = Column(String)
    
    # Module 4: Cultural Bargaining Engine Schema
    # Rule: If min_negotiation_price is None or >= price, price is strictly locked
    min_negotiation_price = Column(Float, nullable=True)
    allow_free_delivery_negotiation = Column(Boolean, default=False)
    negotiation_step_usd = Column(Float, default=1.0)
    
    # Module 6: Predictive Inventory
    reorder_threshold = Column(Integer, default=5)
    
    # Product Variants (Sizes, Colors, Sub-SKUs, and Variant-level stock)
    # Format: [{"size": "M", "color": "Black", "sku": "KZ-BLK-M", "stock": 10}, ...]
    variants = Column(JSONB, nullable=True, default=list)
    
    # Text-embedding-004 produces 768-dimensional vectors
    embedding = Column(Vector(768))
    
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def price_usd(self) -> float:
        return float(self.price)

    @price_usd.setter
    def price_usd(self, val: float):
        self.price = float(val)

    @property
    def stock_qty(self) -> int:
        return int(self.stock)

    @stock_qty.setter
    def stock_qty(self, val: int):
        self.stock = int(val)

    @property
    def is_price_negotiable(self) -> bool:
        if self.min_negotiation_price is None:
            return False
        return float(self.min_negotiation_price) < float(self.price)
