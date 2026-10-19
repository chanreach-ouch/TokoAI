---
trigger: always_on
description: "Core system architecture, annotated directory tree, entry points, and cross-component data flow."
---

# 01 — System Architecture & Data Flow

This document details TokoAI's macro topology, file hierarchy, runtime lifecycles, and asynchronous request pipelines.

---

## 1. Annotated Repository Topology

```text
TokoAI/
├── AGENTS.md                               # Master engineering guide & coding invariants
├── Makefile                                # Developer shortcuts (up, down, build, test, logs)
├── docker-compose.yml                      # Container orchestrator (PostgreSQL, Redis, Backend, Worker, Frontend)
├── Dockerfile.backend                      # Multi-stage Python 3.12 slim container
├── Dockerfile.frontend                     # Multi-stage Node 18 Alpine container
├── requirements.txt                        # Backend Python dependencies
├── recreate_db.py                          # Database schema rebuild & admin seed utility
├── seed_mock_data.py                       # Mock product catalog with 768d vector embeddings
├── seed_shop.py                            # Test shop linking utility for mock merchant
├── simulate_tiktok_chat.py                 # CLI webhook simulation with HMAC calculation
│
├── alembic/                                # Database migration environment
│   ├── env.py                              # SQLAlchemy metadata hook
│   └── versions/                           # Versioned migration scripts (currently empty)
│
├── app/                                    # Core FastAPI application package
│   ├── main.py                             # FastAPI factory, CORS, static uploads, and router registration
│   ├── config.py                           # Pydantic BaseSettings loading from .env
│   │
│   ├── core/                               # Cross-cutting foundational infrastructure
│   │   ├── db.py                           # Async SQLAlchemy engine & AsyncSessionLocal factory
│   │   ├── redis.py                        # Redis connection pool & ARQ pool singleton
│   │   ├── auth.py                         # JWT token creation, password hashing, and RBAC guards
│   │   ├── security.py                     # TikTok HMAC-SHA256 signature verification helper
│   │   └── rate_limit.py                   # SlowAPI limiter instance
│   │
│   ├── models/                             # Declarative SQLAlchemy ORM models
│   │   ├── base.py                         # Declarative Base
│   │   ├── seller.py                       # Seller accounts, roles (OWNER/AGENT), quotas, trust modes
│   │   ├── shop.py                         # Multi-tenant Shop entity linked to TikTok Page ID
│   │   ├── product.py                      # Products with pgvector 768-dimensional embeddings
│   │   ├── customer.py                     # Omnichannel customer CRM records and LTV attribution
│   │   ├── user.py                         # Customer records linked to TikTok OpenID & addresses
│   │   ├── order.py                        # Orders, payment states (PENDING/PAID/SHIPPED), KHQR strings
│   │   ├── chat.py                         # Conversation threads, human takeover flag, and Messages
│   │   └── faq.py                          # Knowledge base store rules for RAG prompt injection
│   │
│   ├── api/v1/                             # REST API routing layer
│   │   ├── auth.py                         # /api/v1/auth: Register, Login, Me, and Staff Invite
│   │   ├── tiktok_webhook.py               # /api/v1/webhooks/tiktok: Inbound message ingestion
│   │   ├── webhooks_bakong.py              # /api/v1/webhooks/bakong: Bank payment confirmation hook
│   │   ├── products.py                     # /api/v1/products: Vision metadata extraction & catalog CRUD
│   │   ├── seller.py                       # /api/v1/seller: Shop configuration & integration setup
│   │   ├── orders.py                       # /api/v1/orders: Order listing, status updates, waybill generation
│   │   ├── inbox.py                        # /api/v1/seller/inbox: Live conversations, manual replies, takeover
│   │   ├── settings.py                     # /api/v1/seller/settings: Bot tone & automation toggles
│   │   ├── faqs.py                         # /api/v1/seller/faqs: Custom store QA rules
│   │   ├── analytics.py                    # /api/v1/seller/analytics: Message counts & sales attribution
│   │   └── admin.py                        # /api/v1/admin: Superadmin tenant oversight & suspension
│   │
│   ├── agent/                              # Conversational AI brain & RAG logic
│   │   ├── prompts.py                      # Spoken Khmer system prompt & tone guardrails
│   │   ├── rag.py                          # Vector similarity search & Gemini tool calling loop
│   │   └── tools/                          # Native Python tools called by Gemini
│   │       ├── khqr_generator.py           # Dynamic Bakong KHQR EMVCo & CRC-16 generator
│   │       ├── inventory_check.py          # Real-time SKU stock verification
│   │       └── address_parser.py           # Cambodian phone number and landmark extractor
│   │
│   ├── services/                           # External AI integrations
│   │   └── gemini.py                       # Gemini 1.5 Flash multimodal vision & embedding wrappers
│   │
│   ├── integrations/                       # Third-party platform clients
│   │   ├── tiktok_client.py                # TikTok Business Messaging API async HTTP client
│   │   └── logistics.py                    # J&T Express & Virak Buntham waybill generators
│   │
│   └── worker/                             # Asynchronous background job system
│       ├── worker.py                       # ARQ WorkerSettings entry point & cron definitions
│       └── tasks.py                        # process_tiktok_message & abandoned cart follow-up
│
├── frontend/                               # Next.js 14 Web Application
│   ├── package.json                        # Frontend dependencies & scripts
│   ├── tailwind.config.ts                  # Tailwind configuration & custom palette tokens
│   └── src/
│       ├── app/                            # Next.js App Router pages
│       │   ├── layout.tsx                  # Root layout with Kantumruy Pro & ToastProvider
│       │   ├── globals.css                 # HSL color variables & Khmer line-height utilities
│       │   ├── page.tsx                    # Marketing landing page with spoken Khmer chat demo
│       │   ├── login/page.tsx              # Merchant authentication portal
│       │   ├── register/page.tsx           # New shop registration
│       │   ├── onboarding/page.tsx         # New merchant setup wizard
│       │   └── dashboard/                  # Authenticated seller cockpit
│       │       ├── layout.tsx              # Dashboard shell with responsive Sidebar & Topbar
│       │       ├── page.tsx                # Operations overview & action triage
│       │       ├── inbox/page.tsx          # Real-time chat console with AI pause toggle
│       │       ├── knowledge-base/page.tsx # AI product catalog & FAQ management
│       │       ├── orders/page.tsx         # Order fulfillment & 1-tap logistics dispatch
│       │       ├── customers/page.tsx      # Cambodian customer CRM & phone directory
│       │       ├── integrations/page.tsx   # TikTok Page ID & Bakong Merchant setup
│       │       ├── analytics/page.tsx      # Performance metrics & AI vs human revenue charts
│       │       ├── settings/page.tsx       # Safeguards, staff invites, and bot tone
│       │       └── admin/page.tsx          # Platform superadmin tenant management
│       │
│       ├── components/                     # Reusable UI components
│       │   ├── Sidebar.tsx                 # Desktop collapsible navigation with token meter
│       │   ├── Topbar.tsx                  # Global header with status indicator & profile
│       │   ├── MobileBottomNav.tsx         # 1-tap mobile navigation bar (44px+ hit targets)
│       │   └── ui/design-system.tsx        # Tailored dark-mode buttons, inputs, cards, and badges
│       │
│       ├── context/                        # React context providers
│       │   ├── AuthContext.tsx             # JWT decoding, user session, and route protection
│       │   └── ToastContext.tsx            # Contextual non-blocking notifications
│       │
│       └── lib/
│           └── api.ts                      # Axios instance with auth interceptors
│
├── docs/                                   # Architectural specifications & competitor teardowns
│   ├── saas_architecture_plan.md           # Multi-tenant migration strategy
│   ├── system_management_upgrade.md        # Staff RBAC & AI takeover specifications
│   └── why_no_langchain_and_langgraph.md   # Architectural rationale for raw Python RAG
│
└── tests/                                  # Pytest suite
    ├── test_webhook.py                     # HMAC verification & 200 OK tests
    ├── test_khqr.py                        # EMVCo format & CRC-16 checksum validation
    └── test_rag.py                         # Vector search mock tests
```

