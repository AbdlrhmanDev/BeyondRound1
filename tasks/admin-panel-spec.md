# BeyondRounds Admin Panel — Full Specification

> **Generated:** 2026-02-17
> **Status:** Ready for implementation

---

## Schema Corrections (actual DB vs prompt assumptions)

Before the spec, these column-name differences matter:

| Prompt assumed | Actual column | Table |
|---|---|---|
| `verification_requests.rejection_reason` | `admin_notes` | verification_requests |
| `verification_requests.document_type` | `verification_method` | verification_requests |
| `verification_requests.file_url` | `file_urls` (TEXT[]) | verification_requests |
| `user_roles.role` includes `'doctor'` | enum is `('admin','moderator','user')` | user_roles |
| `feedback.rating / context_type / group_id / meetup_id` | Do not exist | feedback |

The spec below uses the **actual** column names throughout.

---

## 1. Admin Roles & Permissions (RLS-ready)

### Role Definitions

| Capability | `admin` | `moderator` |
|---|---|---|
| View all users & profiles | Yes | Yes |
| Review verification requests | Yes | Yes |
| Approve / reject verification | Yes | No |
| Ban / unban user | Yes | No |
| Soft-delete / restore account | Yes | No |
| Change user roles | Yes | No |
| View & act on reports | Yes | Yes |
| Dismiss reports | Yes | Yes (mark reviewed only) |
| View events & bookings | Yes | Yes |
| Cancel event / booking | Yes | No |
| View group messages | Yes | Yes |
| Delete messages | Yes | Yes |
| Remove user from group | Yes | No |
| Disband group | Yes | No |
| View audit logs | Yes | No |
| Edit app_config | Yes | No |
| View waitlist / survey data | Yes | Yes |
| Export data (CSV) | Yes | No |

### Table-Level Access

| Table | admin read | admin write | mod read | mod write |
|---|---|---|---|---|
| profiles | all | all | all | no |
| verification_requests | all | all | all | status only (mark reviewed) |
| admin_audit_logs | all | insert only | no | no |
| user_roles | all | all | own row only | no |
| user_reports | all | all | all | admin_notes + status |
| feedback | all | delete | all | no |
| events | all | all | all | no |
| bookings | all | all | all | no |
| match_groups | all | all | all | no |
| group_members | all | delete | all | no |
| group_conversations | all | no | all | no |
| group_messages | all | update (soft delete) | all | update (soft delete) |
| waitlist | all | no | all | no |
| survey_submissions | all | no | all | no |
| app_config | all | all | all | no |
| onboarding_preferences | all | no | all | no |

### RLS Policy Strategy

All admin tables use the existing `has_role()` SECURITY DEFINER function.

```sql
-- Pattern for admin-readable tables
CREATE POLICY "admin_read_<table>"
  ON public.<table> FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
  );

-- Pattern for admin-writable tables (admin only)
CREATE POLICY "admin_write_<table>"
  ON public.<table> FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Pattern for moderator partial write (e.g., user_reports)
CREATE POLICY "mod_update_reports"
  ON public.user_reports FOR UPDATE
  USING (has_role(auth.uid(), 'moderator'))
  WITH CHECK (has_role(auth.uid(), 'moderator'));
```

**Key RLS checks:**
- `verification_requests.file_urls` access: Only allow SELECT on rows when caller `has_role('admin') OR has_role('moderator')`. Never expose file URLs to regular users via API.
- `profiles.license_url`: Same RLS gate. The client-side profile view for regular users must NOT select this column.
- `admin_audit_logs`: INSERT allowed for admin/moderator (via RPC). SELECT only for admin.
- All write operations should go through SECURITY DEFINER RPCs (not direct client writes) to guarantee audit log insertion.

**Signed URL strategy for documents:**
- `file_urls` store Supabase Storage paths (not public URLs).
- Admin UI calls `supabase.storage.from('verifications').createSignedUrl(path, 300)` (5-minute expiry).
- Bucket `verifications` has RLS: only admin/moderator roles can generate signed URLs.

---

## 2. Admin IA (Information Architecture)

### Sidebar Navigation (ordered by frequency of use)

