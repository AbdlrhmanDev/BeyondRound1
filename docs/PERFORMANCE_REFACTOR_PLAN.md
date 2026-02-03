# خطة Refactor متقدمة – الهدف: Lighthouse 90+

## 📊 تحليل الأسباب الجذرية

### 1. TBT = 3,590ms (الهدف: <300ms)

| السبب | التأثير | الحل |
|-------|---------|------|
| **Providers Client Tree** | ~800ms | ThemeProvider + LocaleProvider + usePathname تُنفذ على كل صفحة |
| **MarketingHeaderClient** | ~400ms | useState + dynamic(LanguageSwitcher) + lucide-react |
| **Hydration** | ~1,200ms | كل Client Component يُعاد تنفيذه |
| **ConditionalAuthProvider** | ~200ms | يتحقق من pathname في كل render |
| **next-themes** | ~300ms | يقرأ system preference ويطبق theme |
| **LocaleProvider** | ~400ms | usePathname + useRouter + useMemo |

### 2. JS Execution = 4.9s

- **React + Hydration**: ~1.5s
- **next-themes**: ~0.4s
- **Radix UI** (عند تحميل LanguageSwitcher/FAQ): ~0.8s
- **lucide-react**: ~0.3s
- **LocaleContext + Providers**: ~0.5s
- **باقي الـ chunks**: ~1.4s

### 3. Unused JS = 1.1MB

- Radix UI components غير مستخدمة على marketing (accordion, tooltip, dialog...)
- react-query (غير محمّل على marketing لكن قد يكون في shared chunk)
- i18next (مشروط – جيد)
- مكتبات app routes تُضمّن في الـ main bundle

### 4. BFCache Failures (4 أسباب)

أسباب شائعة:
1. **IndexedDB** – Supabase/React Query قد يفتحون اتصالات
2. **Cache API** – Service Worker أو fetch caching
3. **BroadcastChannel** – بعض المكتبات تستخدمه
4. **requestAnimationFrame** – Providers يستخدم rAF في useEffect

---

## 🎯 خطة التحويل إلى Server Components

### أولوية 1: Marketing Layout منفصل

```
الوضع الحالي:
RootLayout → LocaleLayout (Providers) → MarketingLayout → Page

المشكلة: Providers يُحمّل على كل صفحة بما فيها marketing
```

**الحل: Route Groups مع Providers منفصلة**

```
app/
  [locale]/
    layout.tsx          ← Server فقط: metadata, fonts
    (marketing)/
      layout.tsx        ← MarketingLayout: لا Providers
      page.tsx
    (app)/
      layout.tsx        ← AppLayout: Providers + Auth
      dashboard/
```

**التنفيذ:** إنشاء `(marketing)` layout لا يستخدم Providers. الصفحة التسويقية تحتاج فقط:
- ThemeProvider (للـ dark mode) – يمكن استخدام CSS `prefers-color-scheme` فقط
- أو ThemeProvider خفيف جداً

### أولوية 2: مكونات للتحويل إلى Server

| المكون | الحالة | الإجراء |
|--------|--------|---------|
| HeroSectionServer | ✅ Server | — |
| HowItWorksSectionServer | ✅ Server | — |
| CTASectionServer | ✅ Server | — |
| FooterServer | ✅ Server | — |
| AboutSection | ✅ Server | — |
| MarketingHeaderClient | ⚠️ Client | تحويل الجزء الثابت إلى Server، والإبقاء على Client للقائمة فقط |
| FAQSectionClient | ⚠️ Client | ssr: false ✅ – تأجيل كامل |
| LanguageSwitcher | ⚠️ Client | تحويل إلى روابط بسيطة `/en`, `/de` بدون JS |

### أولوية 3: Marketing بدون Providers

**الفكرة:** الصفحة التسويقية لا تحتاج:
- QueryClient
- AuthProvider
- I18nProvider (مطبّق ✅)
- TooltipProvider (مطبّق ✅)
- LocaleProvider – **مشكلة:** LanguageSwitcher يحتاجه

**الحل للـ LanguageSwitcher:** استبداله بروابط HTML عادية:
```tsx
// Server Component
<div className="flex gap-1">
  <Link href={`/en${path}`}>EN</Link>
  <Link href={`/de${path}`}>DE</Link>
</div>
```
لا حاجة لـ `setLocaleAndNavigate` – التنقل يكفي.

---

## 📦 استخدام next/dynamic و next/font و next/image

### next/dynamic – التطبيق

```tsx
// ❌ قبل: تحميل فوري
import { Chart } from '@/components/Chart';

// ✅ بعد: تأجيل حتى الظهور
const Chart = dynamic(() => import('@/components/Chart'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
```

**مثال عملي – تقسيم مكون ضخم:**

