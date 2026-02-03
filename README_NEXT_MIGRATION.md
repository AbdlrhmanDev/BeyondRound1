# Next.js Migration - Setup Guide

This project has been migrated from Vite + React Router to Next.js 14 with the App Router.

## Quick Start

### 1. Install Dependencies

First, rename `package.next.json` to `package.json` (backup the original):

```bash
# Backup original
mv package.json package.vite.json

# Use Next.js dependencies
mv package.next.json package.json

# Install dependencies
npm install

# Add Supabase SSR package
npm install @supabase/ssr
```

### 2. Rename TypeScript Config

```bash
# Backup original
mv tsconfig.json tsconfig.vite.json

# Use Next.js config
mv tsconfig.next.json tsconfig.json
```

### 3. Set Up Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `SUPABASE_URL` - Same as NEXT_PUBLIC_SUPABASE_URL (for server-side)
- `COUNTRY_STATE_CITY_API_KEY` - For location API

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## Project Structure

```
├── app/                          # Next.js App Router
│   ├── [locale]/                 # i18n dynamic segment
│   │   ├── layout.tsx            # Locale layout with providers
│   │   ├── page.tsx              # Homepage
│   │   ├── loading.tsx           # Loading UI
│   │   ├── not-found.tsx         # 404 page
│   │   ├── (marketing)/          # Marketing pages (SSG)
│   │   │   ├── about/
│   │   │   ├── faq/
│   │   │   ├── contact/
│   │   │   ├── pricing/
│   │   │   └── ...
│   │   ├── (auth)/               # Auth pages
│   │   │   ├── auth/
│   │   │   └── forgot-password/
│   │   ├── (app)/                # Protected app pages
│   │   │   ├── dashboard/
│   │   │   ├── settings/
│   │   │   ├── profile/
│   │   │   └── ...
│   │   └── (admin)/              # Admin pages
│   │       └── admin/
│   ├── api/                      # API routes
│   │   ├── stripe/
│   │   └── location/
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   └── error.tsx                 # Error boundary
│
├── src/
│   ├── components/               # React components (unchanged)
│   ├── hooks/                    # Custom hooks (updated)
│   ├── services/                 # Data services (unchanged)
│   ├── lib/
│   │   ├── supabase/             # Supabase SSR clients (new)
│   │   │   ├── client.ts         # Browser client
│   │   │   ├── server.ts         # Server client
│   │   │   └── middleware.ts     # Middleware helper
│   │   ├── i18n/                 # i18n utilities (new)
│   │   │   ├── settings.ts
│   │   │   └── get-dictionary.ts
│   │   └── locale.ts             # Locale utilities
│   ├── providers/                # Context providers (new)
│   │   ├── Providers.tsx
│   │   └── I18nProvider.tsx
│   ├── contexts/                 # React contexts (updated)
│   ├── pages/                    # Page components (used by app routes)
│   └── locales/                  # Translation files
│
├── middleware.ts                 # Next.js middleware (i18n, auth)
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind (unchanged)
└── postcss.config.mjs            # PostCSS (new)
```

---

## Key Changes

### Routing

| Before (React Router)           | After (Next.js)                    |
|---------------------------------|-----------------------------------|
| `useNavigate()`                 | `useRouter()` from `next/navigation` |
| `<Link to="/path">`             | `<Link href="/path">` or `<LocalizedLink to="/path">` |
| `useParams()`                   | Route params via props or `useParams()` |
| `useLocation()`                 | `usePathname()`, `useSearchParams()` |

### Data Fetching

| Before                          | After                             |
|---------------------------------|-----------------------------------|
| Client-side only                | Server Components + Client Components |
| React Query everywhere          | Server fetch + React Query for real-time |

### Authentication

| Before                          | After                             |
|---------------------------------|-----------------------------------|
| `useAuth()` hook                | Same hook, updated for SSR        |
| Client-side session check       | Middleware + Server Component check |

---

## Navigation (Next.js)

Use Next.js navigation APIs directly:

```typescript
// Programmatic navigation with locale
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';

// Links with locale prefix
import LocalizedLink from '@/components/LocalizedLink';

// Route params
import { useParams } from 'next/navigation';

// Pathname
import { usePathname } from 'next/navigation';
```

---

## Page Rendering Strategies

### Static Generation (SSG) - Marketing Pages
```typescript
// app/[locale]/(marketing)/about/page.tsx
export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate hourly
```

### Server-Side Rendering (SSR) - Protected Pages
```typescript
// app/[locale]/(app)/dashboard/page.tsx
export const dynamic = 'force-dynamic';
```

---

## API Routes

API routes have been migrated from Vercel Functions to Next.js Route Handlers:

| Before                          | After                             |
|---------------------------------|-----------------------------------|
| `api/stripe-checkout.ts`        | `app/api/stripe/checkout/route.ts` |
| `api/countries.ts`              | `app/api/location/countries/route.ts` |

---

## Environment Variables

### Vite (Before)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

### Next.js (After)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=  # Server-side
```

---

## Troubleshooting

### "Module not found" errors
Run `npm install` to ensure all dependencies are installed.

### Hydration errors
Add `'use client'` directive to components that use browser APIs or React hooks.

### Auth not working
1. Check that cookies are being set correctly
2. Verify Supabase SSR package is installed
3. Check middleware is running

### i18n not working
1. Verify locale is in the URL path
2. Check translation files exist in `src/locales/`
3. Verify `I18nProvider` is wrapping your app

---

## Deployment

Deploy to Vercel:

```bash
vercel
```

Or build for production:

```bash
npm run build
npm start
```

---

## Keeping Both Versions

To keep both Vite and Next.js versions working:

1. Keep `package.vite.json` and `package.next.json` separate
2. Use different config files for each
3. The `src/` directory is shared and compatible with both

To switch back to Vite:
```bash
mv package.json package.next.json
mv package.vite.json package.json
npm install
```
