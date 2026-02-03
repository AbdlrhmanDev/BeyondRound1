# تحسينات الأداء المطبقة – الهدف: Lighthouse 90+

## ✅ ما تم تنفيذه

### 1. نقل الصفحة الرئيسية إلى (marketing)
- **قبل:** `app/[locale]/page.tsx` كان مستقلاً مع تكرار MarketingHeader و Footer
- **بعد:** `app/[locale]/(marketing)/page.tsx` يستخدم نفس layout التسويق
- **الفائدة:** تقليل تكرار الكود، استخدام layout موحد، إمكانية تقسيم أفضل للحزم

### 2. إعداد Bundle Analyzer
- تثبيت `@next/bundle-analyzer` و `cross-env`
- إضافة سكربت: `npm run analyze`
- **الاستخدام:** `npm run analyze` لفتح تقرير تفصيلي بحجم كل مكتبة

### 3. إصلاح Admin Layout
- تصحيح استعلام الصلاحيات: الاعتماد على `user_roles` بدلاً من `profiles.role`

### 4. استبعاد مجلد servy من TypeScript
- إضافة `servy` إلى `tsconfig.json` exclude لتجنب تعارضات البناء

### 5. إعداد Lighthouse CI
- إنشاء `lighthouserc.json` لاختبار الأداء في CI
- **الاستخدام:** `npx @lhci/cli@0.13.x autorun` (بعد تثبيت lighthouse-ci)

---

## ✅ التحسينات السابقة (موجودة مسبقاً)

| التحسين | الحالة |
|---------|--------|
| Conditional QueryClientProvider | ✅ مطبق |
| ConditionalAuthProvider (Supabase فقط على app routes) | ✅ مطبق |
| Conditional I18nProvider (i18next فقط على app routes) | ✅ مطبق |
| Lazy LanguageSwitcher | ✅ مطبق |
| Font preload: true للـ DM_Sans (LCP) | ✅ مطبق |
| Server Components للـ Hero, HowItWorks, CTA, Footer | ✅ مطبق |
| Deferred Toasters | ✅ مطبق |
| Deferred Analytics | ✅ مطبق |
| Hero: Server LCP image + Server content | ✅ مطبق |
| optimizePackageImports (lucide-react, date-fns, recharts) | ✅ مطبق |

## ✅ تحسينات الجولة الأخيرة (66 → 90+)

| التحسين | التأثير |
|---------|---------|
| **Conditional TooltipProvider** | تخطي Radix Tooltip على marketing (~15KB) |
| **FAQSectionClient ssr: false** | تأجيل Accordion/Radix (~80KB) حتى يصل المستخدم للقسم |
| **Font preload: true** | تحسين LCP للنص (headline) |
| **Native buttons في Header** | إزالة Radix Button من الـ above-the-fold (~25KB) |

## ✅ تحسينات المرحلة النهائية (69 → 90+)

| التحسين | التأثير |
|---------|---------|
| **LanguageLinks** | استبدال LanguageSwitcher بروابط HTML (~40KB: LocaleContext + Radix Button) |
| **Conditional LocaleProvider** | تخطي LocaleProvider على marketing (~30KB) |
| **Deferred MarketingHeader** | تأجيل Header بـ dynamic + HeaderSkeleton (~200ms TBT) |
| **BFCache fix** | استبدال requestAnimationFrame بـ setTimeout في Providers |

## ✅ تحسينات TBT و Unused JS (68 → 90+)

| التحسين | التأثير |
|---------|---------|
| **Lazy provider wrappers** | QueryClientProvider, LocaleProvider, TooltipProvider تُحمّل فقط على app routes (~100KB+ توفير على marketing) |
| **CTASectionServer native links** | استبدال Button بـ روابط HTML لتجنب @radix-ui/react-slot على marketing (~15KB) |
| **Deferred toasters** | تأجيل Toaster/Sonner من 200ms إلى 600ms لتقليل TBT |
| **Route-based provider split** | Marketing layout: MarketingProviders فقط (ThemeProvider). App/Admin/Auth: Full Providers. توفير ~150KB+ على marketing |
| **Tailwind content** | تقليص content paths إلى app + src فقط (تقليل unused CSS) |
| **swcMinify** | تفعيل صريح لضغط JS |