```
BEYONDROUNDS ADMIN

1. Dashboard                    [icon: LayoutDashboard]
2. Verification Queue           [icon: ShieldCheck]     (badge: pending count)
3. Users                        [icon: Users]
4. Reports & Safety             [icon: AlertTriangle]   (badge: pending count)
5. Events & Bookings            [icon: Calendar]
6. Groups & Chats               [icon: MessageSquare]
7. Feedback                     [icon: MessageCircle]
8. Waitlist & Surveys           [icon: ListChecks]
9. Audit Logs                   [icon: ScrollText]
10. App Config                  [icon: Settings]

---
[Admin name]                    [Sign out]
```

### Page List

| # | Page | Route | Description |
|---|---|---|---|
| 1 | Dashboard | `/admin` | KPIs: total users, pending verifications, open reports, upcoming events, active groups |
| 2 | Verification Queue | `/admin/verifications` | List of verification_requests with filters |
| 2a | Verification Review | `/admin/verifications/[user_id]` | Detail view for single verification |
| 3 | Users | `/admin/users` | All profiles with search, filters, inline actions |
| 3a | User Detail | `/admin/users/[user_id]` | Full profile + preferences + booking history + group history |
| 4 | Reports & Safety | `/admin/reports` | user_reports triage queue |
| 4a | Report Detail | `/admin/reports/[id]` | Single report with actions |
| 5 | Events & Bookings | `/admin/events` | Events list with booking counts |
| 5a | Event Detail | `/admin/events/[id]` | Single event with bookings table |
| 6 | Groups & Chats | `/admin/groups` | match_groups list with member counts |
| 6a | Group Detail | `/admin/groups/[id]` | Members + conversation + messages |
| 7 | Feedback | `/admin/feedback` | Feedback list with category filter |
| 8 | Waitlist & Surveys | `/admin/waitlist` | Tabs: Waitlist / Survey Submissions |
| 9 | Audit Logs | `/admin/audit-logs` | Filterable audit log table |
| 10 | App Config | `/admin/config` | Key-value settings editor |

---

## 3. License Verification Flow (End-to-End)

### A) Verification Queue List (`/admin/verifications`)

**Data source:** `verification_requests` joined with `profiles` and `onboarding_preferences`.

```sql
SELECT
  vr.id, vr.user_id, vr.verification_method, vr.status,
  vr.admin_notes, vr.created_at, vr.reviewed_at, vr.reviewed_by,
  p.full_name, p.city, p.verification_status,
  op.specialty
FROM verification_requests vr
JOIN profiles p ON p.user_id = vr.user_id
LEFT JOIN onboarding_preferences op ON op.user_id = vr.user_id
ORDER BY
  CASE vr.status
    WHEN 'pending' THEN 0
    WHEN 'rejected' THEN 1
    WHEN 'approved' THEN 2
  END,
  vr.created_at ASC;
```

**Filters:**
- Status: `All` | `Pending` | `Approved` | `Rejected`
- Search: by name, email (from auth.users), or user_id
- Date range: created_at

**Table columns:**

| Doctor | Specialty | City | Document type | Submitted | Status | SLA |
|---|---|---|---|---|---|---|
| Dr. M. L... | Cardiology | Berlin | Medical License | 2h ago | `Pending` | Within SLA |

**Badges:**
- `Pending` — amber/warm
- `Approved` — green
- `Rejected` — red
- SLA hint: if `created_at` > 48h ago and status = 'pending', show "Overdue" in red

**Row click** navigates to Verification Review detail.

### B) Verification Review Detail (`/admin/verifications/[user_id]`)

**Layout: two-column**

**Left column — User Summary:**

| Field | Source |
|---|---|
| Full name | profiles.full_name |
| City | profiles.city |
| Specialty | onboarding_preferences.specialty |
| Career stage | onboarding_preferences.career_stage |
| Account created | profiles.created_at |
| Verification status | profiles.verification_status |
| Document type | verification_requests.verification_method |
| Submitted at | verification_requests.created_at |
| Previous review | verification_requests.reviewed_at (if any) |
| Previous notes | verification_requests.admin_notes (if any) |

**Right column — Document Preview:**

- Render each URL from `verification_requests.file_urls[]` via signed URLs (5-min expiry).
- Image files: inline preview with zoom capability.
- PDF files: embedded PDF viewer or download link.
- Security: signed URLs generated server-side, never cached in browser, no right-click download prompt.

**Decision Panel (bottom):**

Three action buttons + mandatory reason field:

```
┌─────────────────────────────────────────────────────┐
│  Reason for decision                                │
│  ┌───────────────────────────────────────────────┐  │
│  │ [textarea: required for Reject/Re-upload]     │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  [Approve verification]  [Request re-upload]  [Reject] │
│       (green)               (amber)           (red)    │
└─────────────────────────────────────────────────────┘
```

- **Approve**: reason field is optional (but encouraged).
- **Reject**: reason field is **mandatory** — button disabled until filled.
- **Request re-upload**: reason field is **mandatory**.

Each button shows a confirmation dialog before executing.

### C) Notification Outcomes (what the user sees)

| Decision | User-facing effect |
|---|---|
| **Approved** | `profiles.verification_status = 'approved'` → "Verified Doctor" badge appears on profile and in group chats. Toast/in-app: "Your medical license has been verified." |
| **Rejected** | `profiles.verification_status = 'rejected'` → Profile shows "Verification unsuccessful" with the admin's reason (sanitized). CTA: "Upload a new document" which creates a new verification_requests entry. |
| **Re-upload requested** | `profiles.verification_status` stays `'pending'` → Profile shows "Additional documentation needed" with the admin's reason. CTA: "Upload document" — user uploads, which updates `verification_requests.file_urls` and resets status to `'pending'`. |

### D) Data Updates (exact column changes)

#### On Approve:

```
profiles:
  verification_status = 'approved'
  verified_at          = now()
  verification_method  = 'manual_admin'

verification_requests:
  status      = 'approved'
  reviewed_by = <admin_user_id>
  reviewed_at = now()
  admin_notes = <reason> (if provided, append to existing)
```

#### On Reject:

```
profiles:
  verification_status = 'rejected'

verification_requests:
  status      = 'rejected'
  admin_notes = <reason>   (mandatory, overwrites)
  reviewed_by = <admin_user_id>
  reviewed_at = now()
```

#### On Request Re-upload:

**Schema note:** The `verification_status` enum only allows `'pending' | 'approved' | 'rejected'`. There is no `'needs_reupload'` value.

**Decision: Keep `profiles.verification_status = 'pending'`** (justified below).

```
profiles:
  verification_status = 'pending'   -- unchanged / reset to pending

verification_requests:
  status      = 'rejected'          -- enum only allows pending/approved/rejected
  admin_notes = 'REUPLOAD_REQUESTED: <reason>'   -- prefixed for programmatic detection
  reviewed_by = <admin_user_id>
  reviewed_at = now()
```

**Justification for keeping status `'pending'`:**
- The user hasn't been rejected permanently — they just need better documents.
- The product UI shows "pending" users as "Verification in progress", which is accurate.
- We distinguish "re-upload requested" from "genuinely pending" by checking `verification_requests.admin_notes LIKE 'REUPLOAD_REQUESTED:%'`.
- This avoids any schema migration.

**Recommended minimal schema change (if preferred over prefix hack):**
```sql
-- Add one enum value
ALTER TYPE verification_status ADD VALUE 'needs_reupload';
```
This is a 1-line migration, non-breaking, and makes queries cleaner. The admin UI can then filter by `status = 'needs_reupload'` directly. **I recommend this approach** but the prefix workaround works without any migration.

### E) Audit Log Entry (for each decision)

Every verification decision inserts into `admin_audit_logs`:

```json
{
  "admin_id": "<admin_user_id>",
  "action": "approve_verification" | "reject_verification" | "request_reupload",
  "target_user_id": "<user_id>",
  "target_table": "verification_requests",
  "target_id": "<verification_requests.id>",
  "old_values": {
    "verification_status": "pending",
    "vr_status": "pending",
    "admin_notes": null
  },
  "new_values": {
    "verification_status": "approved",
    "vr_status": "approved",
    "verified_at": "2026-02-17T10:30:00Z",
    "verification_method": "manual_admin",
    "admin_notes": "License verified against Ärztekammer Berlin registry"
  },
  "reason": "<admin-provided reason>",
  "ip_address": "<from request>",
  "user_agent": "<from request>",
  "status": "success"
}
```

---

## 4. Admin User Management

### User List (`/admin/users`)

**Data source:** `profiles` + `onboarding_preferences` + count aggregates.

**Table columns:**

| Name | City | Specialty | Status | Verified | Groups | Bookings | Joined |
|---|---|---|---|---|---|---|---|
| Dr. M. L... | Berlin | Cardiology | Active | Approved | 2 | 3 | Jan 15 |

