import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base

class PaymentTransaction(Base):
    """
    Stores verified bank transactions from NBC Bakong webhooks or Vision slip verification.
    Guarantees idempotency via UNIQUE(bank_ref_id).
    """
    __tablename__ = "payment_transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("shops.id", ondelete="CASCADE"), index=True, nullable=False)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)

    bank_name: Mapped[str] = mapped_column(String, default="Bakong") # ABA, ACLEDA, Canadia, Wing, Bakong
    bank_ref_id: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False) # e.g. TRX-99214872
    
    amount_usd: Mapped[float] = mapped_column(Float, nullable=False)
    amount_khr: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    sender_name: Mapped[str | None] = mapped_column(String, nullable=True)
    sender_account: Mapped[str | None] = mapped_column(String, nullable=True)
    slip_image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    
    status: Mapped[str] = mapped_column(String, default="VERIFIED") # VERIFIED, REJECTED, DUPLICATE_FLAGGED
    raw_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ix_payment_transactions_shop_ref", "shop_id", "bank_ref_id"),
    )
