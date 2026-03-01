# Troubleshooting: Signup 500 Error

**Error:** `Database configuration issue. Please contact support.`
**Supabase:** `auth/v1/signup` returns 500

This happens when Supabase fails to send the confirmation email. Without custom SMTP, Supabase only sends to **pre-authorized team emails** (max 2/hour). Custom SMTP is required for real user signups.

---

## Fix: Configure Zoho SMTP in Supabase

Go to **Project Settings → Authentication → SMTP Settings → Enable Custom SMTP**

| Field | Value |
|-------|-------|
| **Sender email** | `hello@beyondrounds.app` |
| **Sender name** | `BeyondRounds` |
| **Host** | `smtp.zoho.eu` |
| **Port** | `465` |
| **Username** | `hello@beyondrounds.app` |
| **Password** | Your Zoho app password (see below) |

### Getting your Zoho app password

1. Log in to [mail.zoho.eu](https://mail.zoho.eu)
2. **Settings** → **Security** → **App Passwords** → Generate a new app password
3. Use that generated password in the Supabase SMTP **Password** field

> **Note:** Use your Zoho **app password**, not your regular Zoho login password.

---

## Keep Email Confirmation ON

1. **Authentication** → **Providers** → **Email**
2. Ensure **Confirm email** is **ON**
3. Save

---

## Alternative: Disable Email Confirmation (No SMTP)

If you don't need email confirmation:

1. **Authentication** → **Providers** → **Email**
2. Turn **OFF** "Confirm email"
3. Save

---

## If Error Persists: Fix Database Trigger

The 500 can also be caused by the `handle_new_user` trigger failing. Run this in **Supabase SQL Editor**:

1. Open your project → **SQL Editor** → **New query**
2. Copy the full contents of `supabase/migrations/20260120160014_verify_and_fix_trigger.sql`
3. Paste and click **Run**

---

## Check Supabase Logs

**Logs** → **Auth** → look for the failed signup and exact error.
