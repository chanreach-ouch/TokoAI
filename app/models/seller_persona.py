import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from app.models.base import Base

class SellerPersonaProfile(Base):
    """
    Stores historical owner persona cloning attributes:
    - Tone signatures, preferred colloquialisms
    - First-message opening hooks
    - Objection handling & persuasion tactics
    - Reply pacing and modality preference
    """
    __tablename__ = "seller_persona_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("shops.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)

    selling_signature_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    opening_hooks: Mapped[list] = mapped_column(JSONB, default=list) # e.g. ["សួស្តីបង! ម៉ូតនេះទើបមកដល់ក្តៅៗ..."]
    persuasion_tactics: Mapped[list] = mapped_column(JSONB, default=list) # e.g. ["Offer free delivery if ordering 2+", ...]
    
    avg_reply_length_chars: Mapped[int] = mapped_column(Integer, default=95)
    avg_voice_duration_sec: Mapped[float] = mapped_column(Float, default=12.0)
    preferred_reply_modality: Mapped[str] = mapped_column(String, default="ADAPTIVE") # TEXT_ONLY, VOICE_AND_TEXT, ADAPTIVE
    
    # 768-dimensional embedding of typical high-converting conversations
    historical_samples_embedding = mapped_column(Vector(768), nullable=True)
    
    raw_training_transcripts: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationship to shop
    shop = relationship("Shop", back_populates="persona_profile")