**Filters:**
- Status: `All` | `Active` | `Banned` | `Soft-deleted`
- Verification: `All` | `Pending` | `Approved` | `Rejected`
- City
- Search: name, user_id

**Row click** → User Detail page.

### User Detail (`/admin/users/[user_id]`)

**Sections:**

1. **Profile Summary** — profiles.* (name, city, gender, languages, nationality, created_at)
2. **Verification Status** — verification_status + link to verification review if applicable
3. **Onboarding Preferences** — specialty, career_stage, interests, goals, social_style, etc.
4. **Booking History** — bookings for this user joined with events (date, type, status, paid)
5. **Group History** — group_members → match_groups (group name, week, status, member count)
6. **Reports** — any user_reports where reported_id = this user
7. **Admin Actions** panel (right sidebar or bottom)

### Admin Actions

Each action requires a **"Reason"** text field and produces an audit log entry.

#### Ban User
```
Updates:
  profiles.banned_at  = now()
  profiles.ban_reason = <reason>
  profiles.status     = 'banned'

Audit log:
  action: 'ban_user'
  target_table: 'profiles'
  old_values: { status, banned_at: null, ban_reason: null }
  new_values: { status: 'banned', banned_at: '<timestamp>', ban_reason: '<reason>' }
```

#### Unban User
```
Updates:
  profiles.banned_at  = null
  profiles.ban_reason = null
  profiles.status     = 'active'

Audit log:
  action: 'unban_user'
  old_values: { status: 'banned', banned_at, ban_reason }
  new_values: { status: 'active', banned_at: null, ban_reason: null }
```

#### Soft Delete Account
```
Updates:
  profiles.soft_delete = true
  profiles.deleted_at  = now()

Audit log:
  action: 'soft_delete_user'
  old_values: { soft_delete: false, deleted_at: null }
  new_values: { soft_delete: true, deleted_at: '<timestamp>' }
```

#### Restore Account
```
Updates:
  profiles.soft_delete = false
  profiles.deleted_at  = null

Audit log:
  action: 'restore_user'
  old_values: { soft_delete: true, deleted_at: '<timestamp>' }
  new_values: { soft_delete: false, deleted_at: null }
```

#### Change Role (admin only)
```
Updates:
  user_roles.role = <new_role>   -- or INSERT if no row exists

Audit log:
  action: 'change_role'
  target_table: 'user_roles'
  old_values: { role: 'user' }
  new_values: { role: 'moderator' }
```

---

## 5. Reports & Safety (`/admin/reports`)

### Triage Queue

**Data source:** `user_reports` joined with `profiles` (for reporter + reported names).

```sql
SELECT
  ur.*,
  rp.full_name AS reporter_name,
  rd.full_name AS reported_name,
  rd.verification_status AS reported_verification,
  rd.banned_at AS reported_banned
FROM user_reports ur
JOIN profiles rp ON rp.user_id = ur.reporter_id
JOIN profiles rd ON rd.user_id = ur.reported_id
ORDER BY
  CASE ur.status
    WHEN 'pending' THEN 0
    WHEN 'reviewed' THEN 1
    WHEN 'resolved' THEN 2
    WHEN 'dismissed' THEN 3
  END,
  ur.created_at ASC;
```

**Filters:** Status (`Pending` | `Reviewed` | `Resolved` | `Dismissed`), date range, reported user search.

**Table columns:**

| Reporter | Reported | Reason | Submitted | Status |
|---|---|---|---|---|
| Dr. A. K. | Dr. S. M. | Harassment | 3h ago | `Pending` |

### Report Detail (`/admin/reports/[id]`)

**Display:**
- Reporter: name + link to user profile
- Reported: name + link to user profile + current status (active/banned)
- Reason (category)
- Description (full text)
- Admin notes (editable textarea)
- Created at
- Reviewed at (if applicable)

### Actions

| Action | Updates | Audit log action |
|---|---|---|
| Mark reviewed | `status='reviewed'`, `reviewed_at=now()` | `review_report` |
| Resolve | `status='resolved'`, `reviewed_at=now()` | `resolve_report` |
| Dismiss | `status='dismissed'`, `reviewed_at=now()` | `dismiss_report` |
| Add admin notes | `admin_notes=<text>` | `update_report_notes` |

