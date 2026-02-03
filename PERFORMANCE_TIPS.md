# Performance Tips (Lighthouse 90+)

## Fix 404: Use the Correct URL

**Lighthouse 404 = wrong URL or server not running.**

- **Correct URL:** `http://localhost:3000/de` or `http://localhost:3000/en`
- **Wrong:** `http://localhost:3000` (redirects), `http://localhost:3000/` (redirects)
- **Always test:** `http://localhost:3000/de` directly

## Critical: Test in Incognito

**Chrome extensions can add 1–2 seconds to TBT.** Run Lighthouse in Incognito for accurate scores.

## Steps to Test

1. **Build and start:**
   ```bash
   npm run build
   npm run start
   ```

2. **Open Incognito** → go to `http://localhost:3000/de`

3. **Run Lighthouse** (Mobile, Production mode)

4. **Re-optimize hero** (if LCP is still slow):
   ```bash
   npm run optimize:hero
   npm run build
   ```

## Current Optimizations

- Hero in initial HTML (no Suspense streaming)
- Native `<img>` for hero (no next/image JS)
- Theme script deferred to `requestIdleCallback`
- Hero preload + srcset
- Fonts: `display: optional`
- No blur on mobile
- Cache headers for images
