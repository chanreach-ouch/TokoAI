import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Text, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base

class Conversation(Base):
    __tablename__ = "conversations"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sellers.id", ondelete="CASCADE"), index=True)
    customer_platform_id: Mapped[str] = mapped_column(String, index=True) # E.g., TikTok user ID, FB PSID
    
    is_human_takeover: Mapped[bool] = mapped_column(Boolean, default=False)
    takeover_reason: Mapped[str | None] = mapped_column(String, nullable=True) # WHOLESALE_LEAD, CUSTOMER_COMPLAINT, MANUAL, HIGH_CART_VALUE
    
    # Cultural Bargaining State Tracker
    last_bargain_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    bargain_pending_product_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    bargain_offered_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationship to messages
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at.asc()")

class Message(Base):
    __tablename__ = "messages"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"), index=True)
    
    role: Mapped[str] = mapped_column(String) # 'user', 'ai', 'human_agent'
    content: Mapped[str] = mapped_column(Text)
    
    # Multimodal Voice & Media Attributes
    media_type: Mapped[str] = mapped_column(String, default="text") # 'text', 'audio', 'image', 'slip'
    media_url: Mapped[str | None] = mapped_column(String, nullable=True)
    audio_duration_sec: Mapped[float | None] = mapped_column(Float, nullable=True)
    transcription: Mapped[str | None] = mapped_column(Text, nullable=True) # Khmer STT transcribed text
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationship to conversation
    conversation = relationship("Conversation", back_populates="messages")
