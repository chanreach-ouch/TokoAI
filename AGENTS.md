# TokoAI — Autonomous TikTok Commerce Agent (Cambodia Edition) 🇰🇭

Master engineering guide and architectural conventions for developers and AI agents working on TokoAI.

---

## 1. Project Identity & Purpose

**TokoAI** is an autonomous conversational commerce engine and multi-tenant SaaS platform engineered specifically for Cambodian retail sellers on TikTok Shop (with roadmap expansion to Facebook Messenger and Instagram).

### The Core Problem Solved
Cambodian merchants experience a 30%–50% order abandonment rate due to:
1. **Midnight Order Drop-Off**: High-intent impulse buyers message between 10 PM and 2 AM after viewing TikTok videos, but human staff only reply the next morning.
2. **The "Khmeringlish" Barrier**: Generic LLM chatbots output stiff, unnatural literary Khmer (`ភាសាសរសេរ`) and fail completely when customers message in Romanized phonetic Khmer (e.g., `B Kz castor hx ng pro khos knea mx?`).
3. **Manual Checkout Friction**: Copy-pasting static bank account numbers, manual screenshot payment verification, and manual transcription of informal landmark delivery addresses.

### How TokoAI Solves It
- **Sub-100ms Inbound Ingestion**: Fast webhook acknowledgement via HMAC-SHA256 signature verification and offloading to an asynchronous Redis + ARQ queue.
- **Native Spoken Khmer Brain (`ភាសានិយាយ`)**: Natural 2–3 sentence local shop admin persona powered by Google Gemini, capable of effortlessly parsing Romanized Khmer and closing sales.
- **Deterministic Inventory RAG**: PostgreSQL `pgvector` semantic retrieval bounded strictly by tenant `shop_id` / `seller_id`.
- **Dynamic Bakong KHQR Checkout**: Instant generation of EMVCo-compliant payment payloads with CRC-16 checksums for ABA Bank and Bakong app scanning.
- **Logistics & Dispatch**: Automated Cambodian phone number (`012`, `015`, `098`) and address entity extraction with waybill generation (J&T Express, Virak Buntham VET).

---

## 2. Tech Stack Manifest

### Backend Runtime & Services
- **Runtime**: Python 3.12
- **Framework**: FastAPI 0.115+ with Uvicorn ASGI
- **ORM & Database**: SQLAlchemy 2.0 (asyncio + `asyncpg`), PostgreSQL 16 with `pgvector` extension (HNSW indexing)
- **Job Queue & Cache**: Redis 7 (alpine) with `aioredis` and `ARQ` async background workers
- **AI / LLM Engine**: Google GenAI SDK (`gemini-2.5-flash`, `gemini-1.5-flash`, `text-embedding-004` / `gemini-embedding-2`, 768 dimensions)
- **Security & Auth**: PyJWT, `bcrypt`, `passlib[bcrypt]`, HMAC-SHA256 signature verification
- **Rate Limiting**: `slowapi` (memory and Redis-backed limiters)
- **Payments & QR**: `qrcode`, `Pillow`, `crccheck` (CRC-16-CCITT False)
- **Migrations**: Alembic (configured via `@alembic.ini`, manual scripts in `@recreate_db.py`)
- **Testing**: `pytest`, `pytest-asyncio`, `httpx`

### Frontend Application
- **Framework**: Next.js 14.2.15 (App Router), React 18, TypeScript 5
- **Styling**: Tailwind CSS 3.4.1, `tailwindcss-animate`, HSL design tokens in `@frontend/src/app/globals.css`
- **Typography**: `@fontsource/kantumruy-pro` (Khmer script), `@fontsource/inter` (Latin script)
- **Component System**: Custom dark-mode system in `@frontend/src/components/ui/design-system.tsx`
- **Icons & Data Visualization**: `lucide-react`, `recharts`
- **State & Communication**: React Context (`@frontend/src/context/AuthContext.tsx`, `@frontend/src/context/ToastContext.tsx`), Axios with JWT interceptors (`@frontend/src/lib/api.ts`)

---

## 3. Standard Operational Commands

### Docker Multi-Container Environment
```bash
# Start all containers (Postgres, Redis, Backend, ARQ Worker, Frontend)
docker compose up -d

# View real-time logs across all services
docker compose logs -f

# Rebuild images after dependency changes
docker compose build

# Stop containers and preserve data volumes
docker compose down
```

### Local Backend Development (Host `.venv`)
```bash
# Run FastAPI server with auto-reload (port 8000)
uvicorn app.main:app --reload

# Run ARQ Background Worker (Terminal 2)
arq app.worker.worker.WorkerSettings

# Run automated test suite
pytest tests/ -v

# Code formatting and linting
ruff check . --fix && ruff format .
```

