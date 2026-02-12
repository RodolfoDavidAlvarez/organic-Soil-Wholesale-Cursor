# Operations Dashboard – Project Upgrades

**Date:** February 11, 2026

This document summarizes the upgrades made to the Operations Dashboard, specifically the **work order notification** settings and behavior. It also records intentions, design decisions, and notes to keep the system well-maintained and ready for future development.

---

## Summary

Notification preferences were added so each recipient can choose how they are notified when a new work order is created: **email**, **phone**, or **both**. Options are only shown when the recipient has that contact (e.g. no “Notify by email” if there’s no email).

---

## Intentions & Goals

- **User control:** Let each recipient choose *how* they are notified (email, phone, or both) instead of assuming “notify by every channel we have.”
- **Context-aware UI:** Only show “Notify by email” when the recipient has an email, and “Notify by phone” when they have a phone. Avoid offering options that can’t be fulfilled.
- **Future-ready:** Store `notify_by_phone` now so that when phone/SMS is implemented, preferences are already in place and no data migration is needed.
- **Non-destructive updates:** Allow changing preferences via PATCH so users don’t have to delete and re-add a recipient just to turn email or phone on/off.
- **Backward compatibility:** Existing recipients keep sensible defaults (email on; phone on only where they already had a phone) so behavior doesn’t change unexpectedly after deploy.

---

## Design Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| Checkboxes (not toggle or multi-select) | Clear “on/off” per channel; works well when only one or two options (email, phone) exist per recipient. |
| `notify_by_email` default `true` | Email is required to add a recipient; most users will want email. Default on avoids missing notifications. |
| `notify_by_phone` default `false` | Phone is optional; enabling phone notifications should be explicit until SMS is implemented. |
| Backfill: set `notify_by_phone = true` where phone exists | Recipients who had a phone were likely intended for future phone use; opt-in by default for existing data. |
| PATCH supports partial updates | UI only sends preference fields when checkboxes change; other fields (name, email, phone) can be updated later without touching preferences. |
| Filter in sending logic: `notify_by_email !== false` | Treats `null`/missing (e.g. old API responses) as “send email” so pre-migration or legacy rows still get email. |

---

## Edge Cases & Behavior Notes

- **Recipient has email but “Notify by email” unchecked:** They will *not* receive new-work-order emails. Intended.
- **Recipient has phone but “Notify by phone” unchecked:** No phone notification is sent (SMS not implemented). Preference is stored for when SMS is added.
- **Recipient has only email (no phone):** Only “Notify by email” is shown; “Notify by phone” is hidden.
- **Recipient has only phone (no email):** Current schema requires email; such a recipient cannot be added until product supports “phone only” (and possibly schema change).
- **Add form: user clears email:** “Notify by email” checkbox is hidden; submitted `notify_by_email` is still sent but server requires email, so add will fail validation until email is filled—acceptable.
- **PATCH with only preferences:** Valid; name/email/phone unchanged. UI only sends `notify_by_email` and/or `notify_by_phone` when user toggles checkboxes.

---

## 1. Database

**Table:** `ops_work_order_notification_recipients`

**Migration:** `supabase/migrations/20260211190000_ops_wo_notification_preferences.sql`

- **`notify_by_email`** (BOOLEAN, NOT NULL, default `true`) – Whether to send email when a new work order is created.
- **`notify_by_phone`** (BOOLEAN, NOT NULL, default `false`) – Reserved for future phone/SMS notifications.

Existing rows were backfilled: `notify_by_phone` was set to `true` where a phone number was already present.

---

## 2. API

**File:** `server/routes/admin/operations.ts`

- **POST** `/api/admin/operations/settings/work-order-notifications`  
  - Now accepts optional `notify_by_email` and `notify_by_phone`.  
  - Defaults: `notify_by_email: true` when email is provided; `notify_by_phone: true` only when phone is provided and the client sends `notify_by_phone: true`.

- **PATCH** `/api/admin/operations/settings/work-order-notifications/:id` (new)  
  - Updates a recipient.  
  - Body can include: `name`, `email`, `phone`, `notify_by_email`, `notify_by_phone`.  
  - Used by the UI to update preferences without deleting and re-adding the recipient.

---

## 3. Work Order Notifications (Sending Logic)

**File:** `server/routes/admin/workOrders.ts`

