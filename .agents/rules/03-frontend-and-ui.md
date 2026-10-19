---
trigger: model_decision
description: "Load when working on frontend pages, UI components, routing, state management, API client calls, or styling."
---

# 03 — Frontend Architecture, UI Components & Design System

This guide documents TokoAI's Next.js 14 frontend architecture, page routing tree, design system tokens, responsive components, and client-side state management.

---

## 1. Page Routing Map & Layout Hierarchy

TokoAI uses the Next.js 14 App Router with TypeScript located under `@frontend/src/app`.

```text
RootLayout (@frontend/src/app/layout.tsx)
├── Font Provider: Kantumruy Pro & Inter
├── ToastProvider (@frontend/src/context/ToastContext.tsx)
└── AuthProvider (@frontend/src/context/AuthContext.tsx)
    │
    ├── Public Pages
    │   ├── / (@frontend/src/app/page.tsx) - Marketing landing page
    │   ├── /login (@frontend/src/app/login/page.tsx) - Merchant sign-in
    │   ├── /register (@frontend/src/app/register/page.tsx) - Merchant onboarding
    │   └── /onboarding (@frontend/src/app/onboarding/page.tsx) - 4-step setup wizard
    │
    └── Protected Dashboard Shell (@frontend/src/app/dashboard/layout.tsx)
        ├── Sidebar (@frontend/src/components/Sidebar.tsx) [Desktop]
        ├── Topbar (@frontend/src/components/Topbar.tsx) [Global]
        ├── MobileBottomNav (@frontend/src/components/MobileBottomNav.tsx) [Mobile]
        └── Main Content View:
            ├── /dashboard (@frontend/src/app/dashboard/page.tsx) - Command Cockpit
            ├── /dashboard/inbox (@frontend/src/app/dashboard/inbox/page.tsx) - Unified Inbox
            ├── /dashboard/customers (@frontend/src/app/dashboard/customers/page.tsx) - Customer CRM
            ├── /dashboard/knowledge-base (@frontend/src/app/dashboard/knowledge-base/page.tsx) - Catalog & FAQs
            ├── /dashboard/orders (@frontend/src/app/dashboard/orders/page.tsx) - Orders & Dispatch
            ├── /dashboard/integrations (@frontend/src/app/dashboard/integrations/page.tsx) - Channel Keys
            ├── /dashboard/analytics (@frontend/src/app/dashboard/analytics/page.tsx) - Deep Analytics
            ├── /dashboard/settings (@frontend/src/app/dashboard/settings/page.tsx) - Safeguards & Staff
            └── /dashboard/admin (@frontend/src/app/dashboard/admin/page.tsx) - Superadmin Panel
```

### Route Descriptions & Capabilities

1. **Landing Page (`@frontend/src/app/page.tsx`)**:
   Public showcase of TokoAI. Features dynamic ROI calculator, spoken Khmer chat mockups, interactive EN/KH language toggle, Bakong integration badges, and pricing tiers.
2. **Command Cockpit (`@frontend/src/app/dashboard/page.tsx`)**:
   Executive operations view. Displays overnight AI summary, 24-hour autonomy pulse, immediate triage cards (pending drafts, paid orders ready for dispatch), and quick links.
3. **Unified Inbox (`@frontend/src/app/dashboard/inbox/page.tsx`)**:
   Real-time chat interface. Lists customer threads with search filtering, renders customer message bubbles vs. AI assistant responses, provides an AI Pause/Takeover toggle button, and allows manual staff replies. Polls every 5s for conversations and 3s for active messages.
4. **Knowledge Base (`@frontend/src/app/dashboard/knowledge-base/page.tsx`)**:
   AI training center. Features dual tabs:
   - *Products Tab*: Drag-and-drop product photo upload triggering Gemini Vision extraction, with draft verification and pgvector catalog sync.
   - *Store Rules / FAQs Tab*: Custom question-and-answer pairs injected directly into RAG prompt context.
5. **Orders & Dispatch (`@frontend/src/app/dashboard/orders/page.tsx`)**:
   Fulfillment console. Lists all customer orders with status badges (`PENDING`, `PAID`, `SHIPPED`), customer names, Bakong payment badges, and 1-tap waybill dispatch buttons for J&T Express and Virak Buntham. Includes batch dispatch for all paid orders.
6. **Customer CRM (`@frontend/src/app/dashboard/customers/page.tsx`)**:
   Cambodian phone extractor and customer directory. Tracks channel origins (TikTok, Messenger), lifetime value (LTV in USD), order counts, and VIP indicators.
7. **Integrations (`@frontend/src/app/dashboard/integrations/page.tsx`)**:
   Owner-only screen for configuring TikTok Page ID (webhook routing) and Bakong Merchant ID (dynamic KHQR generation).
8. **Deep Analytics (`@frontend/src/app/dashboard/analytics/page.tsx`)**:
   Performance analytics with Recharts visualizations comparing autonomous AI-closed revenue vs. human staff replies, conversation volume, and token consumption efficiency.
9. **Settings & Safeguards (`@frontend/src/app/dashboard/settings/page.tsx`)**:
   Merchant controls for AI bot tone (Friendly, Professional, Aggressive Sales), AI trust mode (`CAUTIOUS`, `BALANCED`, `AUTOPILOT`), subscription usage meters, and staff invitation modal (`role="AGENT"`).