### Database Seeding & Setup
```bash
# Recreate database schema with pgvector extension & default admin
python recreate_db.py

# Seed mock seller products with vector embeddings
python seed_mock_data.py

# Link mock shop to admin
python seed_shop.py

# Simulate incoming TikTok DM webhook
python simulate_tiktok_chat.py "How much is the black streetwear tee?"
```

### Local Frontend Development
```bash
# Install dependencies
cd frontend && npm install

# Start Next.js development server (port 3000)
npm run dev

# Run production build validation
npm run build
```

---

## 4. Coding Conventions & Architectural Rules

### Architecture & Design Decisions
- **No Heavy LLM Frameworks**: TokoAI deliberately avoids LangChain and LangGraph (see `@docs/why_no_langchain_and_langgraph.md`). All AI workflows are straight-line, deterministic pipelines executed directly via FastAPI, native SQLAlchemy queries, and the official Google GenAI SDK. This guarantees sub-second execution, eliminates prompt bloat, and provides 100% control over multi-tenant database filtering.
- **Async First**: All backend database queries, Redis interactions, worker tasks, and HTTP client calls MUST be fully asynchronous (`async`/`await`). Never introduce blocking I/O calls (`requests`, synchronous `time.sleep`) in request handlers or worker tasks.
- **Strict Multi-Tenant Scoping**: Never perform global queries on `Product`, `Order`, `Conversation`, or `Customer`. Every query MUST be explicitly filtered by `shop_id` or `seller_id`.
- **SQLAlchemy 2.0 Syntax**: Use modern `select(Model).where(...)` syntax with `db.execute()`. Do not use legacy SQLAlchemy 1.x `db.query(Model)` patterns.
- **Tailwind Design System**: Maintain the dark-mode aesthetic defined in `@frontend/src/app/globals.css`. Use predefined theme classes (`bg-brand-ink`, `text-brand-pink`, `text-brand-cyan`, `border-border`) rather than hardcoded inline hex colors.
- **Khmer Diacritic Typography**: Whenever rendering Khmer script, ensure `leading-relaxed` or `font-khmer` line-height is applied to avoid clipping tone marks and subscript consonants (`ជើងអក្សរ`).

---

## 5. "Do Not Break" Invariants

1. **Sub-100ms Webhook SLA**: `@app/api/v1/tiktok_webhook.py` must NEVER perform synchronous LLM generation or heavy database operations inside the HTTP request cycle. It must verify HMAC signature in <10ms, return `HTTP 200 OK` in <50ms, and offload processing to the ARQ Redis queue.
2. **HMAC-SHA256 Signature Verification**: Every webhook payload from TikTok must validate against `TIKTOK_APP_SECRET`. Never disable or bypass HMAC verification in production code.
3. **Redis Message Deduplication**: Worker task `process_tiktok_message` must execute Redis `SETNX msg:{message_id} 1` with a 24-hour TTL before processing to prevent duplicate replies caused by webhook retries.
4. **Human Takeover / AI Pause Flag**: Before triggering Gemini AI generation, the worker task must query `Conversation.is_human_takeover`. If `True`, the worker must abort immediately without spending AI tokens or sending automated messages.
5. **Deterministic EMVCo CRC-16 Checksum**: Any modification to `@app/agent/tools/khqr_generator.py` must maintain valid EMVCo Tag-Length-Value (TLV) structure and pass CRC-16-CCITT False validation (`test_khqr.py`).
6. **Spoken Khmer Tone Guardrails**: System prompts in `@app/agent/prompts.py` must enforce authentic spoken Khmer (`ភាសានិយាយ`) and strictly ban corporate filler words (`ជាដំបូង`, `សរុបមក`, `ទោះជាយ៉ាងណាក៏ដោយ`).

---

## 6. Context Rules Index

Detailed architectural subsystems and operating rules are located in `.agents/rules/`:

| Rule File | Trigger | Responsibility |
|---|---|---|
| `@.agents/rules/01-architecture.md` | `always_on` | Full annotated directory topology, application entry points, request lifecycles, and cross-component data flow. |
| `@.agents/rules/02-backend-and-data.md` | `model_decision` | API endpoint inventory, SQLAlchemy models, database relationships, auth/RBAC chain, and external integrations. |
| `@.agents/rules/03-frontend-and-ui.md` | `model_decision` | Next.js page routing map, component hierarchy, design system tokens, client state, and API integration. |
| `@.agents/rules/04-project-state-and-roadmap.md` | `model_decision` | Audit of finished features, catalog of schema/contract bugs, known technical debt, and priority resumption plan. |
