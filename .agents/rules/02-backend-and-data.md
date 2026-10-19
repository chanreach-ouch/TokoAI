---
trigger: model_decision
description: "Load when working on backend routes, API endpoints, controllers, services, middleware, auth, database schemas, ORM models, or external integrations."
---

# 02 — Backend Architecture, APIs & Data Models

This guide documents TokoAI's backend architecture, API router endpoints, database schemas, authentication middleware, and external service integrations.

---

## 1. REST API Endpoint Inventory

All API endpoints are prefixed with `/api/v1` and registered in `@app/main.py`.

### Authentication Router (`@app/api/v1/auth.py`)
- `POST /api/v1/auth/register`: Creates new `Seller` account. Validates password complexity (minimum 8 chars, 1 letter, 1 number, 1 special character). Hashes password with `bcrypt`.
- `POST /api/v1/auth/login`: Authenticates seller and returns a 7-day HS256 JWT bearer token containing `sub` (seller ID), `email`, `role`, `is_superadmin`, and `shop_id`.
- `GET /api/v1/auth/me`: Returns profile of the currently authenticated seller (`get_current_seller` dependency).
- `POST /api/v1/auth/invite`: Owner-only endpoint (`get_current_owner`). Invites a staff member with `role="AGENT"` assigned to the owner's `shop_id`.

### Webhooks Router (`@app/api/v1/tiktok_webhook.py` & `@app/api/v1/webhooks_bakong.py`)
- `POST /api/v1/webhooks/tiktok/`: High-throughput ingestion endpoint for TikTok DMs. Rate-limited to 30 req/min via SlowAPI. Verifies HMAC-SHA256 signature in `x-tiktok-signature` header, enqueues payload to ARQ (`process_tiktok_message`), and returns `200 OK`.
- `POST /api/v1/webhooks/bakong/`: Payment notification webhook from National Bank of Cambodia / Bakong partner banks. Updates matching `Order.status` to `PAID` and logs an automated confirmation message into the chat thread.

### Products Router (`@app/api/v1/products.py`)
- `POST /api/v1/products/extract-vision`: Accepts multipart image upload, writes to `@app/static/uploads`, and calls Gemini 1.5 Flash Vision to extract JSON specifications (name, category, color, description).
- `POST /api/v1/products/`: Accepts product attributes, generates 768-dimensional text embedding, executes pgvector cosine duplicate check (`<=>`), and persists new `Product` tied to `seller_id`.
- `GET /api/v1/products/`: Returns all products belonging to the logged-in seller for catalog display.

### Seller & Shop Router (`@app/api/v1/seller.py`)
- `POST /api/v1/seller/shop`: Upserts a `Shop` entity linking `tiktok_page_id`, `name`, `bakong_merchant_id`, and `tiktok_access_token` to `owner_id`.
- `GET /api/v1/seller/integrations`: Fetches active integration keys (`tiktok_page_id`, `bakong_merchant_id`) for the seller's shop.
- `POST /api/v1/seller/integrations`: Updates channel credentials for the seller's shop.

### Live Inbox Router (`@app/api/v1/inbox.py`)
- `GET /api/v1/seller/inbox`: Lists all active conversation threads for the authenticated seller, eagerly loading the latest message and sorted by `updated_at` descending.
- `GET /api/v1/seller/inbox/{conversation_id}`: Fetches complete message history for a specific conversation.
- `POST /api/v1/seller/inbox/{conversation_id}/takeover`: Toggles `is_human_takeover` boolean flag to pause or resume automated AI responses.
- `POST /api/v1/seller/inbox/{conversation_id}/reply`: Sends a manual staff reply (rate-limited to 20/min), automatically setting `is_human_takeover = True`.

### Order Management Router (`@app/api/v1/orders.py`)
- `GET /api/v1/orders/`: Paginated order query (`skip`, `limit`) scoped across all shops owned by the authenticated seller.
- `PATCH /api/v1/orders/{order_id}`: Updates order status (`PENDING`, `PAID`, `SHIPPED`, `CANCELLED`).
- `POST /api/v1/orders/{order_id}/waybill`: Generates shipping waybill and tracking number with J&T Express or Virak Buntham for paid orders. Updates status to `SHIPPED`.

