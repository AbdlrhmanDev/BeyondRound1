# Plan: Add Resend Emails for Group Formation, Waitlist & Verification

## Context
The app uses Resend API for transactional emails. Three key trigger points currently lack email delivery:

1. **New Group Formed** — `send-match-notifications` edge function only creates in-app notifications, never sends emails despite a `match_ready` email template already existing in the `send-email` edge function.
2. **Waitlist Signup** — Already works (`Waitlist.tsx` → `/api/notifications/whitelist` → `emailService.sendWhitelistConfirmation()`). No changes needed.
3. **Verification Decision** — Admin approves/rejects medical license in `AdminVerification.tsx` but no email is sent to the user.

## Changes

### 1. Send Email When New Group is Formed
**File:** `supabase/functions/send-match-notifications/index.ts`

The `match_ready` template already exists in `send-email` edge function. We just need to:
- Fetch user emails from `auth.users` (via service role client)
- After inserting in-app notifications, invoke the `send-email` edge function for each member with the `match_ready` template
- Pass: `memberNames`, `memberCount`, `chatUrl`, `matchWeek`

This keeps it all within the Deno edge function layer (no client-side changes needed).

### 2. Verification Decision Email
**New file:** `src/components/emails/verification-status.tsx`
- React Email template for verification approved/rejected
- Props: `status: 'approved' | 'rejected'`, `userName: string`
- Approved: congratulations, you're verified, go to dashboard
- Rejected: license not approved, resubmit instructions

**New file:** `app/api/notifications/verification/route.ts`
- POST endpoint accepting `{ email, status, userName }`
- Calls `emailService.sendVerificationStatus()`

**Modified file:** `src/services/emailService.ts`
- Add `sendVerificationStatus(email, status, userName)` method

**Modified file:** `src/views/admin/AdminVerification.tsx`
- After `updateStatus()` succeeds, fetch the user's email and call `/api/notifications/verification`
- Need to fetch email from `auth.users` — will use a lookup via profile `user_id`

### 3. (No changes) Waitlist Email
Already functional. `Waitlist.tsx` line 141 calls `/api/notifications/whitelist`.

## Files to Create
1. `src/components/emails/verification-status.tsx` — Email template
2. `app/api/notifications/verification/route.ts` — API route

## Files to Modify
1. `supabase/functions/send-match-notifications/index.ts` — Add email sending via send-email function
2. `src/services/emailService.ts` — Add `sendVerificationStatus()` method
3. `src/views/admin/AdminVerification.tsx` — Trigger verification email after approve/reject

## Verification
- Check that `send-match-notifications` now calls `send-email` with `match_ready` template
- Check that admin approve/reject triggers email via `/api/notifications/verification`
- Run `npm run build` to confirm no TypeScript errors
