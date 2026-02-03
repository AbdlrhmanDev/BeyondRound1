# Troubleshooting: Signup 500 Error

**Error:** `Database configuration issue. Please contact support.`  
**Supabase:** `auth/v1/signup` returns 500

This usually happens when Supabase fails to send the confirmation email. Without custom SMTP, Supabase only sends to **pre-authorized team emails** (max 2/hour). You need custom SMTP for real user signups with email confirmation.

---

## Fix: Configure Custom SMTP (Required for Email Confirmation)

Use **Hostinger**, **Resend**, or another SMTP provider.

---

### Option A: Hostinger (if you have a Hostinger domain/email)

1. Create an email account in **Hostinger hPanel** → **Emails** → **Manage** → create `no-reply@yourdomain.com`
2. Get SMTP details: **Connect Apps & Devices** → **Manual Configuration**
3. In Supabase: **Project Settings** → **Authentication** → **SMTP Settings** → Enable **Custom SMTP**

| Field | Value |
|-------|-------|
| **Sender email** | `no-reply@yourdomain.com` (your Hostinger email) |
| **Sender name** | `BeyondRounds` |
| **Host** | `smtp.hostinger.com` |
| **Port** | `465` |
| **Username** | Your full email (e.g. `no-reply@yourdomain.com`) |
| **Password** | Your Hostinger **email account** password (not hPanel password) |

**If you see "Error sending confirmation email" in Auth logs:**

1. **Reset the email password** in Hostinger hPanel → Emails → Manage → select the account → Reset password. Use a simple password (letters + numbers, no special chars) and update it in Supabase.
2. **Try port 587** instead of 465 — Supabase may use TLS differently; change Port to `587` and Save.
3. **Verify the email exists** — hPanel → Emails → ensure `noreply@beyondrounds.app` is created and active.
4. **Contact Hostinger** — Some plans restrict external SMTP; ask if your plan allows third‑party SMTP (Supabase, etc.). If not, use Resend instead.

---

### Option B: Resend (recommended if Hostinger fails) (free tier: 3,000 emails/month)

1. [resend.com](https://resend.com) → sign up → **API Keys** → create key
2. **Domains** → Add and verify your domain
3. In Supabase: **Project Settings** → **Authentication** → **SMTP Settings** → Enable **Custom SMTP**

| Field | Value |
|-------|-------|
| **Sender email** | `no-reply@yourdomain.com` (verified domain) |
| **Sender name** | `BeyondRounds` |
| **Host** | `smtp.resend.com` |
| **Port** | `465` |
| **Username** | `resend` |
| **Password** | Your Resend API key |

---

### Keep Email Confirmation ON

1. **Authentication** → **Providers** → **Email**
2. Ensure **Confirm email** is **ON**
3. Save

---

## Alternative: Disable Email Confirmation (No SMTP)

If you don't need confirmation:

1. **Authentication** → **Providers** → **Email**
2. Turn **OFF** "Confirm email"
3. Save

---

## If Error Persists: Fix Database Trigger

The 500 can also be caused by the `handle_new_user` trigger failing. Run this in **Supabase SQL Editor**:

1. Open your project → **SQL Editor** → **New query**
2. Copy the full contents of `supabase/migrations/20260120160014_verify_and_fix_trigger.sql`
3. Paste and click **Run**

This ensures the trigger that creates a `profiles` row on signup works correctly.

---

## Check Supabase Logs

**Logs** → **Auth** → look for the failed signup and exact error.
