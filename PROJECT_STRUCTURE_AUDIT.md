
# Project Structure Audit

## Summary

| Directory | Used | Unused | Action |
|-----------|------|--------|--------|
| **src/pages/** | 0 | 8 files | DELETE ALL |
| **pages/** | 0 | 2 files | DELETE ALL |
| **src/views/** | 31 | 2 | Delete Index.tsx, AuthCallback.tsx |
| **src/services/** | 24 | 1 | Delete botService.ts |
| **src/components/** | 19 | 24 | Delete old marketing + dead code |
| **servy/** | ALL | 0 | KEEP (Stripe webhook service) |
| **scripts/** | ALL | 0 | KEEP (Build utilities) |

---

## 🔴 DELETE IMMEDIATELY (Phase 1)

### src/pages/ - COMPLETE DUPLICATES (DELETE ALL)
```
src/pages/Chat.tsx          ← Duplicate of src/views/Chat.tsx
src/pages/GroupChat.tsx     ← Duplicate of src/views/GroupChat.tsx
src/pages/NotFound.tsx      ← Duplicate of src/views/NotFound.tsx
src/pages/Onboarding.tsx    ← Duplicate of src/views/Onboarding.tsx
src/pages/PublicProfile.tsx ← Duplicate of src/views/PublicProfile.tsx
src/pages/Settings.tsx      ← Duplicate of src/views/Settings.tsx
src/pages/Terms.tsx         ← Duplicate of src/views/Terms.tsx
src/pages/Waitlist.tsx      ← Duplicate of src/views/Waitlist.tsx
```

### pages/ - LEGACY STUBS (DELETE ALL)
```
pages/_app.tsx              ← Pages Router stub, not used
pages/_document.tsx         ← Pages Router stub, not used
```

### src/views/ - ORPHANED FILES
```
src/views/Index.tsx         ← Replaced by server-side homepage
src/views/AuthCallback.tsx  ← Unused auth callback (verify first)
```

### src/services/ - UNUSED SERVICE
```
src/services/botService.ts  ← 0 imports, feature not integrated
```

---

## 🟡 DELETE IF SAFE (Phase 2)

### Old Marketing Components (Replaced by Server Versions)
```
REPLACED BY:                              DELETE:
src/components/marketing/AboutSectionServer.tsx    ← src/components/AboutSection.tsx
src/components/marketing/CTASectionServer.tsx      ← src/components/CTASection.tsx
src/components/marketing/FAQSectionServer.tsx      ← src/components/FAQSection.tsx
src/components/marketing/HowItWorksSectionServer.tsx ← src/components/HowItWorksSection.tsx
src/components/marketing/HeroSectionServer.tsx     ← src/components/HeroSection.tsx
src/components/marketing/MarketingHeaderServer.tsx ← src/components/MarketingHeader.tsx
```

### Other Unused Components (0 imports - verified)
```
src/components/ClientOnly.tsx
src/components/CookieConsent.tsx
src/components/DeferredAnalytics.tsx
src/components/ErrorBoundary.tsx
src/components/FeatureGate.tsx
src/components/FeedbackButton.tsx
src/components/GroupEvaluationSurvey.tsx
src/components/HeroContentClient.tsx
src/components/HeroOverlays.tsx
src/components/HeroServer.tsx
src/components/HeroSkeleton.tsx
src/components/LocaleLayout.tsx
src/components/NavLink.tsx
src/components/PricingSection.tsx
src/components/ProtectedRoute.tsx
src/components/RedirectToLocale.tsx
src/components/ThemeSync.tsx
src/components/WebIcon.tsx
```

### Keep (Actually Used)
```
src/components/HeroSection.tsx     ← 1 import (used)
src/components/ToasterOnlyLayout.tsx ← 2 imports (used)
src/components/MeetupCard.tsx      ← New feature, keep for booking
```

---

## 🟢 ACTIVELY USED (DO NOT DELETE)

### app/ - All 45+ Pages
```
app/[locale]/(marketing)/   ← Landing pages (About, FAQ, Pricing, Terms, etc.)
app/[locale]/(app)/         ← App pages (Dashboard, Matches, Chat, Events, etc.)
app/[locale]/(admin)/       ← Admin pages (Overview, Users, Matches, etc.)
app/[locale]/(auth)/        ← Auth pages (Login, Register, Onboarding, etc.)
app/api/                    ← API routes (OG images, events, neighborhoods)
```

### src/views/ - 31 Active Views
```
✓ About.tsx, Auth.tsx, Chat.tsx, ChatList.tsx, Contact.tsx, Dashboard.tsx
✓ Events.tsx, FAQ.tsx, ForDoctors.tsx, ForgotPassword.tsx, GroupChat.tsx
✓ Interests.tsx, LearnMore.tsx, Matches.tsx, NotFound.tsx, Onboarding.tsx
✓ PlaceSuggestions.tsx, Pricing.tsx, Privacy.tsx, Profile.tsx
✓ PublicProfile.tsx, Settings.tsx, Survey.tsx, Terms.tsx, Waitlist.tsx
✓ Admin: AdminAuditLogs, AdminEvents, AdminFeedback, AdminMatches, AdminOverview, AdminUsers, AdminVerification
✓ BookingFlow.tsx
```

### src/services/ - 24 Active Services
```
✓ profileService.ts (12 imports)
✓ onboardingService.ts (10 imports)
✓ storageService.ts (8 imports)
✓ eventService.ts (7 imports)
✓ matchService.ts (6 imports)
✓ adminService.ts, conversationService.ts (5 imports each)
✓ messageService.ts (4 imports)
✓ notificationService.ts, settingsService.ts (3 imports each)
✓ feedbackService.ts, waitlistService.ts (2 imports each)
✓ contactService, evaluationService, locationService, matchDetailsService
✓ placeService, subscriptionService, surveyService, userService
✓ domains/ (4 domain barrel exports)
```

### src/components/ - 19 Active Root Components
```
✓ DashboardLayout.tsx (9 imports)
✓ LocalizedLink.tsx (24 imports)
✓ BillingSection, CalculateScoreBadge, ChatEmptyState, Header
✓ LanguageSwitcher, LocationSelect, ImageViewer, Redirect
✓ DeferredSpeedInsights, EmailNotificationsToggle, HeroImageServer
✓ IdleDefer, MatchCountdown, NotificationPopover, SmartFeedback
```

### src/components/marketing/ - All 14 Server Components
```
✓ HeroSectionServer, HowItWorksSectionServer, CTASectionServer
✓ AboutSectionServer, FAQSectionServer, MarketingHeaderServer
✓ LanguageLinks, FooterSmall, MarketingMobileMenu, etc.
```

### src/hooks/ - All 11 Hooks
```
✓ useAdminCheck, useAuth, useAuthNext, useLocalizedNavigate
✓ useMatchDetails, useMatches, useMatchTimer, usePlanFeatures
✓ useSubscription, use-mobile, use-toast
```

### servy/ - Stripe Webhook Service (KEEP)
```
✓ servy/api/stripe-webhook.ts    ← Webhook receiver
✓ servy/api/stripe-checkout.ts   ← Checkout handler
✓ servy/api/stripe-cancel.ts     ← Cancellation handler
✓ servy/vercel.json              ← Deployment config
```

### scripts/ - Build Scripts (KEEP)
```
✓ clean-next.js           ← Cache cleanup
✓ generate-pwa-icons.mjs  ← PWA icons
✓ optimize-hero.mjs       ← Image optimization
```

---

## Architecture Notes

### What Works Well
- ✓ Clean App Router structure
- ✓ Views separate from components (src/views/ for pages)
- ✓ Server components for marketing (better performance)
- ✓ Domain-organized services
- ✓ Proper locale-based routing
- ✓ Separate Stripe service (servy/)

### What Needs Cleanup
- ✗ src/pages/ is 100% duplicate code - delete entire folder
- ✗ 24 unused components in src/components/ root
- ✗ Old client-side marketing components still exist alongside new server versions
- ✗ botService.ts created but never integrated

---

## Cleanup Commands

```bash
# Phase 1: Delete confirmed unused files
rm -rf src/pages/
rm -rf pages/
rm src/views/Index.tsx
rm src/services/botService.ts

# Phase 2: Delete old marketing components (verified 0 imports)
rm src/components/AboutSection.tsx
rm src/components/CTASection.tsx
rm src/components/FAQSection.tsx
rm src/components/HowItWorksSection.tsx
rm src/components/MarketingHeader.tsx

# Phase 2: Delete other unused components (verified 0 imports)
rm src/components/ClientOnly.tsx
rm src/components/CookieConsent.tsx
rm src/components/DeferredAnalytics.tsx
rm src/components/ErrorBoundary.tsx
rm src/components/FeatureGate.tsx
rm src/components/FeedbackButton.tsx
rm src/components/GroupEvaluationSurvey.tsx
rm src/components/HeroContentClient.tsx
rm src/components/HeroOverlays.tsx
rm src/components/HeroServer.tsx
rm src/components/HeroSkeleton.tsx
rm src/components/LocaleLayout.tsx
rm src/components/NavLink.tsx
rm src/components/PricingSection.tsx
rm src/components/ProtectedRoute.tsx
rm src/components/RedirectToLocale.tsx
rm src/components/ThemeSync.tsx
rm src/components/WebIcon.tsx
```

---

## Estimated Cleanup Impact

| Metric | Before | After |
|--------|--------|-------|
| Files | ~150+ | ~110 |
| Dead Code | ~3,000 LOC | 0 LOC |
| Duplicate Code | ~2,500 LOC | 0 LOC |
| Component Clarity | 44% used | 100% used |
