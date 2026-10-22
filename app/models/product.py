from sqlalchemy import Column, String, Integer, Float, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from app.models.base import Base
import uuid
from datetime import datetime
from sqlalchemy import DateTime

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("sellers.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String, nullable=False)
    name_kh = Column(String, nullable=True)
    sku = Column(String, index=True, nullable=True)
    category = Column(String)
    description = Column(Text)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    image_url = Column(String)
    
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
