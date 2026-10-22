---
trigger: model_decision
description: "Load when resuming development, checking what features are finished vs incomplete, fixing TODOs, or planning next tasks."
---

# 04 — Project State, Audit Catalog & Resumption Roadmap

This document serves as the master status report for TokoAI. It catalogs all completed capabilities, unmasks every code discrepancy and stubbed module found during the architectural audit, and outlines a prioritized execution roadmap for resuming development.

---

## 1. Completed & Stable Features

The following features have been fully implemented and verified in the codebase:

1. **Sub-100ms Webhook Pipeline**:
   - Inbound endpoint `@app/api/v1/tiktok_webhook.py` handles TikTok direct message payloads.
   - Computes and verifies HMAC-SHA256 signatures via `@app/core/security.py` in <10ms.
   - Immediately returns `HTTP 200 {"status": "success", "message": "Enqueued"}`.
   - Pushes raw payload to Redis Stream via ARQ pool (`@app/core/redis.py`).
2. **Background Queue & Deduplication**:
   - Asynchronous worker settings in `@app/worker/worker.py`.
   - Redis `SETNX` message deduplication in `@app/worker/tasks.py` with 24-hour TTL (`msg:{message_id}`) to prevent double-replying to TikTok webhook retries.
3. **Dynamic Bakong KHQR Payment Engine**:
   - `@app/agent/tools/khqr_generator.py` generates authentic EMVCo TLV string payloads with CRC-16-CCITT False checksums for ABA Bank and Bakong app scanning.
   - Generates Base64-encoded PNG QR code images.
   - Tested and passing in `@tests/test_khqr.py`.
4. **Spoken Khmer Prompt Guardrails**:
   - Conversational persona in `@app/agent/prompts.py` enforces authentic spoken Khmer (`ភាសានិយាយ`) under 3 short sentences.
   - Parses Romanized Khmer (Khmeringlish) queries and bans formal literary filler phrases (`ជាដំបូង`, `សរុបមក`, `ទោះជាយ៉ាងណាក៏ដោយ`).
5. **Multi-Tenant Authentication & RBAC**:
   - Registration, login, profile retrieval, and staff invitation in `@app/api/v1/auth.py`.
   - JWT authentication and dependency injection guards in `@app/core/auth.py` (`get_current_seller`, `get_current_owner`, `get_superadmin`).
   - Password hashing with `bcrypt`.
6. **Next.js 14 Dashboard Architecture**:
   - Responsive shell in `@frontend/src/app/dashboard/layout.tsx` with `@frontend/src/components/Sidebar.tsx`, `@frontend/src/components/Topbar.tsx`, and `@frontend/src/components/MobileBottomNav.tsx`.
   - Polling-based live chat interface in `@frontend/src/app/dashboard/inbox/page.tsx` with AI takeover toggle.
   - Knowledge base management in `@frontend/src/app/dashboard/knowledge-base/page.tsx` with vision upload preview and FAQ rule management.
   - Order fulfillment table in `@frontend/src/app/dashboard/orders/page.tsx` with status badges and J&T/VET waybill trigger.
   - Non-blocking contextual notification system in `@frontend/src/context/ToastContext.tsx`.

---

## 2. Incomplete Work & Technical Debt Catalog

The architectural audit revealed the following discrepancies and fragile areas that must be addressed when resuming development:

### 1. Product Model vs. RAG Agent Schema Divergence (CRITICAL)
- **Problem**: In `@app/models/product.py`, the `Product` model has columns:
  `id`, `seller_id`, `name`, `category`, `description`, `price`, `stock`, `image_url`, `embedding`.
- **Mismatch**: In `@app/agent/rag.py` (lines 42, 94, 98), the RAG pipeline accesses:
  `p.name_kh`, `p.sku`, `p.price_usd`, `p.stock_qty`, and executes:
  `stmt = select(Product).where(Product.sku == sku, Product.seller_id == shop.owner_id)`
  Similarly, `@app/agent/tools/inventory_check.py` queries `Product.sku` and reads `product.stock_qty`.
- **Impact**: Any conversational flow attempting to format product context or execute `create_order` will crash with `AttributeError: 'Product' object has no attribute 'sku'`.

