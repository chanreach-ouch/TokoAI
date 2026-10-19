# TokoAI — Executive Design System Specification

## 1. Aesthetic Identity & Design Philosophy
TokoAI delivers an executive, warm, high-trust commerce cockpit designed specifically for Cambodian retailers on TikTok Shop and Bakong KHQR. It pairs a warm ivory/parchment foundation with high-contrast slate typography, high-velocity burnt orange actions, and institutional Bakong teal trust indicators.

---

## 2. Color Palette & Surface Tokens

### Core Canvas & Elevation
| Layer | Hex | HSL Variable | Purpose |
|---|---|---|---|
| **Canvas** | `#FAF9F5` / `#F8F9FA` | `hsl(40, 50%, 97%)` | Warm executive page backdrop |
| **Surface** | `#FFFFFF` | `hsl(0, 0%, 100%)` | Primary cards, panels, modals |
| **Surface Sub / Inset** | `#F5F2ED` / `#F1F5F9` | `hsl(40, 33%, 95%)` | Table headers, inset blocks, chip backings |
| **Border / Divider** | `#E4E7EF` / `#E2E8F0` | `hsl(220, 13%, 91%)` | Crisp 1px structural framing (no shadows as borders) |

### Brand & Interactive Accents
| Accent | Hex | Role |
|---|---|---|
| **Brand Primary (Orange)** | `#EA580C` | Primary CTAs, active indicator rings, live badges, action triggers |
| **Brand Orange Light** | `#F97316` | Hover states, gradient highlights |
| **Brand Orange Dark** | `#C2410C` | Active/pressed button states |
| **Bakong Teal** | `#00938C` | Bank verification, KHQR settlements, payment badges |
| **Bakong Teal Light** | `#14B8A6` | Teal hover accents |
| **Emerald Success** | `#10B981` | Paid status, positive growth metrics, operational health |
| **Amber Warning** | `#F59E0B` | Pending owner review, rate limit alerts |
| **Rose Danger** | `#EF4444` | AI pause status, failed orders, quota exhaustion |

### Typography Hierarchy & Inks
| Text Style | Color / Hex | Weight | Usage |
|---|---|---|---|
| **Primary Ink** | `#0F172A` / `#0A0E1A` | 700 / 800 | Section titles, card headers, big KPI values |
| **Secondary Slate** | `#475569` | 500 / 600 | Card descriptions, subtitles, table body cells |
| **Muted Ink** | `#64748B` / `#94A3B8` | 500 | Metadata labels, timestamps, placeholders |
| **Brand Micro-Labels** | `#EA580C` | 700 | Category pills, live telemetry indicators |

---

## 3. Spatial Density & Border-Radius Standards

- **Radius Tokens**:
  - `rounded-2xl` (`16px`–`18px`): Main cards, containers, modal dialogs
  - `rounded-xl` (`12px`–`14px`): Interactive cards, input fields, dropdown menus
  - `rounded-lg` (`8px`–`10px`): Nested action buttons, badge containers
  - `rounded-full` (`999px`): Status pills, navigation pills, circular icons, quick filter toggles
- **Card Spacing & Padding**:
  - Standard card interior: `p-5` to `p-6`
  - Compact widget interior: `p-4`
  - Section vertical gap: `space-y-6`
  - Metric strip grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`
- **Border Contrast Rule**:
  - All cards use a clean `border border-slate-200/80` or `border-[#E4E7EF]` with a soft elevation shadow (`shadow-sm`).
  - No double-nested borders or "cards inside identical cards".

---

## 4. Typography & Khmer Script Rules

- **Latin Script**: Inter (`font-sans`), geometric, crisp, high legibility.
- **Khmer Script**: Kantumruy Pro (`font-khmer`), authentic modern Khmer typography.
- **Diacritic Clearance**: Any Khmer text must use `leading-relaxed` or `leading-loose` to prevent clipping diacritical tone marks and consonant legs (`ជើងអក្សរ`).
- **Punctuation & Language Switch**: Language indicator renders as `KH` / `EN` clean badges without relying on variable system flag emoji support.

---

## 5. Navigation & Layout Shell Architecture

- **Desktop Sidebar**:
  - Fixed `w-60` with clean white surface (`bg-white`), crisp border (`border-r border-[#E4E7EF]`).
  - Active item indicator: Soft peach pill (`bg-orange-50/80` or `bg-[#FFF7ED]`) with bold burnt orange text (`text-[#EA580C]`) and crisp matching icon.
  - Autonomy quota meter widget at bottom with progress bar and shop session indicator.
- **Desktop Topbar**:
  - Fixed `h-16` with glassmorphic backdrop (`bg-white/90 backdrop-blur-md border-b border-slate-200/80`).
  - Pill search bar (`w-80 rounded-full bg-slate-50 border border-slate-200/80`).
  - Live autonomy status switch with pulsing live beacon (`AI Pilot Active`).
  - Institutional Bakong Connected badge (`text-[#00938C] bg-teal-50 border border-teal-200/80`).
- **Mobile Responsive Layout**:
  - Collapsible drawer navigation and fixed bottom bar with `h-14` 44px+ hit targets.
