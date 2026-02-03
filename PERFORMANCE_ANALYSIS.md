# Next.js Performance Architecture Analysis

## Executive Summary

| Metric | Current | Target | Root Cause |
|--------|---------|--------|------------|
| **LCP** | 16.8s | <2.5s | Client-only rendering blocks LCP image; I18nProvider gates entire tree |
| **TBT** | 2,520ms | <200ms | Heavy client bundle (i18next, React Query, Radix) on main thread |
| **JS Execution** | 3.8s | <1.5s | Synchronous init of i18n, QueryClient, theme; no streaming |
| **Unused JS** | 1,100 KiB | <300 KiB | Barrel imports, no route-level splitting for marketing |
| **Network Payload** | 2,711 KiB | <1,500 KiB | Full app bundle loaded for marketing homepage |

---

## 1. Root Cause Analysis

### LCP (16.8s) – Critical Path Blockers

**Problem:** The LCP element (hero image) is inside a component tree that only renders after:
1. Layout → Providers (client) → I18nProvider (client)
2. I18nProvider loads locale JSON (~50KB) and initializes i18next
3. I18nProvider returns `null` or LoadingFallback until `isReady`
4. **Children never render until step 2 completes** → LCP delayed by full JS parse + i18n init

**Current flow:**
```
Request → HTML shell → [BLOCKED] Providers hydrate → I18nProvider useEffect → loadLocale() → init i18n → setIsReady → children render → LCP image paints
```

**Fix applied:** `HeroImageServer` renders the image on the server. However, `HeroSection` is imported by the page, and the page is wrapped by `I18nProvider`. The layout structure is:

```
Layout → Providers → I18nProvider (returns null until ready) → children (page)
```

So **the entire page (including HeroSection) is still gated by I18nProvider**. The HeroImageServer is inside HeroSection, which is inside the page, which is inside I18nProvider. Until I18nProvider is ready, nothing renders.

**Architectural fix needed:** Move the LCP image **outside** the I18nProvider tree, or make I18nProvider non-blocking (render children with a loading overlay instead of returning null).

### TBT (2,520ms) – Main Thread Blockers

**Root causes:**
1. **i18next + react-i18next** (~80KB) – Parsed and executed before any content
2. **@tanstack/react-query** (~40KB) – Loaded on every page including marketing
3. **Radix UI** (TooltipProvider, Button, etc.) – Multiple chunks
4. **next-themes** – Theme detection runs on mount
5. **13 long tasks** – Likely from React hydration of large tree + i18n init

**Anti-pattern:** All providers are in the root layout. Marketing pages don't need React Query, but it loads anyway.

### Unused JavaScript (1,100 KiB)

**Sources:**
- **lucide-react** – Importing full icons; `optimizePackageImports` helps but may not cover all
- **recharts** – Only needed on dashboard, loads on homepage
- **date-fns** – Tree-shakeable but barrel imports can pull extra
- **Radix UI** – Each primitive is a chunk; unused ones may still load
- **i18next** – Full lib loads even for single locale

### Render-Blocking (90ms)

- **next/font** – DM_Sans with `preload: true` blocks first paint
- **globals.css** – Tailwind output; consider critical CSS extraction

---

## 2. Code-Level Fixes

### Fix 1: Move LCP Image Outside I18nProvider Gate

**Current (problematic):**
```tsx
// app/[locale]/layout.tsx
return (
  <Providers>
    <I18nProvider locale={locale}>  {/* BLOCKS everything until ready */}
      {children}  {/* Page with HeroSection never renders until i18n ready */}
    </I18nProvider>
  </Providers>
);
```

**Solution A – Render shell immediately, hydrate i18n in parallel:**
```tsx
// I18nProvider: Don't block children, show loading overlay instead
if (!isReady) {
  return (
    <>
      {children}  {/* Render immediately - LCP image in HeroImageServer can paint */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center" aria-hidden={isReady}>
        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    </>
  );
}
```

**Solution B – Split layout: LCP above the fold outside provider:**
```tsx
// app/[locale]/page.tsx – Server component
export default function HomePage() {
  return (
    <>
      {/* LCP image - server rendered, no I18nProvider needed */}
      <HeroImageServer />
      {/* Rest of page - client, needs i18n */}
      <I18nBoundary>
        <MarketingHeader />
        <HeroContentClient />
        {/* ... */}
      </I18nBoundary>
    </>
  );
}
```

### Fix 2: Conditional Providers for Marketing Routes

**Current:** QueryClientProvider loads on every page.

**After:**
```tsx
// src/providers/Providers.tsx
'use client';

import { usePathname } from 'next/navigation';

const APP_ROUTES = ['/dashboard', '/profile', '/matches', '/chat', ...];

export function Providers({ children }) {
  const pathname = usePathname();
  const needsQuery = APP_ROUTES.some(r => pathname?.includes(r));

  return (
    <ThemeProvider ...>
      <ConditionalAuthProvider>
        <LocaleProvider>
          {needsQuery ? (
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>{children}</TooltipProvider>
            </QueryClientProvider>
          ) : (
            <TooltipProvider>{children}</TooltipProvider>
          )}
        </LocaleProvider>
      </ConditionalAuthProvider>
    </ThemeProvider>
  );
}
```