### 2. Bakong Webhook Missing Import & Table Column Error (CRITICAL)
- **Problem**: In `@app/api/v1/webhooks_bakong.py`:
  - Line 26 calls `stmt = select(Order)...`, but `select` is NOT imported from SQLAlchemy (only `from sqlalchemy import text` is imported).
  - Lines 39–42 execute raw SQL:
    `INSERT INTO messages (id, conversation_id, sender_type, content) VALUES (:id, :conv, 'SYSTEM', :content)`
    However, the `messages` table in `@app/models/chat.py` has column `role` (not `sender_type`).
- **Impact**: When Bakong posts a payment success ping, the endpoint crashes with `NameError: name 'select' is not defined` and fails to mark orders as `PAID`.

### 3. Inbox Manual Reply Model Mismatch & Outbound Gap
- **Problem**: In `@app/api/v1/inbox.py` lines 117–122:
  `new_message = Message(conversation_id=conv.id, sender_type="SELLER", role="assistant", content=req.content)`
  The `Message` model in `@app/models/chat.py` does not define `sender_type`.
- **Impact**: Sending a manual human reply from the dashboard will throw an unexpected keyword argument error in SQLAlchemy. Additionally, lines 128–130 note that manual replies are only logged to the DB and not dispatched to TikTok via `@app/integrations/tiktok_client.py`.

### 4. Products API Undefined Variable Reference
- **Problem**: In `@app/api/v1/products.py` line 109, the `get_products` endpoint executes:
  `result = await db.execute(text("... WHERE seller_id = :s"), {"s": current_user.id})`
  However, the dependency is `seller_id: str = Depends(get_current_seller)`. The variable `current_user` does not exist in scope.
- **Impact**: Calling `GET /api/v1/products/` throws `500 Internal Server Error` with `NameError: name 'current_user' is not defined`.

### 5. Frontend Product Upload Form vs. JSON Payload Mismatch
- **Problem**: In `@frontend/src/app/dashboard/knowledge-base/page.tsx` line 66, `handleSaveProduct` sends `draftProduct` as a JSON payload: `await api.post("/products", draftProduct)`.
  However, backend endpoint `create_product` in `@app/api/v1/products.py` expects multipart `Form(...)` arguments (`name: str = Form(...)`, `price: float = Form(...)`).
- **Impact**: Saving products from the Knowledge Base dashboard will fail with `422 Unprocessable Entity`.

### 6. Admin Panel Route Name Discrepancy
- **Problem**: In `@frontend/src/app/dashboard/admin/page.tsx` line 29:
  `await api.post('/admin/sellers/${sellerId}/toggle-status')`
  However, the backend endpoint in `@app/api/v1/admin.py` line 28 is:
  `@router.post("/sellers/{seller_id}/toggle-suspend")`
- **Impact**: Toggling seller suspension in the Superadmin panel fails with `404 Not Found`.

### 7. Staff Invitation Hardcoded Shop UUID
- **Problem**: In `@frontend/src/app/dashboard/settings/page.tsx` line 77, `handleInviteStaff` submits:
  `shop_id: "00000000-0000-0000-0000-000000000000"`
  In backend `@app/api/v1/auth.py` lines 97–99, the server verifies:
  `select(Shop).where(Shop.id == req.shop_id, Shop.owner_id == owner_id)`
- **Impact**: Staff invitations always fail with `403 Forbidden: Not authorized to invite to this shop`.

### 8. Pytest Test Case Signature Mismatch
- **Problem**: In `@tests/test_rag.py` line 29:
  `products = await retrieve_relevant_products("Castor Pro", mock_session)`
  However, the function signature in `@app/agent/rag.py` is:
  `async def retrieve_relevant_products(query: str, session, shop_id, top_k=2)`
- **Impact**: Running `pytest tests/test_rag.py` fails immediately with `TypeError: retrieve_relevant_products() missing 1 required positional argument: 'shop_id'`.

### 9. Static Mock Data in UI (Unwired Endpoints)
- **Customers Page (`@frontend/src/app/dashboard/customers/page.tsx`)**: Displays hardcoded `mockCustomers` array; no `/api/v1/seller/customers` endpoint exists on the backend despite `@app/models/customer.py` being defined.
- **Analytics Revenue (`@app/api/v1/analytics.py` line 38)**: Backend returns `"total_sales_usd": total_chats * 15.50` with a comment indicating sales are mocked rather than aggregated from `@app/models/order.py`.
- **Payments Page (`@frontend/src/app/dashboard/payments/page.tsx`)**: Contains hardcoded `mockTransactions` array, uses legacy styling (`bg-white`), and is not linked in `@frontend/src/components/Sidebar.tsx`.
- **Empty Directory**: `@frontend/src/app/dashboard/ai-setup` exists as an empty directory with no `page.tsx`.