**Quick actions (on the reported user, from within report detail):**

| Quick action | Effect |
|---|---|
| Warn user | Insert a system message into the user's active group chat (if any) via `group_messages` with `is_bot=true`. Audit logged as `warn_user`. |
| Ban user | Same as User Management ban flow. Audit logged as `ban_user`. |
| Remove from group | Delete from `group_members` where `user_id = reported_id`. Audit logged as `remove_from_group`. |
| Mute in chat | Not supported by current schema (no `muted_at` column on `group_members`). **Workaround:** Ban the user or remove from group. **Recommended schema addition (optional):** `ALTER TABLE group_members ADD COLUMN muted_until TIMESTAMPTZ;` — then the chat UI checks `muted_until > now()` before allowing message send. |

Each quick action requires a reason field and produces an audit log.

---

## 6. Events & Bookings Admin (`/admin/events`)

### Events List

**Data source:** `events` with booking count aggregate.

```sql
SELECT
  e.*,
  COUNT(b.id) AS booking_count,
  COUNT(b.id) FILTER (WHERE b.status = 'confirmed') AS confirmed_count,
  COUNT(b.id) FILTER (WHERE b.paid = true) AS paid_count
FROM events e
LEFT JOIN bookings b ON b.event_id = e.id
GROUP BY e.id
ORDER BY e.date_time DESC;
```

**Filters:**
- Status: `All` | `Open` | `Full` | `Closed` | `Cancelled`
- Date range (weekend picker)
- City
- Meetup type (`brunch` | `coffee` | `walk` | `sports` | `dinner`)

**Table columns:**

| Date | Type | City | Neighborhood | Capacity | Bookings | Paid | Status |
|---|---|---|---|---|---|---|---|
| Sat Feb 22, 11:00 | Brunch | Berlin | Kreuzberg | 4 | 3/4 | 2 | `Open` |

### Event Detail (`/admin/events/[id]`)

**Event info card:** date_time, meetup_type, city, neighborhood, min/max participants, status.

**Bookings table for this event:**

| Doctor | Status | Paid | Payment ID | Booked at | Preferences |
|---|---|---|---|---|---|
| Dr. M. L. | Confirmed | Yes | pi_xxx | Feb 18 | { budget: "moderate", dietary: "vegetarian" } |

**Linked group:** If `match_groups.event_id = this event`, show link to group detail.

### Admin Actions

| Action | Updates | Conditions | Audit log |
|---|---|---|---|
| Cancel event | `events.status = 'cancelled'` | Confirmation required. All bookings for this event set to `'cancelled'`. | `cancel_event` (target_table: events) + one `cancel_booking` per booking |
| Close event | `events.status = 'closed'` | Prevents new bookings. | `close_event` |
| Reopen event | `events.status = 'open'` | Only if was 'closed'. | `reopen_event` |
| Force-cancel booking | `bookings.status = 'cancelled'` | Single booking. Reason required. | `cancel_booking` (target_table: bookings, target_id: booking.id) |
| Move booking | Not a single operation — admin must cancel the old booking and the user rebooks. | Show guidance text: "Cancel this booking, then ask the user to rebook on the target event." | N/A — handled as cancel + rebook |

---

## 7. Groups & Chat Moderation (`/admin/groups`)

### Groups List

**Data source:** `match_groups` with member count + conversation existence.

**Table columns:**

| Group name | Type | Week | Event | Members | Status | Created |
|---|---|---|---|---|---|---|
| Brunch Crew #12 | brunch | 2026-W08 | Feb 22 Brunch | 3 | Active | Feb 17 |

**Filters:** Status (`Active` | `Disbanded`), week, group_type.

### Group Detail (`/admin/groups/[id]`)

**Sections:**

1. **Group Info** — name, group_type, gender_composition, match_week, status, event link
2. **Members** — list from `group_members` joined with `profiles`
   - Each member row: name, city, specialty, joined_at
   - Action per member: **Remove from group** (with reason, confirmation dialog)
3. **Conversation** — messages from `group_messages` via `group_conversations`
   - Paginated (50 messages per page), newest first
   - Each message: sender name, content, timestamp, is_bot badge, is_deleted indicator
   - Action per message: **Delete message** (soft delete)
   - Action at top: **Send system message** (inserts `group_messages` with `is_bot = true`)

### Admin Actions

