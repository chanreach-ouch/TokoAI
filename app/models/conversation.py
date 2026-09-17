from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.sql import func
from app.core.db import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    state = Column(String, default="NEW")
    history = Column(Text, default="[]")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), default=func.now())
