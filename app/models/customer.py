import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base

class Customer(Base):
    """
    Advanced CRM Table to crush Competitor 1's rigid data tables.
    Tracks LTV, Platform, and cross-channel identity.
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
    
    # Analytics (Automatically updated by Webhooks)
    lifetime_value_usd: Mapped[float] = mapped_column(Float, default=0.0)
    total_orders: Mapped[int] = mapped_column(default=0)
    
    last_active_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