## ✅ تحسينات تقليل Main-Thread و Unused JS (Lighthouse 7.2s → أقل)

| التحسين | التأثير |
|---------|---------|
| **Marketing: Toaster واحد فقط** | إزالة Sonner من التسويق؛ استخدام Radix Toaster فقط. توفير ~15–30KB وتقليل وقت تنفيذ JS |
| **تأجيل Toaster على التسويق إلى 1.5s** | تقليل المهام الطويلة على الـ main-thread (من 800ms إلى 1500ms) |
| **IdleDefer للـ FAQ** | تحميل قسم FAQ (Accordion/Radix) بعد requestIdleCallback لتقسيم المهام الطويلة وتحسين TBT |
| **optimizePackageImports: sonner** | استيراد أخف لـ sonner حيث يُستخدم |

## ✅ تحسينات إضافية (TBT 2,080ms / Unused JS 638 KiB)

| التحسين | التأثير |
|---------|---------|
| **prefetch={false} على روابط app** | منع Next.js من prefetch روابط onboarding/auth/learn-more → توفير ~400–600KB من تحميل حزم I18nProvider و Providers قبل النقر |
| **optimizePackageImports: Radix** | إضافة accordion, dialog, dropdown, popover, select, tabs, toast, tooltip لتقليل unused JS |
| **Cache-Control للصفحات الثابتة** | إضافة headers للصفحات التسويقية لدعم bfcache (تجنب no-store) |
| **Footer: prefetch=false لـ /survey** | منع prefetch حزمة (app) عند ظهور رابط "Take Quiz" في الـ footer |

### نصائح لاختبار Lighthouse بدقة
- استخدم **وضع التصفح الخاص (Incognito)** لتجنب تأثير الإضافات
- اختبر على **production build**: `npm run build && npm run start`
- استخدم URL الصحيح: `/de` أو `/en` (وليس `/`)
- أغلق التبويبات الأخرى لتقليل ضغط الذاكرة

---

## 📋 خطوات إضافية مقترحة لرفع الأداء فوق 90

### أولوية عالية
1. **توحيد Toaster** – استخدام Sonner أو Radix Toaster فقط (توفير ~20–30KB)
2. **تأجيل TooltipProvider** – تحميله فقط عند الحاجة (مثلاً عند فتح LanguageSwitcher)
3. **مراجعة i18next** – تقييم `next-intl` أو حل أخف للـ RSC

### أولوية متوسطة
4. **تحليل الحزم:** تشغيل `npm run analyze` وتحديد المكتبات الكبيرة
5. **ضغط الصور:** التأكد من استخدام `next/image` مع `sizes` و `priority` للـ LCP
6. **تقسيم صفحات App:** استخدام `dynamic(..., { ssr: false })` للمكونات الثقيلة (Chat, Dashboard charts)

### BFCache (5 failure reasons in Lighthouse)
- لم يتم العثور على `unload` أو `beforeunload` في الكود
- الأسباب المحتملة: Supabase (IndexedDB) على مسارات التطبيق، next-themes (localStorage)، أو امتدادات المتصفح
- الصفحات التسويقية لا تحمّل Supabase؛ تجنّب إضافة `Cache-Control: no-store` لصفحات HTML الثابتة
- لا يُنصح بإضافة مستمعي `unload`/`beforeunload` لأنها تمنع BFCache

---

## 🛠 أوامر مفيدة

```bash
# تحليل حجم الحزم
npm run analyze

# تنظيف .next وإعادة البناء
npm run clean
npm run build

# Lighthouse يدوياً (بعد npm run build && npm run start)
npx lighthouse http://localhost:3000/de --view --preset=perf
```

---

## ⚠ ملاحظات البناء

يوجد أخطاء TypeScript و prerender سابقة في المشروع:
- `UserBanDialog` / `UserEditDialog`: مشكلة في نوع `profiles` Update
- صفحات مثل Pricing, ForDoctors: `useParams()` يعيد `null` أثناء SSG
- PlaceSuggestions: `useAuth` خارج AuthProvider أثناء prerender

يُنصح بإصلاحها قبل النشر.
