# SaaS Multi-Tenancy & AI Onboarding Architecture

This document outlines the technical strategy for transforming the single-tenant TikTok Commerce AI Agent into a Multi-Tenant SaaS platform designed specifically for the Cambodian e-commerce market.

## 1. Core Objectives
1. **Multi-Shop Support:** Allow hundreds of different sellers to use the system simultaneously without their inventory or conversations overlapping.
2. **Zero-Friction Onboarding (AI Enrichment):** Allow sellers to add products effortlessly by simply providing a photo, name, price, and stock. The system will use Gemini AI to automatically research specs and generate rich descriptions for the RAG database.
3. **Seamless TikTok Integration:** Use the seller's TikTok Page ID to route incoming messages to the correct shop's database context.

---

## 2. Database Upgrades (SQLAlchemy)

To separate data securely between sellers, we must introduce the concept of a `Shop` or `Seller`.

### New Model: `Shop`
- `id` (UUID, Primary Key)
- `tiktok_page_id` (String, Unique) - The ID provided by the TikTok Webhook to route messages.
- `name` (String)
- `bakong_merchant_id` (String) - Unique to each seller for payments.

### Updated Models
Every existing model must be tied to a specific shop.
- **`Product`**: Add `shop_id` (Foreign Key). 
- **`Order`**: Add `shop_id` (Foreign Key).
- **`Conversation`**: Add `shop_id` (Foreign Key).

---

## 3. The "AI Product Upload" Workflow (Gemini Auto-Enrichment)

When a seller wants to add a new product via the web dashboard or mobile app, they hit a new API endpoint.

**Endpoint:** `POST /api/v1/seller/products/upload`
**Input:** Image File, Name (e.g., "KZ Castor Pro"), Price, Stock.

**Backend Flow:**
1. **Vision Analysis:** The server sends the image and Name to `gemini-1.5-flash` with a strict prompt: 
   *"You are an expert e-commerce copywriter. Analyze this product image and name. Research its technical specifications. Write a highly detailed product description in both English and Khmer. Return a JSON object containing the descriptions and common search aliases."*
2. **Vector Generation:** The server takes the generated description and passes it to `text-embedding-004` to get the `pgvector` embeddings.
3. **Database Insertion:** The product is saved to the PostgreSQL database, linked to the seller's `shop_id`, complete with the rich AI-generated specs and embeddings.

*Benefit: Costs < $0.01 per product in API tokens, happens only once during upload, and makes RAG incredibly accurate.*

---

## 4. Webhook & RAG Routing Updates

When a TikTok message arrives, the system must know which Shop's inventory to search.

**1. Webhook Interception (`tiktok_webhook.py`)**
- Extract `recipient_id` (The seller's TikTok Page ID) from the incoming JSON payload.
- Look up the `Shop` in the database using this `tiktok_page_id`.
- Pass the `shop_id` to the ARQ background worker.

**2. RAG Filtering (`rag.py`)**
- Update the `retrieve_relevant_products` function.
- Change the SQL statement from a global search to a filtered search:
  ```python
  stmt = select(Product).where(
      Product.shop_id == current_shop_id
  ).order_by(
      Product.embedding.cosine_distance(query_embedding)
  ).limit(top_k)
  ```

---

## 5. Implementation Phases
- [ ] **Phase 1:** Update `app/models/` to include `Shop` and foreign keys. Generate Alembic migrations if needed (or drop/recreate tables for MVP).
- [ ] **Phase 2:** Update `app/api/v1/tiktok_webhook.py` and `app/worker/tasks.py` to route the `shop_id`.
- [ ] **Phase 3:** Update `app/agent/rag.py` to filter cosine similarity searches by `shop_id`.
- [ ] **Phase 4:** Build the `POST /api/v1/seller/products/upload` endpoint integrating Gemini Vision and Embedding.