10. **Platform Superadmin (`@frontend/src/app/dashboard/admin/page.tsx`)**:
    Guarded panel for platform owners (`is_superadmin == true`) to monitor all tenant shops, token usage, and toggle tenant account suspension.

---

## 2. Design System Tokens & Typography

TokoAI implements a custom, tailored dark-mode design system defined in `@frontend/src/app/globals.css` and `@frontend/tailwind.config.ts`.

### Color Palette

| Token | Class | Hex / Value | Purpose |
|---|---|---|---|
| Background Ink | `bg-brand-ink` | `#0A0E1A` (HSL `222 47% 7%`) | Primary application background |
| Surface Card | `bg-brand-ink-2` | `#131826` (HSL `222 33% 11%`) | Elevated cards, tables, modal surfaces |
| Slate Border | `border-border` | `#1E2638` (HSL `222 25% 16%`) | Subtle structural borders |
| TikTok Pink | `text-brand-pink` | `#FF3B6B` (HSL `345 100% 61%`) | Primary brand accent, CTA buttons, active state glows |
| TikTok Cyan | `text-brand-cyan` | `#14F1D9` (HSL `173 90% 50%`) | Secondary accent, live indicators, tech highlights |
| Bakong Teal | `text-brand-teal` | `#00938C` (HSL `176 100% 29%`) | Bakong KHQR verification badges and cards |
| Bone White | `text-brand-bone` | `#FAFBFC` (HSL `210 33% 98%`) | Primary headings and crisp text |
| Muted Slate | `text-zinc-400` | HSL `217 19% 65%` | Secondary labels, descriptions, table headers |

### Typography Guidelines
- **Primary Khmer Font**: `Kantumruy Pro` (`@fontsource/kantumruy-pro`)
  - Khmer script has tall ascenders, descenders, and subscript consonants (`ជើងអក្សរ`).
  - **Rule**: Always enforce `leading-relaxed` (or class `font-khmer` with `line-height: 1.75`) whenever displaying Khmer text to prevent diacritic clipping.
- **Latin Font**: `Inter` (`@fontsource/inter`)
  - Used for numbers, SKUs, currency amounts, and Latin script labels.

---

## 3. Component Architecture

### Reusable UI Kit (`@frontend/src/components/ui/design-system.tsx`)
All dashboard views use unified design system primitives:
- **`Button`**: Supports variants `primary` (gradient pink/cyan with glow), `secondary` (slate surface), `destructive` (pink/red), `warning` (amber), `cyan` (emerald/cyan), and `ghost`.
- **`Card`**: Elevated surface with `bg-brand-ink-2`, subtle `border-border`, and rounded-2xl geometry.
- **`Badge`**: Status indicators supporting `default`, `success` (Bakong verified), `warning` (pending), `destructive`, and `cyan` (in transit).
- **`Input` & `Textarea`**: Dark input fields with slate borders and pink focus rings.
- **`Modal`**: Backdrop-blurred overlay dialog for confirmations and staff invitations.

### Navigation Components
- **`Sidebar.tsx` (`@frontend/src/components/Sidebar.tsx`)**:
  Desktop navigation drawer. Filters navigation items based on seller role (`ownerOnly`, `adminOnly`), displays live AI autonomy meter (`94% active`), token consumption bar (`8.2k / 10k`), and current seller profile card with logout action.
- **`Topbar.tsx` (`@frontend/src/components/Topbar.tsx`)**:
  Sticky header bar. Displays current view title, live AI status indicator (`Live Engine 99.8%`), and quick shortcut buttons.
- **`MobileBottomNav.tsx` (`@frontend/src/components/MobileBottomNav.tsx`)**:
  Fixed bottom navigation bar for mobile viewports (`md:hidden`). Renders touch-optimized (44px+ hit target) buttons for Cockpit, Inbox, Catalog, Orders, and Settings.

---

## 4. Client State Management & API Layer

### Authentication Context (`@frontend/src/context/AuthContext.tsx`)
- Reads and persists JWT in `localStorage` (`tokoai_token`).
- Decodes token payload using `jwt-decode`:
  ```typescript
  interface JwtPayload {
    sub: string;          // Seller UUID
    email: string;        // Seller email
    is_superadmin: boolean;
    role?: string;        // "OWNER" | "AGENT"
    shop_id?: string;
    exp: number;
  }
  ```
- Enforces client-side route protection: redirects unauthenticated users to `/login`, and redirects authenticated users away from public auth pages to `/dashboard` (or `/dashboard/admin` for superadmins).

### Notification Context (`@frontend/src/context/ToastContext.tsx`)
- Provides non-blocking contextual toasts replacing native browser `alert()` popups.
- Hook `useToast()` exposes:
  - `toast.success("Message")`: Emerald border with CheckCircle2.
  - `toast.error("Message")`: Brand-pink border with AlertCircle.
  - `toast.warning("Message")`: Amber border.
  - `toast.info("Message")`: Cyan border with Info.
- Auto-dismisses notifications after 4,000ms.

### Axios API Client (`@frontend/src/lib/api.ts`)
- Configures base HTTP client targeting `http://localhost:8000/api/v1` (should read `NEXT_PUBLIC_API_URL`).
- **Request Interceptor**: Injects `Authorization: Bearer <tokoai_token>` header from `localStorage`.
- **Response Interceptor**: Intercepts `401 Unauthorized` responses globally, wipes token, and redirects user to `/login`.