| Action | Updates | Audit log |
|---|---|---|
| Remove message | `group_messages.is_deleted = true`, `group_messages.deleted_at = now()` | `delete_message` (target_table: group_messages, target_id: message.id, old_values: { content: "<redacted first 100 chars>" }) |
| Remove user from group | `DELETE FROM group_members WHERE group_id = X AND user_id = Y` | `remove_from_group` (target_table: group_members, target_id: group_members.id) |
| Disband group | `match_groups.status = 'disbanded'` | `disband_group` (target_table: match_groups, target_id: group.id) |
| Send system message | `INSERT INTO group_messages (conversation_id, sender_id, content, is_bot) VALUES (<conv_id>, <admin_id>, <message>, true)` | `send_system_message` (target_table: group_messages) |

**Privacy note:** When logging message deletion, store only the first 100 characters of content in `old_values` to limit PII exposure in audit logs. Full message content is soft-deleted (still in DB if needed for legal review) but hidden from chat UI.

---

## 8. Audit Logs (`/admin/audit-logs`)

### Filters

| Filter | Options |
|---|---|
| Admin | Dropdown of all users with admin/moderator role |
| Target user | Search by name or user_id |
| Action | Dropdown: all action types (approve_verification, ban_user, etc.) |
| Date range | Date picker (from / to) |
| Status | `success` | `failed` |

### Table Columns

| Timestamp | Admin | Action | Target user | Table | Reason | Status |
|---|---|---|---|---|---|---|
| Feb 17, 10:30 | Admin A. | approve_verification | Dr. M. L. | verification_requests | License valid | success |

### Detail Expansion (inline or modal)

Clicking a row expands to show:
- `old_values` and `new_values` as a side-by-side diff view
- JSON formatted, with changed keys highlighted
- `ip_address` and `user_agent`
- `target_id` (UUID of the affected row)

### Export

- **CSV export** button (admin only)
- Exports currently filtered results
- Columns: timestamp, admin_name, action, target_user_name, target_table, target_id, reason, old_values (JSON string), new_values (JSON string), status

---

## 9. Minimal UI Copy (Premium, Calm)

### Verification Decision Buttons
```
Approve:       "Approve verification"
Re-upload:     "Request new document"
Reject:        "Reject verification"
```

### Reason Fields
```
Approve textarea placeholder:   "Optional — add a note about this verification"
Reject textarea placeholder:    "Explain why the document was not accepted"
Re-upload textarea placeholder: "Describe what document is needed and why"
```

### Danger Confirmations

**Ban user:**
```
Title:    "Ban this account?"
Body:     "This will immediately revoke access for [Dr. Full Name].
           They will not be able to log in or participate in any groups."
Confirm:  "Ban account"
Cancel:   "Keep active"
```

**Soft delete:**
```
Title:    "Deactivate this account?"
Body:     "This will soft-delete [Dr. Full Name]'s account.
           Their data will be preserved and the account can be restored."
Confirm:  "Deactivate account"
Cancel:   "Keep active"
```

**Disband group:**
```
Title:    "Disband this group?"
Body:     "This will mark [Group Name] as disbanded.
           All members will lose access to the group chat."
Confirm:  "Disband group"
Cancel:   "Keep group"
```

**Cancel event:**
```
Title:    "Cancel this event?"
Body:     "This will cancel the [Brunch] on [Sat Feb 22] in [Kreuzberg].
           All [3] bookings will also be cancelled."
Confirm:  "Cancel event"
Cancel:   "Keep event"
```

**Delete message:**
```
Title:    "Remove this message?"
Body:     "This message will be hidden from all group members.
           The content is preserved in the database for compliance."
Confirm:  "Remove message"
Cancel:   "Keep message"
```

### Success Toasts
```
approve_verification:  "Verification approved — doctor badge activated"
reject_verification:   "Verification rejected — user notified"
request_reupload:      "Re-upload requested — user notified"
ban_user:              "Account banned"
unban_user:            "Account restored"
soft_delete_user:      "Account deactivated"
restore_user:          "Account reactivated"
cancel_event:          "Event cancelled — bookings updated"
delete_message:        "Message removed"
disband_group:         "Group disbanded"
remove_from_group:     "Member removed from group"
```

### Error Toast (generic)
```
"Something went wrong. Please try again or check the audit log."
```

---

## 10. Implementation Notes (Supabase)

### RPC Function Strategy