### 10. Database Migrations Infrastructure Gap
- **Problem**: Directory `@alembic/versions` is empty. The project relies on `@recreate_db.py` to drop schemas and rebuild tables with `Base.metadata.create_all`.
- **Impact**: Any production deployment or schema update risks wiping active customer orders and conversation history.

---

## 3. Resumption Roadmap Execution Status (100% Completed)

All roadmap items identified during the architectural audit have been implemented, integrated, and verified against tests and production builds:

### Phase 1: High-Priority Backend Bug Fixes & Schema Alignment (VERIFIED ✅)
1. **Reconciled `Product` Schema**:
   - Added `sku` (indexed) and `name_kh` to `@app/models/product.py`.
   - Added `@property` getters and setters for `price_usd` and `stock_qty` guaranteeing backward compatibility.
2. **Fixed Webhook & Inbox Import / Attribute Bugs**:
   - `@app/api/v1/webhooks_bakong.py`: Added missing `select` import, standardized on ORM `role="system"`, and attributed customer LTV.
   - `@app/api/v1/inbox.py`: Removed invalid `sender_type="SELLER"`, standardized on `role="human_agent"`, and connected outbound DM delivery via `@app/integrations/tiktok_client.py:send_message`.
   - `@app/api/v1/products.py`: Corrected undefined variable `current_user.id` to `seller_id`.
3. **Fixed Pytest Suite**:
   - Updated `@tests/test_rag.py` to supply required `shop_id` parameter; all tests passing 100%.

### Phase 2: Frontend-Backend Contract Alignment (VERIFIED ✅)
1. **Unified Product Upload Contract**:
   - Upgraded `@app/api/v1/products.py` to parse both JSON body schemas and multipart `Form(...)` requests.
2. **Fixed Staff Invitation & Admin Routes**:
   - `@app/api/v1/auth.py` auto-resolves owner's shop when placeholder shop UUID is submitted.
   - `@app/api/v1/admin.py` provides `/sellers/{id}/toggle-status` alongside `/sellers/{id}/toggle-suspend`.
3. **Wired Dynamic Customer CRM & Analytics**:
   - Created `@app/api/v1/customers.py` with Cambodian telecom carrier auto-detection (Smart, Cellcard, Metfone).
   - Dynamic CRM table connected in `@frontend/src/app/dashboard/customers/page.tsx`.
   - Real SQL aggregation of paid/shipped revenue in `@app/api/v1/analytics.py`.

### Phase 3: Production Hardening, UX & Scalability (VERIFIED ✅)
1. **Alembic Versioning**:
   - Created initial revision `@alembic/versions/20261022_0001_initial_schema.py` tracking all 9 tables, indexes, and pgvector extension.
   - Updated `@alembic/env.py` to import all models (`Shop`, `Seller`, `Product`, `Order`, `Chat`, `Customer`, `User`, `FAQ`).
2. **Live Logistics & Label Generation**:
   - Upgraded `@app/integrations/logistics.py` with live API caller support, Cambodian hub routing (`PNH`, `REP`, `BBM`, `KOS`), and provider normalization for J&T Express and Virak Buntham.
   - Built printable 4x6" thermal waybill shipping label modal with simulated barcode, consignee routing, and COD collection amount in `@frontend/src/app/dashboard/orders/page.tsx`.
3. **Dual Currency Affordances**:
   - Implemented standard dual-currency display ($USD and ៛KHR at 4,100 KHR / USD) across Orders, Analytics, Knowledge Base, and Payments.
4. **Interactive AI Sales Agent Simulator & Playground**:
   - Built `@frontend/src/app/dashboard/ai-setup/page.tsx` with 1-tap test scenarios (Khmeringlish query, price bargaining, payment slip inquiry, attacker prompt injection, and human escalation).
   - Created simulation test endpoint `POST /api/v1/seller/settings/simulate` in `@app/api/v1/settings.py`.
5. **Bakong Settlements Console**:
   - Modernized `@frontend/src/app/dashboard/payments/page.tsx` with live order ledger, NBC verification badges, and linked directly in `@frontend/src/components/Sidebar.tsx`.

