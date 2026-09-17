from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from app.core.db import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    items = Column(JSONB, nullable=False)
    total_amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    status = Column(String, default="PENDING")
    khqr_md5 = Column(String, nullable=True)
