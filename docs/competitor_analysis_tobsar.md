# TobSar (`app.tobsar.com`) — Technical Audit & Competitive Teardown

> **Document Type**: Competitive Intelligence & UX Audit  
> **Target**: TobSar (Cambodia) — `https://app.tobsar.com` / `https://tobsar.com`  
> **Audited Date**: November 2026  
> **Auditor**: TokoAI Engineering Team  

---

## 1. Executive Summary & Brand Identity

**TobSar** (derived from Khmer **តបសារ** — *Tob* = Reply, *Sar* = Message) is an AI-powered conversational sales assistant and operating system built specifically for Cambodian social commerce merchants.

* **Core Value Proposition**: *"TobSar — Sales While You Sleep"*
* **Target Channels**: Facebook Messenger and Telegram Shops (Phnom Penh & provincial retail).
* **Language Core**: Built for mixed Romanized Khmer ("Khmeringlish"), native Khmer script (`ភាសាសរសេរ` and `ភាសានិយាយ`), and English.
* **Payment Method**: Static & Dynamic Bakong KHQR for mobile banking apps (ABA Mobile, ACLEDA, Bakong).

---

## 2. Infrastructure & Tech Stack (Production Inspection)

Inspection of TobSar’s client-side production JavaScript bundles and server responses revealed the following architecture:

* **Frontend Framework**: **Next.js 14+ (App Router)** compiled with **Turbopack** (`turbopack-*.js`).
* **Styling & Typography**: Tailwind CSS + **MiSans Latin** font family (`MiSansLatin_Regular`, `MiSansLatin_Bold`, etc.) with standard responsive breakpoints.
* **Authentication Provider**: **Firebase Auth** (`Google Identity Toolkit` + Google reCAPTCHA) with support for:
  * Google OAuth (`Continue with Google`)
  * Standard Email / Password (`Sign in to your TobSar account`)
  * Internal Developer Bypass (`Continue with Developer Account`)
* **API Backend**: Hosted at `https://api.tobsar.com`
* **Telemetry & Error Tracking**: Sentry SDK (`SentryDoNotSendEventError`)
* **State Management**: Wrapped in standard React contexts: `AuthProvider` and `ShopProvider`.

---

## 3. Complete Page & Route Inventory

Extracted directly from TobSar's production route manifest:

| Route | Purpose & Feature Capabilities |
|---|---|
| **`/login`** | Clean authentication portal with Google OAuth & Email/Password. |
| **`/onboarding`** | Multi-step *"Set up your shop"* wizard for newly registered merchants. |
| **`/ai-setup`** | Checklist onboarding: *"Loading AI setup tasks"*, *"Choose your AI tone"*, *"Add your products"*, *"Add your payment details"*. |
| **`/messages` / `/inbox`** | Real-time chat console with 3 distinct operational modes (Live, Drafting, Off). |
| **`/comments`** | **Facebook Live Comment Selling**: Captures live stream comments and triggers auto-replies/DMs. |
| **`/inventory`** | Product catalog management with SKU, pricing, size/color variant tracking. |
| **`/orders`** | Order dashboard tracking Cash on Delivery (COD), delivery fees, and payment status. |
| **`/broadcast`** | Bulk promotional messaging to past customers on Telegram and Messenger. |
| **`/automations`** | Custom trigger rules, quick keyword responses, and store policies. |
| **`/analytics`** | Daily revenue graphs with an interactive **"Edit Daily Goal"** gamification widget. |
| **`/emulation`** | **In-App AI Simulator**: Lets merchants test-chat with their bot before going live. |
| **`/connect`** | Integration manager for Facebook Pages and Telegram Bots. |
| **`/pricing`** | Pro plan upgrade manager with ABA Bank payment receipt verification. |

---

## 4. Deep-Dive UX & Workflow Analysis

### 4.1. The 3-Mode Inbox State Machine (Great UX for Merchant Trust)
In Cambodian retail, shop owners are often terrified that AI will hallucinate wrong prices or promise unauthorized discounts. TobSar solved this by introducing 3 clear operational states:
1. **`AI LIVE` / `AI ASSISTANT` (Full Autopilot)**: AI automatically responds and closes sales 24/7 without human intervention.
2. **`AI DRAFTING` (Copilot / Review Mode)**: AI drafts the reply in natural spoken Khmer, attaches the product link/KHQR, and labels the message `AI reply needs review`. The human staff reviews it and clicks **"Send"** or edits it.
3. **`AI replies are off` (Human Takeover)**: Halts AI completely on that conversation so the human staff can handle difficult buyers or custom negotiations.

