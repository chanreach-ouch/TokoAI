# TikTok Commerce AI Agent (Cambodia Edition) 🇰🇭

An autonomous conversational commerce agent built specifically for Cambodian retail sellers on TikTok. The agent intercepts direct messages via the official TikTok Business Messaging API, queries live inventory using vector similarity search, converses naturally in authentic spoken Khmer (ភាសានិយាយ) while seamlessly parsing Romanized Khmer (Khmeringlish), and delivers dynamic Bakong KHQR codes directly inside the chat window to close sales.

---

## 💼 Business Problem & Solution

### The Retail Bottleneck in Cambodia
Thousands of small-to-medium retail businesses in Cambodia drive customer acquisition through organic TikTok videos and live streams. Despite high engagement, merchants lose an estimated **30% to 50% of potential orders** due to structural messaging friction:

1. **The Midnight Drop-off:** Impulsive buyers message late at night (10 PM – 2 AM) immediately after viewing a video. Because staff only reply the following morning, buyers abandon the purchase or buy from competitors.
2. **The "Khmeringlish" Barrier:** Standard AI chatbots use literal translations that output stiff, formal literary Khmer (`ភាសាសរសេរ`). More critically, they fail when buyers type Romanized Khmer phonetically (`B Kz castor hx ng pro khos knea mx?`), leading to broken responses.
3. **Manual Checkout Drag:** Admins manually verify product specs, copy-paste static bank account numbers, inspect screenshots for payment fraud, and transcribe unstructured landmark addresses by hand.

### How Our System Solves It

| Operational Vector | Manual Admin / Generic Chatbot | Our Autonomous AI Sales Agent |
|---|---|---|
| **Response Latency** | Hours of delay overnight or during live streams. | **Sub-3 second response** 24/7/365 during peak buyer intent. |
| **Language Understanding** | Stiff formal phrasing; breaks on Latinized text. | **Native Spoken Khmer (ភាសានិយាយ)** with robust Romanized Khmer parsing. |
| **Inventory Reliability** | Accidental overselling of out-of-stock items. | **Deterministic SQL tool execution** verifies live stock before confirmation. |
| **Payment Friction** | Sending static account numbers and awaiting slips. | **Dynamic Bakong KHQR payloads** generated with exact order totals. |
| **Fulfillment Capture** | Manual deciphering of informal directions. | **Automated entity extraction** for Cambodian phone numbers and landmarks. |

---

## 🚀 Key Features

* **Sub-100ms Webhook Ingestion:** Inbound messages are verified via HMAC-SHA256 and acknowledged with `200 OK` in under 100ms, pushing message payloads to an asynchronous Redis + ARQ queue to eliminate TikTok retry loops.
* **Spoken Khmer Conversational Engine:** Guided by few-shot prompt guardrails to communicate like a local shop admin—short, direct, 2–3 sentences, with no corporate filler words (`ជាដំបូង`, `សរុបមក`).
* **Semantic Catalog Retrieval (RAG):** Product recommendations and technical comparisons powered by PostgreSQL `pgvector` cosine similarity and Gemini embeddings.
* **Bakong KHQR Generation:** Real-time generation of EMVCo-compliant payment payloads and QR images with CRC-16 checksums for ABA and Bakong app scanning.
* **Phone & Address Parsing:** Extracts Cambodian phone numbers (`012`, `015`, `098`, etc.) and informal shipping directions from unstructured chat streams.

---

## 🛠️ Architecture & Tech Stack