**Savings:** ~40KB (React Query) on marketing pages.

### Fix 3: Lazy Load i18next for Marketing

**Current:** i18next + react-i18next load synchronously in I18nProvider.

**Alternative – next-intl or simple JSON context for marketing:**
```tsx
// For marketing pages only: skip i18next, use simple context
// src/providers/SimpleI18nProvider.tsx
'use client';

const dictionaries = { en: enJson, de: deJson }; // Static import at build time

export function SimpleI18nProvider({ locale, children }) {
  const t = useCallback((key) => {
    const [ns, k] = key.split('.');
    return dictionaries[locale]?.[ns]?.[k] ?? key;
  }, [locale]);
  return <I18nContext.Provider value={{ t, locale }}>{children}</I18nContext.Provider>;
}
```

Use `SimpleI18nProvider` for marketing, full `I18nProvider` for app routes. Saves ~80KB on homepage.

### Fix 4: Dynamic Import Heavy Components

**MarketingHeader** – Consider making it a server component for the static shell, with client-only parts (menu, LanguageSwitcher) as separate dynamic imports:

```tsx
// MarketingHeader.tsx
const LanguageSwitcher = dynamic(() => import('./LanguageSwitcher'), { ssr: false });
```

### Fix 5: Font Loading Strategy

**Current:** `preload: true` for DM_Sans blocks.

**After:**
```tsx
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  preload: false,  // Let browser prioritize LCP image
  adjustFontFallback: true,
});
```

---

## 3. Architectural Recommendations

### Use Route Groups for Bundle Splitting

```
app/[locale]/
  (marketing)/     ← Lighter bundle: no React Query, no Auth
    page.tsx
    layout.tsx     ← MarketingLayout with minimal providers
  (app)/           ← Full bundle
    layout.tsx     ← AppLayout with QueryClient, Auth
    dashboard/
```

### Streaming and Partial Hydration

- Use `loading.tsx` with a **skeleton** that matches LCP (hero image placeholder)
- Use `Suspense` with `fallback` that includes the LCP image as a static `<img>` so it paints before React hydrates

### next/font, next/image, Code Splitting

| Practice | Status | Action |
|----------|--------|--------|
| next/font | ✅ Used | Set `preload: false` for primary font on mobile |
| next/image | ✅ Used | Ensure `priority` + `fetchPriority="high"` on LCP image |
| Route-level splitting | ⚠️ Partial | Split (marketing) vs (app) layouts |
| Dynamic imports | ✅ Used | Expand to LanguageSwitcher, Footer, etc. |

---

## 4. Anti-Patterns to Avoid

| Anti-Pattern | Impact | Fix |
|--------------|--------|-----|
| **Provider waterfall** | I18nProvider blocks entire tree | Render children immediately, overlay loading |
| **Barrel imports** | `import { X } from 'package'` pulls unused code | Use `optimizePackageImports`; import from subpaths |
| **Client components at root** | Providers, layout all client | Keep layout server; colocate client only where needed |
| **Synchronous i18n init** | Blocks first paint | Use server-rendered dictionary or lazy init |
| **Single bundle for all routes** | Marketing loads app code | Route groups + conditional providers |
| **Two toasters** | Toaster + Sonner both load | Use one; defer both |

---

## 5. Verification Tools

### Chrome DevTools

1. **Performance tab:** Record page load, filter by "Long Tasks" (>50ms)
2. **Coverage tab:** Identify unused JS/CSS (Cmd+Shift+P → "Coverage")
3. **Network:** Disable cache, throttle "Fast 3G", check waterfall

### React Profiler

```tsx
// Wrap app in Profiler
import { Profiler } from 'react';

<Profiler id="app" onRender={(id, phase, actualDuration) => {
  if (actualDuration > 16) console.warn(`Slow render: ${id} ${actualDuration}ms`);
}}>
  {children}
</Profiler>
```

### Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
- uses: treosh/lighthouse-ci-action@v9
  with:
    urls: |
      https://staging.example.com/de
    uploadArtifacts: true
    budgetPath: ./lighthouse-budget.json
```

### Budget File (lighthouse-budget.json)

```json
{
  "path": "/*",
  "resourceSizes": [
    { "resourceType": "script", "budget": 500 },
    { "resourceType": "stylesheet", "budget": 50 }
  ],
  "resourceCounts": [
    { "resourceType": "script", "budget": 20 }
  ]
}
```

---

## 6. Priority Action List

1. **P0 – LCP:** Make I18nProvider non-blocking (render children + overlay) OR move HeroImageServer to a layout that doesn't depend on I18nProvider
2. **P0 – TBT:** Conditional QueryClientProvider for marketing routes
3. **P1:** Route groups `(marketing)` vs `(app)` with separate layouts
4. **P1:** `preload: false` for primary font
5. **P2:** Replace i18next with lightweight solution for marketing
6. **P2:** Audit and remove duplicate toasters (Toaster vs Sonner)
7. **P3:** Lighthouse CI in pipeline
8. **P3:** Consider React Compiler (when stable) for automatic memoization
