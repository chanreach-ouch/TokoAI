import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base

class SellerRole(str, enum.Enum):
    OWNER = "OWNER"
    AGENT = "AGENT"

class AITrustMode(str, enum.Enum):
    CAUTIOUS = "CAUTIOUS" # Draft only, requires swipe to approve
    BALANCED = "BALANCED" # Auto-replies FAQs, but drafts orders
    AUTOPILOT = "AUTOPILOT" # Full automation, creates orders, books logistics

class Seller(Base):
    __tablename__ = "sellers"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    
    role: Mapped[str] = mapped_column(String, default=SellerRole.OWNER.value)
    shop_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("shops.id"), nullable=True)
    
    # SaaS Multi-tenant Features
    is_superadmin: Mapped[bool] = mapped_column(default=False)
    is_active: Mapped[bool] = mapped_column(default=True)
    bot_tone: Mapped[str] = mapped_column(String, default="Professional")
    ai_trust_mode: Mapped[str] = mapped_column(String, default=AITrustMode.BALANCED.value)
    ai_token_usage: Mapped[int] = mapped_column(default=0)
    ai_message_limit: Mapped[int] = mapped_column(default=50) # 50 messages for free tier
    subscription_tier: Mapped[str] = mapped_column(String, default="FREE")
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
