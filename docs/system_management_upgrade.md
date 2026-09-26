# System Management Upgrade Plan

This document outlines the architectural changes required to upgrade the TokoAI platform to support **Staff Roles (RBAC)** and **Human Handoff (AI Override)**. These features are critical for giving merchants (our clients) control over their shops and enabling their staff to manage the conversational AI safely.

---

## 1. Human Handoff (AI Override)

### Overview
Merchants need the ability to pause the AI when a conversation requires human intervention. 

### Database Changes
* **`app/models/chat.py`**: The `Conversation` model already has an `is_human_takeover: bool` column. This serves as the pause flag.

### Codebase Changes Completed
* **`app/worker/tasks.py`**: We have updated the `process_tiktok_message` ARQ worker task to explicitly query the `Conversation` table. If `is_human_takeover` is `True`, the worker instantly aborts before calling the Gemini AI, logging `AI paused: Human takeover active`.

### API Endpoints (Already implemented)
* `POST /api/v1/seller/inbox/{conversation_id}/takeover`: Toggles the `is_human_takeover` boolean.
* `POST /api/v1/seller/inbox/{conversation_id}/reply`: Allows the merchant to send a manual reply, which automatically flips `is_human_takeover` to `True`.

### Next Steps for Human Handoff
1. **Frontend Integration:** Ensure the Next.js `inbox/page.tsx` properly surfaces the "Pause AI" button and visually highlights conversations where the AI is paused.
2. **Webhook Refactor:** Migrate the synchronous AI generation logic out of `app/api/v1/tiktok_webhook.py` so that all messages flow strictly through the ARQ worker queue where the `is_human_takeover` check is now active.

---

## 2. Staff Roles (Role-Based Access Control)

### Overview
A shop account (`Seller`) currently acts as a single login. We need to introduce the concept of "Staff" so merchants can invite their chat agents to the platform without giving them admin access to billing or settings.

### Proposed Database Changes
We will modify the existing `sellers` table to act as a general `users` or `accounts` table, adding role enumeration and a direct shop linkage.

**Modify `app/models/seller.py`:**
```python
class SellerRole(str, enum.Enum):
    OWNER = "OWNER"
    AGENT = "AGENT"

class Seller(Base):
    __tablename__ = "sellers"
    # ... existing fields ...
    
    # New Fields
    role: Mapped[str] = mapped_column(String, default=SellerRole.OWNER.value)
    
    # Agents belong to a specific shop, whereas Owners own the shop
    shop_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("shops.id"), nullable=True)
```

### Proposed API Changes
1. **`app/api/v1/auth.py`**:
   * Update the JWT payload to include `"role": seller.role` and `"shop_id": seller.shop_id`.
   * Add a new endpoint `POST /api/v1/auth/invite` (Owner-only) to create new `Seller` accounts with `role="AGENT"` and a predefined `shop_id`.
   
2. **`app/core/auth.py`**:
   * Create dependency injection guards:
     * `get_current_owner`: Ensures `role == 'OWNER'`. Use this for `/settings`, `/billing`, and `/analytics`.
     * `get_current_agent`: Ensures `role == 'AGENT'` or `'OWNER'`. Use this for `/inbox` and `/orders`.

### Frontend Implementation
* In `frontend/src/app/dashboard/layout.tsx`, use the JWT role claim to conditionally render the sidebar navigation. Hide "Settings", "Analytics", and "Admin" from `AGENT` roles.

---

## 3. Future Roadmap: Logistics & Billing
Once Roles and Handoff are stable, we should focus on:
* **Logistics API:** Integrate with J&T Express or Virak Buntham to automatically generate waybills from the parsed addresses.
* **SaaS Billing:** Implement a subscription tracking mechanism to hard-cap `ai_token_usage` and prompt clients to upgrade their plan via ABA Payway.