### 4.2. Live Stream Comment Selling (`/comments`)
Live selling is the #1 social commerce channel in Cambodia. TobSar captures live comments during Facebook streams (e.g. buyers typing `A1`, `B2`, `012 345 678`) and immediately:
- Sends a private Messenger DM with the product photo and price.
- Generates a KHQR payment link.
- Prevents sellers from manually writing down hundreds of comment orders on paper.

### 4.3. Merchant Gamification ("Daily Sales Goal")
TobSar includes an **"Edit Daily Goal"** bar at the top of their analytics dashboard. It shows merchants:
- Today's sales target (e.g., `$200.00 / $500.00`).
- Progress percentage bar with motivating milestone badges.
- Keeps merchants coming back to the app multiple times a day.

### 4.4. Onboarding Friction Points (Where They Stumble)
- **Telegram Gatekeeping**: TobSar does not allow immediate self-service checkout. New users must message `@tobsarbusiness` on Telegram to get a trial access code.
- **Manual Product Entry**: No multimodal vision OCR; merchants have to type out their inventory manually or import CSV spreadsheets.
- **Logistics Disconnect**: Once an order is paid, TobSar stops. The merchant still has to manually copy-paste the customer's phone number and address into the J&T or Virak Buntham app to book a delivery driver.

---

## 5. Side-by-Side Competitive Matrix: TokoAI vs. TobSar

| Dimension | **TobSar** (`app.tobsar.com`) | **TokoAI** (Our Platform) | Winner / Analysis |
|---|---|---|---|
| **Primary Channel** | Facebook Messenger & Telegram | **TikTok Shop & TikTok DMs** *(FB & Telegram on roadmap)* | **TokoAI**: TikTok is the fastest-growing impulse commerce platform in Cambodia. |
| **Product Ingestion** | Manual text form / CSV | **Multimodal Gemini Vision OCR** | **TokoAI**: Sellers photograph clothes/tags; AI extracts sizes, prices, and 768d vectors automatically. |
| **Catalog Retrieval** | Keyword / SQL lookup | **PostgreSQL `pgvector` Semantic RAG** | **TokoAI**: Understands intent, misspelled Romanized Khmer, and synonyms. |
| **Inventory Control** | Basic stock quantity | **Atomic variant matrix + cancellation auto-restore** | **TokoAI**: Eliminates overselling of specific sizes (S, M, L) and colors. |
| **Logistics & Waybills** | ❌ None (Manual copy-paste) | **1-Tap J&T Express & Virak Buntham 4x6" Labels** | **TokoAI**: Complete end-to-end fulfillment from chat to physical waybill. |
| **AI Control Modes** | Live / Draft Review / Off | Autopilot + Human Takeover Toggle | **TobSar**: Adding TobSar’s "Draft Review" mode will increase merchant trust. |
| **Live Stream Selling** | ✅ Dedicated `/comments` | ❌ Planned | **TobSar**: TokoAI should build TikTok Live comment triggers. |
| **Audience Retargeting** | ✅ `/broadcast` campaigns | ❌ Planned | **TobSar**: Retargeting past buyers via DM broadcasts is highly profitable. |

---

## 6. Strategic Recommendations for TokoAI

To ensure TokoAI dominates the Cambodian market against TobSar, we should adopt these three high-impact features into our Next.js frontend:

1. **Add "Draft Review / Copilot Mode" to Inbox (`/dashboard/inbox`)**:
   Add a segmented control with 3 modes: `Autopilot (Full AI)`, `Copilot (Draft for Review)`, and `Manual Takeover`. This unlocks merchants who want AI speed but demand final approval before sending.
2. **Add "Daily Sales Goal" Tracker to Dashboard (`/dashboard`)**:
   Place an editable daily revenue milestone bar at the top of the Command Center to gamify merchant sales.
3. **Add TikTok Live Comment Auto-Responder (`/dashboard/live`)**:
   Create a live-selling trigger setup where merchants can configure keyword codes (e.g. `T1`, `D2`, `White-M`) that instantly DM TikTok viewers with the product checkout link and KHQR code.
