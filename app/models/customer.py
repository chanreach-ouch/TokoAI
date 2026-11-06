import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models.base import Base

class Customer(Base):
    """
    Advanced CRM Table with Long-Term Buyer Memory.
    Tracks LTV, buyer tier, platform identities, communication styles, and past purchases.
    """
    __tablename__ = "customers"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shop_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("shops.id"), nullable=False)
    
    # Omnichannel Identifiers
    platform_id: Mapped[str] = mapped_column(String, index=True, nullable=False) # e.g. PSID for Messenger, TikTok User ID
    platform_source: Mapped[str] = mapped_column(String, default="tiktok") # tiktok, messenger, instagram
    
    # Profile
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    shipping_address: Mapped[str | None] = mapped_column(String, nullable=True)
    
    # Buyer Memory & Tiering
    buyer_tier: Mapped[str] = mapped_column(String, default="NEW") # NEW, RETURNING, VIP
    communication_style_notes: Mapped[str | None] = mapped_column(String, nullable=True) # e.g. "prefers Khmeringlish, bargains often, voice notes"
    preferred_sizes_variants: Mapped[dict] = mapped_column(JSONB, default=dict)
    last_purchased_skus: Mapped[list] = mapped_column(JSONB, default=list)
    
    # Analytics (Automatically updated by Webhooks)
    lifetime_value_usd: Mapped[float] = mapped_column(Float, default=0.0)
    total_orders: Mapped[int] = mapped_column(default=0)
    
    last_active_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
