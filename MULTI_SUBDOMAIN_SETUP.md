# Multi-Subdomain SaaS Setup (BeyondRounds)

This guide configures the Vite + React app for a multi-subdomain deployment on Vercel.

## Architecture

| Domain | Purpose |
|--------|---------|
| `beyondrounds.app` | Marketing website |
| `whitelist.beyondrounds.app` | Waitlist + authentication |
| `servy.beyondrounds.app` | API + Stripe (checkout, webhooks, cancel) |
| `admin.beyondrounds.app` | Admin dashboard |
| `app.beyondrounds.app` | User dashboard (matching, groups, billing) |

## 1. Subdomain Landing Pages

When users visit a subdomain root (`/`, `/de`, `/en`), they are redirected to the dedicated page:

| Subdomain | Root redirects to |
|-----------|-------------------|
| `app.beyondrounds.app` | `/de/dashboard` or `/en/dashboard` |
| `admin.beyondrounds.app` | `/de/admin` or `/en/admin` |
| `whitelist.beyondrounds.app` | `/de/waitlist` or `/en/waitlist` |
| `servy.beyondrounds.app` | API only (no frontend) |

## 2. Marketing Site Redirects

When deployed to `beyondrounds.app`, these redirects apply (via `vercel.json`):

- `/login` → `https://whitelist.beyondrounds.app/auth`
- `/auth` → `https://whitelist.beyondrounds.app/auth`
- `/join` → `https://whitelist.beyondrounds.app`
- `/app` → `https://app.beyondrounds.app`
- `/app/:path*` → `https://app.beyondrounds.app/:path*`

**Note:** The `has: [{ "type": "host", "value": "beyondrounds.app" }]` condition ensures redirects only run on the marketing domain.

## 3. Authentication Cookies (Cross-Subdomain)

For shared sessions across subdomains, set:

```env
VITE_USE_COOKIE_STORAGE=true
```

Cookies use:
- `Domain=.beyondrounds.app`
- `Secure`
- `SameSite=None`

**Supabase Redirect URLs** (in Supabase Dashboard → Auth → URL Configuration):

- `https://whitelist.beyondrounds.app/auth/callback`
- `https://app.beyondrounds.app/auth/callback`
- `https://admin.beyondrounds.app/auth/callback`

## 4. Servy API (CORS + Origin Validation)

The servy project only accepts requests from:

- `https://app.beyondrounds.app`
- `https://admin.beyondrounds.app`
- `https://whitelist.beyondrounds.app`

**Deploy servy:**

1. Create a new Vercel project
2. Set **Root Directory** to `servy`
3. Add domain `servy.beyondrounds.app`
4. Add environment variables (see below)

## 5. Stripe Isolation

- **Frontend never talks to Stripe directly** – all calls go through servy
- **Checkout:** `POST https://servy.beyondrounds.app/api/stripe-checkout`
- **Cancel:** `POST https://servy.beyondrounds.app/api/stripe-cancel`
- **Webhook:** Configure in Stripe Dashboard → `https://servy.beyondrounds.app/api/stripe-webhook`

## 6. Example Flow: Login → Dashboard → Stripe Checkout

1. User visits `beyondrounds.app` (marketing)
2. Clicks "Login" → redirects to `whitelist.beyondrounds.app/auth`
3. Signs in → session stored in cookie (`Domain=.beyondrounds.app`)
4. Redirects to `app.beyondrounds.app/dashboard`
5. Clicks "Upgrade" → `createCheckoutSession` calls `servy.beyondrounds.app/api/stripe-checkout`
6. Servy validates `Origin` header, proxies to Supabase Edge Function
7. User redirected to Stripe Checkout
8. After payment, Stripe webhook hits `servy.beyondrounds.app/api/stripe-webhook` → forwarded to Supabase

## 7. Environment Variables

### Marketing / Whitelist / App / Admin (Vite frontend)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key

# For whitelist/app/admin when using cross-subdomain cookies
VITE_USE_COOKIE_STORAGE=true

# For app/admin when using servy for Stripe
VITE_SERVY_URL=https://servy.beyondrounds.app

# Stripe (client-side, publishable only)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PRICE_ID_BASIC=price_...
VITE_STRIPE_PRICE_ID_PREMIUM=price_...
VITE_STRIPE_PRICE_ID_PRO=price_...
```

### Servy (Vercel project, Root Directory: `servy`)

```env
SUPABASE_URL=https://your-project.supabase.co
```

Supabase Edge Functions (stripe-checkout, stripe-webhook, stripe-cancel-subscription) keep their own env:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (for stripe-webhook)

## 8. Vercel Projects Summary

| Project | Domain | Root Dir | Key Env |
|---------|--------|----------|---------|
| beyondrounds-marketing | beyondrounds.app | . | VITE_* |
| beyondrounds-whitelist | whitelist.beyondrounds.app | . | VITE_*, VITE_USE_COOKIE_STORAGE=true |
| beyondrounds-servy | servy.beyondrounds.app | **servy** | SUPABASE_URL |
| beyondrounds-admin | admin.beyondrounds.app | . | VITE_*, VITE_SERVY_URL |
| beyondrounds-app | app.beyondrounds.app | . | VITE_*, VITE_SERVY_URL, VITE_USE_COOKIE_STORAGE=true |

## 9. Local Development

- Without `VITE_SERVY_URL`: Stripe calls go directly to Supabase functions
- Without `VITE_USE_COOKIE_STORAGE`: Uses `localStorage` (default)
- To test servy locally: run `vercel dev` in the `servy` folder and add `http://localhost:5173` to allowed origins (edit `servy/api/stripe-checkout.ts` and `stripe-cancel.ts` temporarily)

## 10. Security Checklist

- [ ] All domains use HTTPS
- [ ] `VITE_USE_COOKIE_STORAGE` only on production subdomains
- [ ] Stripe secret keys never in client code
- [ ] Supabase redirect URLs restricted to your domains
- [ ] CORS/origin validation enabled on servy
- [ ] Stripe webhook signature verified (handled by Supabase function)