All admin write operations go through SECURITY DEFINER RPCs. This guarantees:
1. Audit log is **always** written (no way to skip from client).
2. Multi-table updates are atomic (within a single transaction).
3. RLS is bypassed inside the function (SECURITY DEFINER), but the function itself checks `has_role()`.

### Recommended RPCs

| Function | Parameters |
|---|---|
| `admin_approve_verification` | `(p_user_id UUID, p_reason TEXT)` |
| `admin_reject_verification` | `(p_user_id UUID, p_reason TEXT)` |
| `admin_request_reupload` | `(p_user_id UUID, p_reason TEXT)` |
| `admin_ban_user` | `(p_user_id UUID, p_reason TEXT)` |
| `admin_unban_user` | `(p_user_id UUID, p_reason TEXT)` |
| `admin_soft_delete_user` | `(p_user_id UUID, p_reason TEXT)` |
| `admin_restore_user` | `(p_user_id UUID, p_reason TEXT)` |
| `admin_change_role` | `(p_user_id UUID, p_new_role app_role, p_reason TEXT)` |
| `admin_delete_message` | `(p_message_id UUID, p_reason TEXT)` |
| `admin_remove_from_group` | `(p_group_id UUID, p_user_id UUID, p_reason TEXT)` |
| `admin_disband_group` | `(p_group_id UUID, p_reason TEXT)` |
| `admin_cancel_event` | `(p_event_id UUID, p_reason TEXT)` |
| `admin_cancel_booking` | `(p_booking_id UUID, p_reason TEXT)` |
| `admin_update_report` | `(p_report_id UUID, p_status TEXT, p_admin_notes TEXT)` |
| `admin_send_system_message` | `(p_group_id UUID, p_content TEXT)` |

### Example RPC: `admin_approve_verification`

```sql
CREATE OR REPLACE FUNCTION public.admin_approve_verification(
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id    UUID := auth.uid();
  v_old_profile JSONB;
  v_old_vr      JSONB;
  v_vr_id       UUID;
  v_new_values  JSONB;
BEGIN
  -- 1. Permission check
  IF NOT has_role(v_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  -- 2. Capture old state
  SELECT jsonb_build_object(
    'verification_status', verification_status,
    'verified_at', verified_at,
    'verification_method', verification_method
  ) INTO v_old_profile
  FROM profiles WHERE user_id = p_user_id;

  IF v_old_profile IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  SELECT id,
    jsonb_build_object(
      'status', status,
      'admin_notes', admin_notes,
      'reviewed_by', reviewed_by,
      'reviewed_at', reviewed_at
    ) INTO v_vr_id, v_old_vr
  FROM verification_requests WHERE user_id = p_user_id;

  IF v_vr_id IS NULL THEN
    RAISE EXCEPTION 'No verification request found for user: %', p_user_id;
  END IF;

  -- 3. Update profiles
  UPDATE profiles SET
    verification_status = 'approved',
    verified_at         = now(),
    verification_method = 'manual_admin'
  WHERE user_id = p_user_id;

  -- 4. Update verification_requests
  UPDATE verification_requests SET
    status      = 'approved',
    reviewed_by = v_admin_id,
    reviewed_at = now(),
    admin_notes = COALESCE(p_reason, admin_notes),
    updated_at  = now()
  WHERE user_id = p_user_id;

  -- 5. Build new values for audit
  v_new_values := jsonb_build_object(
    'verification_status', 'approved',
    'verified_at', now(),
    'verification_method', 'manual_admin',
    'vr_status', 'approved',
    'reviewed_by', v_admin_id,
    'admin_notes', p_reason
  );

  -- 6. Insert audit log
  INSERT INTO admin_audit_logs (
    admin_id, action, target_user_id, target_table, target_id,
    old_values, new_values, reason, status
  ) VALUES (
    v_admin_id,
    'approve_verification',
    p_user_id,
    'verification_requests',
    v_vr_id,
    v_old_profile || v_old_vr,   -- merge both old states
    v_new_values,
    p_reason,
    'success'
  );

  RETURN jsonb_build_object('success', true, 'verification_request_id', v_vr_id);

EXCEPTION WHEN OTHERS THEN
  -- Log failed attempt
  INSERT INTO admin_audit_logs (
    admin_id, action, target_user_id, target_table,
    reason, status, new_values
  ) VALUES (
    COALESCE(v_admin_id, '00000000-0000-0000-0000-000000000000'),
    'approve_verification',
    p_user_id,
    'verification_requests',
    p_reason,
    'failed',
    jsonb_build_object('error', SQLERRM)
  );
  RAISE;
END;
$$;
```