```tsx
// ❌ قبل: Dashboard.tsx (ضخم)
'use client';
import { Chart } from '@/components/Chart';      // recharts ~200KB
import { DataTable } from '@/components/DataTable'; // tanstack-table
import { MatchCards } from '@/components/MatchCards';

export function Dashboard() {
  return (
    <>
      <Chart data={data} />
      <DataTable data={tableData} />
      <MatchCards matches={matches} />
    </>
  );
}
```

```tsx
// ✅ بعد: تحميل تدريجي
'use client';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('@/components/Chart'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted rounded" />,
});

const DataTable = dynamic(() => import('@/components/DataTable'), {
  ssr: false,
  loading: () => <TableSkeleton />,
});

const MatchCards = dynamic(() => import('@/components/MatchCards'), {
  loading: () => <CardsSkeleton />,
});

export function Dashboard({ data, tableData, matches }) {
  return (
    <>
      <Chart data={data} />
      <DataTable data={tableData} />
      <MatchCards matches={matches} />
    </>
  );
}
```

### next/font – الوضع الحالي

```tsx
// ✅ مطبّق
const dmSans = DM_Sans({
  subsets: ['latin'],
  preload: true,  // للـ LCP
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  preload: false,  // تأجيل الثانوي
});
```

**تحسين:** تحميل `Space_Grotesk` فقط عند الحاجة (مثلاً للعناوين):

```tsx
// تحميل font-display فقط في الصفحات التي تحتاجها
```

### next/image – التحقق

```tsx
// HeroImageServer – ✅ يستخدم next/image
<Image
  src="/hero-doctors-friendship-mobile.webp"
  priority
  fetchPriority="high"
  sizes="(max-width: 768px) 100vw, 500px"
/>
```

**تأكد من:** جميع الصور في الصفحة تستخدم `next/image` مع `sizes` صحيح.

---

## 🛠 خطة Refactor خطوة بخطوة

### المرحلة 1: تقليل JS على Marketing (أسبوع 1)

| # | المهمة | التأثير المتوقع |
|---|--------|-----------------|
| 1 | **Marketing Route بدون Providers** | -400ms TBT |
| 2 | **LanguageSwitcher → روابط HTML** | -150ms TBT |
| 3 | **تأجيل Header بالكامل** (dynamic مع loading) | -300ms TBT |
| 4 | **إزالة next-themes من marketing** (استخدام CSS فقط) | -300ms TBT |

### المرحلة 2: Route-level Code Splitting (أسبوع 2)

| # | المهمة | التأثير |
|---|--------|---------|
| 1 | فصل `(marketing)` و `(app)` layouts | تقليل shared bundle |
| 2 | dynamic لكل صفحة app (Dashboard, Chat, etc.) | TBT منخفض لكل route |
| 3 | Lazy load recharts فقط في صفحات Charts | -200KB |

### المرحلة 3: BFCache (أسبوع 3)

| # | المهمة |
|---|--------|
| 1 | إزالة/تأجيل `requestAnimationFrame` في Providers |
| 2 | التحقق من Supabase – هل يفتح IndexedDB على marketing؟ |
| 3 | استخدام `pageshow` مع `event.persisted` لإعادة التهيئة عند العودة |

---

## 📈 أدوات التحليل

### 1. Bundle Analyzer

```bash
npm run analyze
# أو
ANALYZE=true npm run build
```

**ما تبحث عنه:**
- `_app` أو `main` – الحجم الكلي
- `node_modules` – أكبر المكتبات
- chunks مشتركة بين marketing و app

### 2. Chrome DevTools

**Performance tab:**
1. Record أثناء تحميل الصفحة
2. ابحث عن:
   - **Evaluate Script** – أي سكربت > 50ms
   - **Layout** – reflows كثيرة
   - **Recalculate Style** – CSS ثقيل

**Coverage tab:**
1. Ctrl+Shift+P → "Coverage"
2. Reload
3. انظر Unused bytes لكل ملف

### 3. Next.js Build Output

```bash
npm run build
```

راقب:
- `First Load JS` لكل route
- حجم الـ chunks

---

## 📋 Checklist قبل النشر

- [ ] `npm run analyze` – لا توجد مكتبات > 100KB في marketing bundle
- [ ] Lighthouse Performance ≥ 90 على `/en`
- [ ] TBT < 300ms
- [ ] جميع الصور تستخدم `next/image`
- [ ] لا يوجد `import _ from 'lodash'` – استخدم `lodash/debounce`
- [ ] لا يوجد `import moment` – استخدم `date-fns`
- [ ] BFCache يعمل (اختبار يدوي: back/forward)

---

## 🎯 النتيجة المتوقعة

| Metric | الحالي | الهدف | الإجراء |
|--------|--------|-------|---------|
| Score | 69 | 90+ | تنفيذ المرحلة 1+2 |
| TBT | 3,590ms | <300ms | Marketing بدون Providers |
| JS Exec | 4.9s | <1s | Route splitting + dynamic |
| Unused JS | 1.1MB | <400KB | Tree-shaking + lazy load |
| BFCache | ❌ | ✅ | إصلاح rAF و IndexedDB |