```text
[Customer DMs on TikTok]
         │
         ▼
[TikTok Business Messaging API]
         │ (Webhook POST event)
         ▼
[FastAPI Server (app/api/v1/tiktok_webhook.py)]
         │
         ├──► HMAC-SHA256 Signature Verification (< 10ms)
         ├──► Returns HTTP 200 OK (< 50ms)
         └──► Pushes raw payload to Redis Stream
                    │
                    ▼
       [ARQ Background Worker]
                    │
                    ├─► Message Deduplication (Redis SETNX)
                    ├─► Load Session History (Redis Memory)
                    ├─► Vector Search (PostgreSQL pgvector)
                    ├─► Live Stock Check (Postgres SQL)
                    ├─► Language Generation (Gemini 2.5 Flash)
                    │
                    ▼
     [TikTok Client (HTTPX)] ──► Outbound DM to Buyer
```

### Directory Structure

```text
tiktok-agent-kh/
├── .env.example                    # Environment variable template
├── .gitignore                      # Git exclusion rules (.venv, caches, envs)
├── Dockerfile                      # Application container definition
├── docker-compose.yml              # Multi-container orchestration (DB, Redis, App, Worker)
├── requirements.txt                # Python project dependencies
├── README.md                       # System architecture and documentation
│
├── data/
│   └── products.csv                # Seed catalog (SKUs, specs, pricing, stock)
│
├── scripts/
│   └── seed_vector_store.py        # Database bootstrap and vector ingestion
│
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI application factory and lifespan hooks
│   ├── config.py                   # Pydantic Settings management
│   │
│   ├── core/
│   │   ├── db.py                   # Async SQLAlchemy engine and session makers
│   │   ├── redis.py                # Redis connection pool
│   │   └── security.py             # TikTok HMAC-SHA256 signature verification
│   │
│   ├── models/
│   │   ├── base.py                 # Declarative Base
│   │   ├── user.py                 # Customer records and profile tags
│   │   ├── product.py              # Inventory model with pgvector embedding column
│   │   ├── order.py                # Orders, payment statuses, and KHQR hashes
│   │   └── conversation.py         # Session history logging
│   │
│   ├── schemas/
│   │   ├── tiktok_webhook.py       # Pydantic contracts for incoming TikTok events
│   │   └── order_schema.py         # Order creation and address schemas
│   │
│   ├── api/
│   │   └── v1/
│   │       └── tiktok_webhook.py   # High-throughput webhook endpoint
│   │
│   ├── worker/
│   │   ├── worker.py               # ARQ WorkerSettings entry point
│   │   └── tasks.py                # Async chat processing task pipeline
│   │
│   ├── agent/
│   │   ├── prompts.py              # Spoken Khmer system prompts and few-shots
│   │   ├── memory.py               # Redis-backed session buffer
│   │   ├── rag.py                  # pgvector semantic retrieval engine
│   │   │
│   │   └── tools/
│   │       ├── inventory_check.py  # Live stock lookup tool
│   │       ├── khqr_generator.py   # Dynamic Bakong KHQR image and payload generator
│   │       └── address_parser.py   # Address and phone entity extractor
│   │
│   └── integrations/
│       └── tiktok_client.py        # Async HTTP client for TikTok Messaging API
│
└── tests/
    ├── test_webhook.py             # Signature validation and 200 OK tests
    ├── test_khqr.py                # EMVCo format and CRC16 checksum tests
    └── test_rag.py                 # Vector search accuracy tests
```

---

## 💻 Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/tiktok-agent-kh.git
   cd tiktok-agent-kh
   ```

2. **Setup Environment Variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your TikTok credentials and Gemini API Key
   ```

3. **Start Infrastructure (PostgreSQL + Redis):**
   ```bash
   docker-compose up -d
   ```

4. **Initialize Virtual Environment & Seed Database:**
   ```bash
   # Ensure your .venv is active and dependencies are installed
   python scripts/seed_vector_store.py
   ```

5. **Run the FastAPI Server (Terminal 1):**
   ```bash
   uvicorn app.main:app --reload
   ```

6. **Run the ARQ Background Worker (Terminal 2):**
   ```bash
   arq app.worker.worker.WorkerSettings
   ```

---

## 🧪 Testing

Run the integration and unit tests using `pytest`:
```bash
python -m pytest -v
```