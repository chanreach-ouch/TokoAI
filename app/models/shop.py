import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models.base import Base

class Shop(Base):
    __tablename__ = "shops"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tiktok_page_id: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    facebook_page_id: Mapped[str | None] = mapped_column(String, index=True, nullable=True)
    
    owner_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("sellers.id"), nullable=True)
    tiktok_access_token: Mapped[str | None] = mapped_column(String, nullable=True)
    facebook_access_token: Mapped[str | None] = mapped_column(String, nullable=True)
    
    name: Mapped[str] = mapped_column(String, nullable=False)
    bakong_merchant_id: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # Module 2: Voice Cloning Profile (STT & TTS)
    voice_clone_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    voice_model_id: Mapped[str | None] = mapped_column(String, nullable=True) # e.g. "elevenlabs_khmer_v1", "gemini_voice_clone_id"
    max_voice_seconds: Mapped[int] = mapped_column(Integer, default=30)
    preferred_reply_modality: Mapped[str] = mapped_column(String, default="ADAPTIVE") # TEXT_ONLY, VOICE_AND_TEXT, ADAPTIVE
    
    # Module 2: Smart Human Escalation Rules (JSONB)
    escalation_rules: Mapped[dict] = mapped_column(
        JSONB, 
        default=lambda: {
            "bulk_order_threshold_qty": 10,
            "bulk_order_threshold_usd": 100.0,
            "escalate_on_complaint": True,
            "custom_trigger_keywords": ["boss", "manager", "មេ", "បោក", "ខូច", "សងលុយ", "refund", "complain"]
        }
    )
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationship to SellerPersonaProfile
    persona_profile = relationship("SellerPersonaProfile", back_populates="shop", uselist=False, cascade="all, delete-orphan")