### Client-Side Integration Pattern

```typescript
// In adminService.ts
export const approveVerification = async (
  userId: string,
  reason: string | null
) => {
  const { data, error } = await supabase.rpc('admin_approve_verification', {
    p_user_id: userId,
    p_reason: reason,
  });

  if (error) throw error;
  return data;
};
```

### IP Address & User Agent

The RPCs above don't capture `ip_address` or `user_agent` because Postgres functions don't have access to HTTP headers. Two approaches:

**Option A (recommended): Pass from client via RPC params**
Add `p_ip_address INET DEFAULT NULL` and `p_user_agent TEXT DEFAULT NULL` params. The Next.js API route or server action extracts these from the request and passes them to the RPC.

**Option B: Use a Next.js API route as middleware**
```
Client → POST /api/admin/approve-verification
  → Server extracts IP + UA from request headers
  → Calls supabase.rpc('admin_approve_verification', { ..., p_ip_address, p_user_agent })
```

Option B is cleaner because it prevents clients from spoofing their IP.

### Storage Bucket Configuration

```sql
-- Create private bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verifications', 'verifications', false);

-- RLS: only admin/moderator can read
CREATE POLICY "admin_read_verifications"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verifications'
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
  );

-- RLS: authenticated users can upload their own
CREATE POLICY "user_upload_verification"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'verifications'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

### Dashboard KPI Queries

```sql
-- For the admin dashboard stats
SELECT
  (SELECT COUNT(*) FROM profiles WHERE soft_delete = false) AS total_users,
  (SELECT COUNT(*) FROM profiles WHERE verification_status = 'approved') AS verified_users,
  (SELECT COUNT(*) FROM verification_requests WHERE status = 'pending') AS pending_verifications,
  (SELECT COUNT(*) FROM user_reports WHERE status = 'pending') AS open_reports,
  (SELECT COUNT(*) FROM events WHERE date_time > now() AND status = 'open') AS upcoming_events,
  (SELECT COUNT(*) FROM match_groups WHERE status = 'active') AS active_groups,
  (SELECT COUNT(*) FROM waitlist) AS waitlist_count;
```

---

## Appendix: Existing `adminService.ts` Gaps

The current `adminService.ts` has basic implementations but is missing:

| Missing | Needed for |
|---|---|
| Verification queue fetching | Verification Queue page |
| Verification decision RPCs | Approve/Reject/Re-upload |
| Report management | Reports & Safety page |
| Event/booking queries & actions | Events & Bookings page |
| Group/message queries & actions | Groups & Chats page |
| Waitlist/survey queries | Waitlist & Surveys page |
| App config CRUD | App Config page |
| IP/UA forwarding on ban/unban | Audit log completeness |
| Audit log does not record on ban/unban | Existing `banUser`/`unbanUser` skip audit logging |

**Current `banUser`/`unbanUser` do NOT write audit logs.** These must be migrated to use the new RPCs or have audit log insertion added.

---

## Appendix: Action → Audit Log Reference

| Action string | target_table | Triggered by |
|---|---|---|
| `approve_verification` | verification_requests | Verification review |
| `reject_verification` | verification_requests | Verification review |
| `request_reupload` | verification_requests | Verification review |
| `ban_user` | profiles | User management / report quick action |
| `unban_user` | profiles | User management |
| `soft_delete_user` | profiles | User management |
| `restore_user` | profiles | User management |
| `change_role` | user_roles | User management |
| `review_report` | user_reports | Reports |
| `resolve_report` | user_reports | Reports |
| `dismiss_report` | user_reports | Reports |
| `update_report_notes` | user_reports | Reports |
| `warn_user` | group_messages | Report quick action |
| `cancel_event` | events | Events admin |
| `close_event` | events | Events admin |
| `reopen_event` | events | Events admin |
| `cancel_booking` | bookings | Events admin |
| `delete_message` | group_messages | Chat moderation |
| `remove_from_group` | group_members | Group moderation |
| `disband_group` | match_groups | Group moderation |
| `send_system_message` | group_messages | Group moderation |
| `update_app_config` | app_config | App Config |
