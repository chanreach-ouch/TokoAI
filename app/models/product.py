from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.dialects.postgresql import JSONB
from pgvector.sqlalchemy import Vector
from app.core.db import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    name_en = Column(String, nullable=False)
    name_kh = Column(String, nullable=False)
    aliases = Column(JSONB, default=list)
    price_usd = Column(Float, nullable=False)
    stock_qty = Column(Integer, default=0)
    embedding = Column(Vector(768))
