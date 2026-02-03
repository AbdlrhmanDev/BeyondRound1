# Performance Tips (Lighthouse 90+)

## Fix 404: Use the Correct URL

**Lighthouse 404 = wrong URL or server not running.**

- **Correct URL:** `http://localhost:3000/de` or `http://localhost:3000/en`
- **Wrong:** `http://localhost:3000` (redirects), `http://localhost:3000/` (redirects)
- **Always test:** `http://localhost:3000/de` directly

## Document Request Latency (TTFB ~1400ms)

**"Server responded slowly"** – TTFB is usually high when:

1. **Testing on `npm run dev`** – Dev server is slow. Use `npm run build && npm run start` for realistic metrics.
2. **First request (cold start)** – On Vercel, the first request after deploy/idle can be slow. Subsequent requests are fast (Edge cache).
3. **Wrong region** – Deploy on Vercel in a region close to your users.

**Applied:** Middleware uses `runtime = 'edge'` for faster cold starts. Marketing pages use `force-static` for CDN caching.

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
