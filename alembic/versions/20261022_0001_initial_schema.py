"""Initial schema migration for TokoAI

Revision ID: 20261022_0001
Revises: 
Create Date: 2026-10-22

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = '20261022_0001'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Ensure pgvector extension is available
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 1. Shops table
    op.create_table(
        'shops',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('owner_id', UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('tiktok_page_id', sa.String(), unique=True, index=True, nullable=True),
        sa.Column('tiktok_access_token', sa.String(), nullable=True),
        sa.Column('bakong_account_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 2. Sellers table
    op.create_table(
        'sellers',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(), unique=True, index=True, nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('role', sa.String(), server_default='OWNER', nullable=False),
        sa.Column('shop_id', UUID(as_uuid=True), sa.ForeignKey('shops.id'), nullable=True),
        sa.Column('is_superadmin', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('bot_tone', sa.String(), server_default='Professional', nullable=False),
        sa.Column('ai_trust_mode', sa.String(), server_default='BALANCED', nullable=False),
        sa.Column('ai_token_usage', sa.Integer(), server_default='0', nullable=False),
        sa.Column('ai_message_limit', sa.Integer(), server_default='50', nullable=False),
        sa.Column('subscription_tier', sa.String(), server_default='FREE', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 3. Products table
    op.create_table(
        'products',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('seller_id', UUID(as_uuid=True), sa.ForeignKey('sellers.id'), nullable=False, index=True),
        sa.Column('sku', sa.String(), unique=True, index=True, nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('name_kh', sa.String(), nullable=True),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('stock', sa.Integer(), server_default='0', nullable=False),
        sa.Column('image_url', sa.String(), nullable=True),
        sa.Column('embedding', Vector(768), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 4. Users (Customers) table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('tiktok_open_id', sa.String(), unique=True, index=True, nullable=False),
        sa.Column('phone_number', sa.String(), nullable=True),
        sa.Column('delivery_address', sa.String(), nullable=True),
        sa.Column('carrier', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 5. Customers CRM table
    op.create_table(
        'customers',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('shop_id', UUID(as_uuid=True), sa.ForeignKey('shops.id'), nullable=False, index=True),
        sa.Column('platform_id', sa.String(), nullable=False, index=True),
        sa.Column('platform_source', sa.String(), server_default='tiktok', nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('shipping_address', sa.String(), nullable=True),
        sa.Column('carrier', sa.String(), nullable=True),
        sa.Column('total_orders', sa.Integer(), server_default='0', nullable=False),
        sa.Column('lifetime_value_usd', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 6. Orders table
    op.create_table(
        'orders',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('shop_id', UUID(as_uuid=True), sa.ForeignKey('shops.id'), nullable=False, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('items', sa.JSON(), nullable=True),
        sa.Column('total_amount_usd', sa.Float(), nullable=False),
        sa.Column('payment_method', sa.String(), server_default='KHQR', nullable=False),
        sa.Column('delivery_fee_usd', sa.Float(), server_default='1.50', nullable=False),
        sa.Column('customer_phone', sa.String(), nullable=True),
        sa.Column('delivery_address', sa.String(), nullable=True),
        sa.Column('status', sa.String(), server_default='PENDING', nullable=False),
        sa.Column('khqr_string', sa.String(), nullable=True),
        sa.Column('tracking_number', sa.String(), nullable=True),
        sa.Column('waybill_url', sa.String(), nullable=True),
        sa.Column('logistics_provider', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 7. Conversations table
    op.create_table(
        'conversations',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('seller_id', UUID(as_uuid=True), sa.ForeignKey('sellers.id'), nullable=False, index=True),
        sa.Column('customer_platform_id', sa.String(), nullable=False, index=True),
        sa.Column('is_human_takeover', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 8. Messages table
    op.create_table(
        'messages',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('conversation_id', UUID(as_uuid=True), sa.ForeignKey('conversations.id'), nullable=False, index=True),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('content', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 9. FAQs table
    op.create_table(
        'faqs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('seller_id', UUID(as_uuid=True), sa.ForeignKey('sellers.id'), nullable=False, index=True),
        sa.Column('question', sa.String(), nullable=False),
        sa.Column('answer', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    )

def downgrade() -> None:
    op.drop_table('faqs')
    op.drop_table('messages')
    op.drop_table('conversations')
    op.drop_table('orders')
    op.drop_table('customers')
    op.drop_table('users')
    op.drop_table('products')
    op.drop_table('sellers')
    op.drop_table('shops')
