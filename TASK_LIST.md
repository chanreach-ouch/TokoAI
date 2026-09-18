# TikTok Commerce AI Agent (Cambodia Edition) Task List

## PHASE 1: Workspace Setup, Virtual Environment & Dependencies
- [x] Initialize an isolated virtual environment (`.venv`).
- [x] Configure `.gitignore`.
- [x] Create `requirements.txt`.
- [x] Install dependencies.
- [x] Generate `docker-compose.yml`.
- [x] Generate `.env.example` and `.env`.

## PHASE 2: Database Models, Migrations & Vector Seeding
- [x] Create `app/config.py`.
- [x] Create `app/core/db.py` & `app/core/redis.py`.
- [x] Create database models (`base.py`, `user.py`, `product.py`, `order.py`, `conversation.py`).
- [x] Create `scripts/seed_vector_store.py`.

## PHASE 3: High-Throughput Webhook Ingestion & Worker Queue
- [x] Create `app/core/security.py`.
- [x] Create `app/api/v1/tiktok_webhook.py`.
- [x] Create `app/worker/worker.py` & `app/worker/tasks.py`.

## PHASE 4: Spoken Khmer AI Brain & Localized Tooling
- [x] Create `app/agent/prompts.py`.
- [x] Create `app/agent/rag.py`.
- [x] Create tools (`inventory_check.py`, `khqr_generator.py`, `address_parser.py`).
- [x] Create `app/integrations/tiktok_client.py`.

## PHASE 5: Integration Tests, Validation & Documentation
- [x] Create `tests/test_webhook.py`.
- [x] Create `tests/test_khqr.py`.
- [x] Create `tests/test_rag.py`.
- [x] Create `README.md`.
- [x] Autonomous Test Execution.