### Seller Settings & FAQs (`@app/api/v1/settings.py` & `@app/api/v1/faqs.py`)
- `GET /api/v1/seller/settings`: Retrieves AI bot tone, active status, token consumption, and subscription tier.
- `POST /api/v1/seller/settings`: Updates `bot_tone` and `is_active` settings.
- `GET /api/v1/seller/faqs`: Retrieves custom store FAQ rules.
- `POST /api/v1/seller/faqs`: Creates new store FAQ rule.
- `DELETE /api/v1/seller/faqs/{faq_id}`: Deletes a store FAQ rule.

### Analytics & Superadmin (`@app/api/v1/analytics.py` & `@app/api/v1/admin.py`)
- `GET /api/v1/seller/analytics`: Returns counts of total chats, active products, token usage, and attributed revenue.
- `GET /api/v1/admin/sellers`: Superadmin endpoint (`get_superadmin` dependency) listing all tenant accounts.
- `POST /api/v1/admin/sellers/{seller_id}/toggle-suspend`: Superadmin endpoint to suspend or reactivate a tenant account.

---

## 2. Database Schema & ORM Models

All models extend `Base` from `@app/models/base.py`.

```mermaid
erDiagram
    Sellers ||--o{ Shops : "owns"
    Sellers ||--o{ Products : "catalogs"
    Sellers ||--o{ FAQs : "defines"
    Sellers ||--o{ Conversations : "manages"
    Shops ||--o{ Users : "interacts with"
    Shops ||--o{ Orders : "processes"
    Conversations ||--o{ Messages : "contains"
    Users ||--o{ Orders : "places"

    Sellers {
        uuid id PK
        string email
        string hashed_password
        string role "OWNER | AGENT"
        uuid shop_id FK "nullable"
        boolean is_superadmin
        boolean is_active
        string bot_tone
        string ai_trust_mode "CAUTIOUS | BALANCED | AUTOPILOT"
        int ai_token_usage
        int ai_message_limit
        string subscription_tier
        datetime created_at
    }

    Shops {
        uuid id PK
        string tiktok_page_id UK
        uuid owner_id FK
        string tiktok_access_token
        string name
        string bakong_merchant_id
        datetime created_at
    }

    Products {
        uuid id PK
        uuid seller_id FK
        string name
        string category
        text description
        float price
        int stock
        string image_url
        vector_768 embedding "HNSW Indexed"
        datetime created_at
    }

    Conversations {
        uuid id PK
        uuid seller_id FK
        string customer_platform_id
        boolean is_human_takeover
        datetime created_at
        datetime updated_at
    }

    Messages {
        uuid id PK
        uuid conversation_id FK
        string role "user | ai | human_agent"
        text content
        datetime created_at
    }

    Orders {
        int id PK
        uuid shop_id FK
        int user_id FK
        jsonb items
        numeric total_amount_usd
        string status "PENDING | PAID | SHIPPED | CANCELLED"
        string khqr_string
        string khqr_md5
        string tracking_number
        string waybill_url
        string logistics_provider
        datetime created_at
    }

    Customers {
        uuid id PK
        uuid shop_id FK
        string platform_id
        string platform_source "tiktok | messenger | instagram"
        string name
        string phone
        string shipping_address
        float lifetime_value_usd
        int total_orders
        datetime last_active_at
    }
```

### Table Definitions & Key Columns

1. **`sellers` (`@app/models/seller.py`)**:
   - `id`: UUID Primary Key.
   - `role`: Enum `SellerRole` (`OWNER` has full settings/billing access; `AGENT` is restricted to inbox and orders).
   - `ai_trust_mode`: Enum `AITrustMode` (`CAUTIOUS` drafts only, `BALANCED` auto-replies FAQs, `AUTOPILOT` creates orders autonomously).
   - `ai_token_usage` / `ai_message_limit`: Hard quota caps for multi-tenant billing tiers.
2. **`shops` (`@app/models/shop.py`)**:
   - `tiktok_page_id`: Unique identifier from the TikTok webhook routing message traffic to the shop.
   - `bakong_merchant_id`: Merchant ID for dynamic KHQR generation.
3. **`products` (`@app/models/product.py`)**:
   - `embedding`: Vector(768) column indexed with PostgreSQL HNSW (`vector_cosine_ops`) for fast approximate nearest neighbor search.
4. **`conversations` & `messages` (`@app/models/chat.py`)**:
   - `is_human_takeover`: Boolean flag inspected by worker tasks before invoking Gemini AI.
   - `role`: String indicator (`user`, `ai`, `human_agent`).
5. **`orders` (`@app/models/order.py`)**:
   - `items`: JSONB storage for line items (`{"sku": ..., "qty": ...}`).
   - `status`: Order progression (`PENDING` -> `PAID` -> `SHIPPED`).
