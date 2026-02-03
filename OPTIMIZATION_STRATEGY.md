# Next.js Performance Optimization Strategy

## Lighthouse Report Analysis

| Metric | Current | Target | Root Cause |
|--------|---------|--------|------------|
| **JS Execution** | 3.5s | <1.5s | Heavy client bundle: i18next, React Query, Radix, theme init |
| **Main-thread** | 5.2s | <2.5s | Provider waterfall + hydration of large tree |
| **Unused JS** | 1,082 KiB | <400 KiB | Full app bundle on marketing; barrel imports; duplicate toasters |
| **Network** | 2,713 KiB | <1,500 KiB | No route-level splitting for marketing |
| **Unused CSS** | 20 KiB | <10 KiB | Tailwind + Radix; no critical CSS extraction |
| **BFCache** | 3 failures | 0 | Unload listeners, IndexedDB, or Cache-Control |

---

## 1. Root Cause Analysis

### JavaScript Execution (3.5s)

**Critical path on marketing homepage:**
```
HTML → Parse → Layout (Providers) → QueryClientProvider init → ThemeProvider → 
ConditionalAuthProvider → LocaleProvider → TooltipProvider → I18nProvider (i18n init) → 
MarketingHeader → HeroSection → ...
```

**Heavy modules loaded for a simple marketing page:**
- `@tanstack/react-query` (~40KB) – **Not needed on marketing**
- `i18next` + `react-i18next` (~80KB) – Needed but could be lighter
- `next-themes` – Theme detection runs synchronously
- Radix UI (TooltipProvider, Button, etc.) – Multiple chunks
- **Two toasters** (Toaster + Sonner) – Redundant; both load

### Unused JavaScript (1,082 KiB)

| Source | Est. Size | Fix |
|--------|-----------|-----|
| React Query | ~40KB | Conditional load for app routes only |
| recharts | ~150KB | Only on dashboard; lazy load |
| date-fns | Barrel imports | optimizePackageImports (done) |
| lucide-react | Per-icon | optimizePackageImports (done) |
| Duplicate toasters | ~30KB | Use one; remove Sonner or Toaster |
| i18next | ~80KB | Consider next-intl for RSC |

### Back/Forward Cache (3 failures)

Common causes in Next.js apps:
1. **`beforeunload` / `unload` listeners** – Extensions or analytics
2. **IndexedDB** – Supabase, React Query persistence
3. **Cache-Control: no-store** – API routes or middleware
4. **`window.open()` / `window.close()`** – OAuth flows

---

## 2. Optimization Strategy

### Phase 1: Quick Wins (Est. 300–400 KiB savings)

#### A. Conditional QueryClientProvider

**Before:** QueryClient loads on every page.
```tsx
// Providers.tsx - BEFORE
return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>...</ThemeProvider>
  </QueryClientProvider>
);
```

**After:** Load only on app routes.
```tsx
// Providers.tsx - AFTER
const APP_ROUTES = ['/dashboard', '/profile', '/matches', ...];

export function Providers({ children }) {
  const pathname = usePathname();
  const needsQuery = APP_ROUTES.some(r => pathname?.includes(r));

  const content = (
    <ThemeProvider>
      <ConditionalAuthProvider>
        <LocaleProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </LocaleProvider>
      </ConditionalAuthProvider>
    </ThemeProvider>
  );

  return needsQuery ? (
    <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>
  ) : (
    content
  );
}
```

**Savings:** ~40KB on marketing pages.

#### B. Toaster Consolidation (Future)

**Note:** App uses both Radix Toaster (for `toast()` from use-toast) and Sonner (Settings, BillingSection). Consolidating would require migrating all toast calls to one API. Deferred.

#### C. Lazy LanguageSwitcher

**Before:** Static import in MarketingHeader.
```tsx
import LanguageSwitcher from '@/components/LanguageSwitcher';
```

**After:** Dynamic import.
```tsx
const LanguageSwitcher = dynamic(() => import('@/components/LanguageSwitcher'), {
  ssr: false,
  loading: () => <div className="w-16 h-8 rounded-lg bg-muted animate-pulse" />,
});
```

**Savings:** Defers ~5KB; reduces main-thread work.

#### D. Font Preload Tuning

**Before:** `preload: true` for primary font.
```tsx
const dmSans = DM_Sans({
  preload: true,  // Blocks first paint
  ...
});
```

**After:** Defer on mobile.
```tsx
const dmSans = DM_Sans({
  preload: typeof window !== 'undefined' && window.innerWidth > 768,
  display: 'swap',
  ...
});
```

Or simply `preload: false` – browser will still load it; LCP image gets priority.

---

### Phase 2: Route Groups (Est. 400–500 KiB savings)