---

## 2. Core Application Entry Points

- **Backend Web Server**: `@app/main.py`
  Bootstraps FastAPI, mounts static directory `@app/static/uploads`, registers CORS middleware, binds SlowAPI rate limiter, and attaches all 11 API routers.
- **Background Worker**: `@app/worker/worker.py`
  Instantiates ARQ `WorkerSettings` reading from `REDIS_URL`. Registers asynchronous job `process_tiktok_message` and hourly cron job `abandoned_cart_followup`.
- **Frontend App Shell**: `@frontend/src/app/layout.tsx`
  Loads `@fontsource/kantumruy-pro` and `@fontsource/inter`, wrapping child routes inside `AuthProvider` and `ToastProvider`.
- **Dashboard Shell**: `@frontend/src/app/dashboard/layout.tsx`
  Guards protected routes via `GET /api/v1/auth/me` and renders `@frontend/src/components/Sidebar.tsx`, `@frontend/src/components/Topbar.tsx`, and `@frontend/src/components/MobileBottomNav.tsx`.

---

## 3. End-to-End Inbound Message Data Flow

The following lifecycle executes for every incoming TikTok direct message:

```text
[TikTok Customer]
       │
       ▼ (Sends Direct Message)
[TikTok Business Messaging Webhook]
       │
       ▼ POST /api/v1/webhooks/tiktok/ (Header: x-tiktok-signature)
[@app/api/v1/tiktok_webhook.py]
       │
       ├─► 1. Verify HMAC-SHA256 signature against TIKTOK_APP_SECRET (< 10ms)
       ├─► 2. Enqueue payload bytes to Redis via ARQ (< 30ms)
       └─► 3. Return HTTP 200 {"status": "success", "message": "Enqueued"} (< 50ms total)
                     │
                     ▼ (Redis Stream Queue: 'arq:queue')
[@app/worker/tasks.py -> process_tiktok_message]
       │
       ├─► 4. Message Deduplication: Redis SETNX `msg:{message_id}` (TTL: 86400s)
       │      └─ If duplicate, abort immediately.
       │
       ├─► 5. Multi-Tenant Shop Resolution:
       │      SELECT * FROM shops WHERE tiktok_page_id = recipient_id
       │
       ├─► 6. Human Takeover Check:
       │      SELECT is_human_takeover FROM conversations 
       │      WHERE seller_id = shop.owner_id AND customer_platform_id = sender_id
       │      └─ If is_human_takeover == True: Log & Abort (AI Paused)
       │
       ├─► 7. SaaS Quota Check:
       │      Verify seller.ai_token_usage < seller.ai_message_limit.
       │      └─ If exceeded: Send quota notification to buyer & Abort.
       │
       ├─► 8. Session Context Retrieval:
       │      Fetch recent chat turns from Redis: LRANGE `session:{shop.id}:{sender_id}` 0 5
       │
       ├─► 9. Vector Similarity Search [@app/agent/rag.py]:
       │      a. Embed incoming message text via Gemini Embedding API.
       │      b. Query PostgreSQL pgvector with cosine distance bounded by shop.owner_id:
       │         SELECT * FROM products WHERE seller_id = shop.owner_id 
       │         ORDER BY embedding <=> query_embedding LIMIT 2
       │
       ├─► 10. Language Generation & Tool Calling [@app/agent/rag.py]:
       │      Send Spoken Khmer System Prompt + Product Context + Memory to `gemini-2.5-flash`.
       │      If buyer confirms intent to purchase:
       │         a. Model triggers `create_order(sku, quantity)`.
       │         b. Backend verifies live stock and inserts Order into Postgres.
       │         c. Backend generates Bakong KHQR payload [@app/agent/tools/khqr_generator.py].
       │         d. Model generates conversational confirmation with QR instructions.
       │
       ├─► 11. State Persistence:
       │      Push User and Agent message turns to Redis list: LPUSH `session:{shop.id}:{sender_id}`
       │      Trim memory to 6 turns (LTRIM 0 5) with 1-hour expiration.
       │
       └─► 12. Outbound Delivery [@app/integrations/tiktok_client.py]:
              Send POST to https://open.tiktokapis.com/v2/business/message/send/
              using shop.tiktok_access_token to deliver DM to customer.
```

---

## 4. Payment & Order Settlement Flow

1. **KHQR Generation**: When an order is created, `@app/agent/tools/khqr_generator.py` encodes Bakong Merchant ID, store name, order total, and currency code (840 for USD) into an EMVCo payload, appending a CRC-16 checksum.
2. **Bank Webhook Interception**: When the buyer scans and pays via ABA Mobile or Bakong, the bank posts to `@app/api/v1/webhooks_bakong.py`.
3. **Status Update**: Order status is transitioned from `PENDING` to `PAID`.
4. **Chat Confirmation Injection**: A confirmation message is inserted into the conversation history so the merchant and AI acknowledge settlement.
5. **Fulfillment Dispatch**: The merchant opens `@frontend/src/app/dashboard/orders/page.tsx` and triggers 1-tap dispatch (`POST /api/v1/orders/{id}/waybill`) to generate J&T Express or Virak Buntham tracking numbers.