6. **`customers` (`@app/models/customer.py`)**:
   - Omnichannel identity tracking across TikTok, Facebook Messenger, and Instagram.

---

## 3. Authentication & Authorization Middleware

Defined in `@app/core/auth.py`:

- **Password Hashing**: Direct `bcrypt.hashpw` with salt generation and `bcrypt.checkpw` verification.
- **JWT Bearer Authentication**: Uses `fastapi.security.HTTPBearer` and `jwt.decode` with algorithm `HS256`. Tokens expire after 7 days (10,080 minutes).
- **Dependency Guards**:
  - `get_current_seller`: Validates JWT signature and extracts `sub` (seller ID).
  - `get_superadmin`: Enforces `payload["is_superadmin"] == True`. Throws 403 Forbidden otherwise.
  - `get_current_owner`: Enforces `payload["role"] == "OWNER"`. Protects shop settings, billing, and staff invitations.
  - `get_current_agent`: Allows both `OWNER` and `AGENT` roles. Protects inbox and order dispatch.

---

## 4. External Integrations & Tool Logic

### 1. Google Gemini AI Engine
- **Multimodal Vision** (`@app/services/gemini.py`):
  Uses `gemini-1.5-flash` to extract structured JSON metadata (product name, category, color, description) from uploaded photos.
- **Text Embeddings** (`@app/services/gemini.py` & `@app/agent/rag.py`):
  Generates 768-dimensional embeddings using `text-embedding-004` or `gemini-embedding-2`.
- **Conversational RAG** (`@app/agent/rag.py`):
  Executes straight-line retrieval via PostgreSQL `pgvector`, formats prompt with `@app/agent/prompts.py`, and invokes `gemini-2.5-flash` with native function declaration `create_order`.

### 2. Bakong KHQR Payment Engine (`@app/agent/tools/khqr_generator.py`)
- Generates EMVCo-compliant QR strings:
  - Tag 00: Payload Format (`01`)
  - Tag 01: Point of Initiation Method (`11` = Dynamic)
  - Tag 29: Merchant Account Information (`bakong.com.kh` + `BAKONG_MERCHANT_ID`)
  - Tag 53: Transaction Currency (`840` = USD)
  - Tag 54: Transaction Amount
  - Tag 58: Country Code (`KH`)
  - Tag 59: Merchant Name (`BAKONG_ACCOUNT_NAME`)
  - Tag 60: Merchant City (`Phnom Penh`)
  - Tag 63: CRC-16 Checksum (calculated using `Crc16CcittFalse`)
- Generates Base64-encoded PNG QR images ready for chat rendering.

### 3. TikTok Business Messaging API (`@app/integrations/tiktok_client.py`)
- Sends outbound direct messages using `httpx.AsyncClient` to `https://open.tiktokapis.com/v2/business/message/send/` authenticated via Bearer token (`shop.tiktok_access_token` or fallback `TIKTOK_ACCESS_TOKEN`).

### 4. Logistics Waybill Generators (`@app/integrations/logistics.py`)
- `generate_jnt_waybill`: Generates J&T Express tracking number (`JT...`) and waybill tracking URL.
- `generate_vet_waybill`: Generates Virak Buntham tracking number (`VET-...`) and waybill URL.

---

## 5. Required Environment Variables

All variables are loaded via `@app/config.py` from `.env`:

| Variable Name | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (`postgresql+asyncpg://user:pass@host:5432/dbname`) |
| `REDIS_URL` | Yes | Redis connection string (`redis://host:6379/0`) for ARQ and caching |
| `GEMINI_API_KEY` | Yes | Google GenAI API key for Vision, Embeddings, and chat generation |
| `TIKTOK_APP_SECRET` | Yes | Secret key for verifying incoming TikTok webhook HMAC-SHA256 signatures |
| `TIKTOK_ACCESS_TOKEN` | Yes | Default access token for TikTok Business Messaging API |
| `BAKONG_MERCHANT_ID` | Yes | Merchant identifier for dynamic KHQR generation (e.g., `seller@abaa`) |
| `BAKONG_ACCOUNT_NAME` | Yes | Display account name embedded in KHQR payloads |
| `JWT_SECRET_KEY` | Optional | Secret key for signing HS256 JWT tokens (defaults to dev fallback) |
| `FRONTEND_URL` | Optional | Origin allowed in CORS configuration (defaults to `http://localhost:3000`) |