- **`sendNewWorkOrderNotifications(workOrder)`**
  - Now selects `notify_by_email` (and `notify_by_phone` for future use).
  - Sends **email only** to recipients where:
    - `email` is present and non-empty, and  
    - `notify_by_email !== false`.
  - Phone/SMS is not implemented yet; `notify_by_phone` is stored for future use.

---

## 4. Operations Settings UI

**File:** `client/src/pages/admin/OperationsSettings.tsx`

- **Recipient list**
  - Each recipient shows:
    - **Notify by email** – Checkbox only if the recipient has an email. Toggling calls PATCH to update `notify_by_email`.
    - **Notify by phone** – Checkbox only if the recipient has a phone. Toggling calls PATCH to update `notify_by_phone`.

- **Add recipient form**
  - **Notify by email** – Shown when the user has entered an email; default **on**.
  - **Notify by phone** – Shown when the user has entered a phone; default **off**.
  - These values are sent in the POST when adding a new recipient.

- **Components**
  - Uses existing `Checkbox` from `@/components/ui/checkbox`.
  - New `updateMutation` for PATCH to update a recipient’s preferences.

---

## 5. Files Touched

| Area        | File(s) |
|------------|---------|
| Migration  | `supabase/migrations/20260211190000_ops_wo_notification_preferences.sql` |
| API        | `server/routes/admin/operations.ts` |
| Sending    | `server/routes/admin/workOrders.ts` |
| UI         | `client/src/pages/admin/OperationsSettings.tsx` |

---

## 6. Deploy / Run Checklist

1. **Run the migration** so the new columns exist (e.g. `supabase db push` or run the migration SQL in the Supabase SQL editor).
2. After deployment, existing recipients keep current behavior: email on (default), phone on only where they had a phone and the backfill set `notify_by_phone = true`.
3. New recipients get preferences from the add form; existing ones can be updated via the checkboxes on the Settings page.

---

## 7. Future Work & Enhancements

- **SMS / phone notifications:** When implementing, use `notify_by_phone === true` and non-empty `phone` to decide who gets an SMS. Consider rate limits, opt-out, and carrier handling.
- **Validation:** Optional: server-side validation that at least one of `notify_by_email` or `notify_by_phone` is true when the recipient has the corresponding contact (to avoid “no channel selected”).
- **Audit / logging:** Optionally log when preferences are changed (PATCH) or when a notification is skipped due to preferences, for debugging and compliance.
- **Bulk edit:** If the list grows, consider “Select all” or bulk “Notify by email on/off” for operators.
- **Other triggers:** Same recipient table could be reused for “notify when work order is updated/completed” with additional preference columns or a more generic notification-rules model later.

---

## 8. Consistency & Integration

- **Auth:** All endpoints (GET list, POST, PATCH, DELETE) use the same admin auth as the rest of the operations dashboard; no new auth surface.
- **Naming:** `notify_by_email` / `notify_by_phone` align with “notify by [channel]” in the UI and are consistent with existing `ops_*` table naming.
- **UI:** Operations Settings lives under the same Operations Layout and uses existing design system (Card, Button, Input, Checkbox, toast). New behavior is additive; no breaking changes to existing flows.

---

## 9. Testing & Validation Suggestions

- **Manual:** Add a recipient with email only → confirm “Notify by email” appears and “Notify by phone” does not. Create a work order → confirm they receive email. Uncheck “Notify by email” → create another work order → confirm they do *not* receive email.
- **Manual:** Add a recipient with email and phone → set “Notify by email” on, “Notify by phone” off (or on). Confirm only email is sent (until SMS is implemented).
- **Migration:** Run migration on a copy of prod (or staging); confirm existing recipients have correct `notify_by_email`/`notify_by_phone` and that sending behavior is unchanged for default cases.
- **API:** Optional automated tests for PATCH (update preferences only, update name only, invalid id) and for POST with `notify_by_email`/`notify_by_phone`.

---

## 10. Reference: Quick Links

| What | Where |
|------|--------|
| Operations Settings UI | `client/src/pages/admin/OperationsSettings.tsx` |
| Work order notification API | `server/routes/admin/operations.ts` (GET/POST/PATCH/DELETE under `settings/work-order-notifications`) |
| Send notifications on new WO | `server/routes/admin/workOrders.ts` → `sendNewWorkOrderNotifications()` |
| Migration | `supabase/migrations/20260211190000_ops_wo_notification_preferences.sql` |
| Recipients table | Supabase: `ops_work_order_notification_recipients` |

---

*Document generated February 11, 2026. Update this file when making further changes to work order notifications or operations settings.*