**Structure:**
```
app/[locale]/
  (marketing)/          ← Minimal bundle
    layout.tsx         ← MarketingLayout: no QueryClient, lighter providers
    page.tsx
    about/
    pricing/
  (app)/               ← Full bundle
    layout.tsx         ← AppLayout: QueryClient, Auth
    dashboard/
    profile/
```

**Marketing layout:**
```tsx
// app/[locale]/(marketing)/layout.tsx
export default function MarketingLayout({ children }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <I18nProvider locale={locale} dictionary={dictionary}>
          <TooltipProvider>{children}</TooltipProvider>
        </I18nProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
```

**App layout:**
```tsx
// app/[locale]/(app)/layout.tsx
export default function AppLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <LocaleProvider>
            <I18nProvider locale={locale} dictionary={dictionary}>
              <TooltipProvider>{children}</TooltipProvider>
            </I18nProvider>
          </LocaleProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

---

### Phase 3: Reduce Main-Thread Work

#### A. Defer Non-Critical Hydration

```tsx
// Use React's useDeferredValue or startTransition for below-fold content
import { useDeferredValue } from 'react';

function HomePage() {
  const deferredSections = useDeferredValue(
    <Suspense fallback={null}>
      <HowItWorksSection />
      <FAQSection />
    </Suspense>
  );
  return (
    <main>
      <HeroSection />
      {deferredSections}
    </main>
  );
}
```

#### B. Chunk Long Tasks

Break up i18n init:
```tsx
// Use requestIdleCallback for non-critical init
useEffect(() => {
  const id = requestIdleCallback(() => {
    // Load secondary locale in background
    loadLocale('en');
  }, { timeout: 2000 });
  return () => cancelIdleCallback(id);
}, []);
```

---

### Phase 4: BFCache Fixes

1. **Audit unload listeners:**
```bash
# In Chrome DevTools Console
getEventListeners(window).unload
getEventListeners(window).beforeunload
```

2. **Check Cache-Control:** Ensure API routes don't send `no-store` for static data.

3. **Supabase/IndexedDB:** If using persistence, consider `unload` cleanup:
```tsx
useEffect(() => {
  return () => {
    // Don't block BFCache with long cleanup
  };
}, []);
```

4. **Next.js:** Ensure no `router.events` or `beforePopState` that prevent BFCache.

---

## 3. Before/After Code Snippets

### MarketingHeader – Lazy LanguageSwitcher

```tsx
// BEFORE
import LanguageSwitcher from '@/components/LanguageSwitcher';
// ...
<LanguageSwitcher className="ml-2" />

// AFTER
const LanguageSwitcher = dynamic(
  () => import('@/components/LanguageSwitcher'),
  { ssr: false, loading: () => <span className="w-16 h-8" /> }
);
```

### Providers – Conditional QueryClient

```tsx
// BEFORE: Always loads React Query
<QueryClientProvider client={queryClient}>
  {children}
</QueryClientProvider>

// AFTER: Only on app routes
{needsQuery ? (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
) : (
  children
)}
```

### next.config.js – Bundle Analysis

```js
// Add to next.config.js for analysis
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer(nextConfig);
// Run: ANALYZE=true npm run build
```

---

## 4. Verification Tools

### React Profiler

```tsx
// app/layout.tsx or providers
import { Profiler } from 'react';

<Profiler
  id="root"
  onRender={(id, phase, actualDuration) => {
    if (actualDuration > 16) {
      console.warn(`Slow render: ${id} took ${actualDuration}ms`);
    }
  }}
>
  {children}
</Profiler>
```

### Chrome DevTools

1. **Performance:** Record load → filter "Long Tasks" (>50ms)
2. **Coverage:** Cmd+Shift+P → "Coverage" → reload → see unused JS %
3. **Network:** Disable cache, throttle "Fast 3G", check waterfall

### Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
- uses: treosh/lighthouse-ci-action@v10
  with:
    urls: |
      https://staging.example.com/de
    uploadArtifacts: true
    configPath: ./lighthouserc.json
```

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "settings": { "preset": "mobile" }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.7}],
        "interactive": ["error", {"maxNumericValue": 3000}]
      }
    }
  }
}
```

---

## 5. Implementation Priority

| Priority | Action | Est. Impact |
|----------|--------|-------------|
| P0 | Conditional QueryClientProvider | -40KB, -0.3s TBT |
| P0 | Remove duplicate toaster | -20KB |
| P1 | Lazy LanguageSwitcher | -0.1s TBT |
| P1 | Font preload: false | -90ms render blocking |
| P2 | Route groups (marketing) | -400KB on homepage |
| P2 | Bundle analyzer audit | Identify remaining bloat |
| P3 | BFCache audit | Fix 3 failures |
| P3 | Lighthouse CI | Prevent regressions |
