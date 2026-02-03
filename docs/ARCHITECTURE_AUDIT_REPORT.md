# Architecture & SOLID Audit Report

**Project:** Connect Thrive (BeyondRounds) — Next.js / React  
**Audit Date:** February 3, 2025  
**Scope:** `src/` pages, services, hooks, components, utils

---

## 1. Summary Table

| Principle / Area | Status | Notes |
|------------------|--------|-------|
| **SRP (Single Responsibility)** | ⚠️ Partial | Onboarding.tsx (1586 lines) violates SRP; services follow SRP |
| **OCP (Open/Closed)** | ⚠️ Partial | Hardcoded question types in Onboarding; services extensible |
| **LSP (Liskov Substitution)** | ✅ Applied | Limited inheritance; no obvious LSP violations |
| **ISP (Interface Segregation)** | ❌ Violated | Duplicate `Profile` and `OnboardingPreferences` in pages vs services |
| **DIP (Dependency Inversion)** | ❌ Violated | 39 direct Supabase imports; no DB abstraction |
| **Component Size** | ⚠️ Partial | Onboarding 1586 lines; Dashboard 688 lines; others reasonable |
| **Separation of Concerns** | ⚠️ Partial | Service layer exists; pages still import Supabase directly |
| **Data Access Patterns** | ⚠️ Partial | Services used; 6 pages/components bypass services |
| **Error Handling** | ⚠️ Partial | Centralized `errorHandler.ts`; inconsistent usage |
| **Modularity** | ⚠️ Partial | Duplicate types; no barrel exports; no circular deps found |

---

## 2. SOLID Principles Evaluation

### 2.1 SRP (Single Responsibility Principle)

**Violated — Onboarding.tsx (1586 lines)**

`Onboarding.tsx` handles too many responsibilities:
- 20+ question definitions (data)
- Multi-step wizard state
- Personal info form
- Signup form + validation
- Avatar/license upload
- API calls (profile, preferences, storage, notifications)
- Progress UI, milestones, encouragement logic
- localStorage pending-data handling

```tsx
// src/pages/Onboarding.tsx — Lines 45–354: Questions data embedded in component
const questions: OnboardingQuestion[] = [
  { id: "specialty", title: "What's your specialty?", ... },
  // ... 20+ more questions
];
```

**Before (current):** One 1586-line file with mixed concerns.

**After (recommended):**

```tsx
// src/data/onboardingQuestions.ts
export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [ /* ... */ ];

// src/hooks/useOnboardingState.ts
export function useOnboardingState(userId: string | undefined) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoState>({});
  // ... state logic
  return { answers, setAnswers, personalInfo, setPersonalInfo, ... };
}

// src/components/onboarding/PersonalInfoStep.tsx
export function PersonalInfoStep({ value, onChange, ... }) { /* ... */ }

// src/components/onboarding/SignupStep.tsx
export function SignupStep({ ... }) { /* ... */ }

// src/pages/Onboarding.tsx — Orchestration only (~200 lines)
const Onboarding = () => {
  const { answers, personalInfo, ... } = useOnboardingState(user?.id);
  const question = filteredQuestions[currentStep];
  return (
    <OnboardingLayout>
      {question.inputType === "personal-info" && <PersonalInfoStep ... />}
      {question.inputType === "signup" && <SignupStep ... />}
      {question.options && <OptionsGrid ... />}
    </OnboardingLayout>
  );
};
```

**Applied — Services**

`profileService.ts`, `onboardingService.ts`, `matchService.ts` each focus on a single domain. Good SRP at the service layer.

---

### 2.2 OCP (Open/Closed Principle)

**Violated — Hardcoded question types in Onboarding**

```tsx
// src/pages/Onboarding.tsx — Lines 906–1010, 1013–1179
{question.inputType === "personal-info" && ( /* 100+ lines */ )}
{question.inputType === "signup" && ( /* 160+ lines */ )}
{question.options && ( /* options grid */ )}
```

Adding a new question type (e.g. `"location-picker"`) requires editing `Onboarding.tsx`.

**Before:** `if (inputType === "personal-info")` / `if (inputType === "signup")` branches.

**After (strategy/registry pattern):**

```tsx
// src/components/onboarding/stepRenderers.ts
const STEP_RENDERERS: Record<string, React.ComponentType<StepProps>> = {
  "personal-info": PersonalInfoStep,
  "signup": SignupStep,
  "options": OptionsStep,
};

// In Onboarding.tsx
const StepComponent = STEP_RENDERERS[question.inputType] ?? OptionsStep;
return <StepComponent question={question} ... />;
```

---

### 2.3 LSP (Liskov Substitution Principle)

**Applied**

No significant inheritance hierarchies. Components and hooks are composed, not subclassed. No LSP violations identified.

---

### 2.4 ISP (Interface Segregation Principle)

**Violated — Duplicate and overlapping type definitions**

`Profile` and `OnboardingPreferences` are redefined in multiple places:

| Location | Profile | OnboardingPreferences |
|----------|---------|------------------------|
| `profileService.ts` | ✅ Full, exported | — |
| `onboardingService.ts` | — | ✅ Full, exported |
| `Dashboard.tsx` | ❌ Local subset | ❌ Local subset |
| `Profile.tsx` | ❌ Local subset | ❌ Local subset |

```tsx
// src/pages/Dashboard.tsx — Lines 38–54
interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}
interface OnboardingPreferences {
  specialty: string | null;
  career_stage: string | null;
  // ... subset of service types
}
```

**Before:** Each page defines its own narrow interface.

**After:**

```tsx
// src/types/profile.ts
export type ProfileSummary = Pick<Profile, 'full_name' | 'avatar_url'>;
export type OnboardingPreferencesSummary = Pick<OnboardingPreferences, 'specialty' | 'career_stage' | 'interests' | ...>;

// src/pages/Dashboard.tsx
import type { ProfileSummary, OnboardingPreferencesSummary } from '@/types/profile';
```

---

### 2.5 DIP (Dependency Inversion Principle)

**Violated — Direct Supabase imports everywhere**

39 files import Supabase directly. No abstraction layer; high-level modules depend on low-level DB client.

| Layer | Direct Supabase Usage |
|-------|------------------------|
| Services | 19 services |
| Pages | 6 pages (Onboarding, GroupChat, PlaceSuggestions, ForgotPassword, AuthCallback, Chat, Auth) |
| Components | 3 (NotificationPopover, UserEditDialog, UserBanDialog) |
| Hooks | 3 (useSubscription, useAdminCheck, useAuth) |
| Lib | auditLog.ts |

```tsx
// src/pages/Onboarding.tsx — Line 14
import { supabase } from "@/integrations/supabase/client";
// ...
const { data: { user: newUser } } = await supabase.auth.getUser();
```

**Before:** Pages and components import `supabase` directly.

**After (repository/abstraction):**

```ts
// src/lib/repositories/profileRepository.ts
export interface IProfileRepository {
  getProfile(userId: string): Promise<Profile | null>;
  updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null>;
}

export const profileRepository: IProfileRepository = {
  getProfile: (userId) => profileService.getProfile(userId),
  updateProfile: (userId, updates) => profileService.updateProfile(userId, updates),
};

// Services receive client via DI (or use a single abstraction)
// src/integrations/supabase/client.ts — single export; services use it
// Pages NEVER import supabase; they use services/hooks only
```

**Immediate fix:** Remove `import { supabase }` from `Onboarding.tsx` and use `useAuth()` + services. Same for other pages that only need `supabase.auth.getUser()`.

---

## 3. Architecture Assessment

### 3.1 Component Size

| File | Lines | Status |
|------|-------|--------|
| Onboarding.tsx | 1586 | ❌ >300; extract steps, hooks, data |
| Dashboard.tsx | 688 | ⚠️ >200; extract `MatchGroupCard`, `InterestsCard`, `useDashboardData` |
| GroupChat.tsx | ~400+ | ⚠️ Consider extraction |
| Profile.tsx | ~350+ | ⚠️ Consider extraction |
| Providers.tsx | 52 | ✅ |
| DashboardLayout.tsx | ~149 | ✅ |

**Recommendation:** Extract from Onboarding: `useOnboardingState`, `PersonalInfoStep`, `SignupStep`, `OnboardingProgress`, and move `questions` to `src/data/onboardingQuestions.ts`.

---

### 3.2 Separation of Concerns

**Data access:** Services encapsulate DB calls; good separation.

**Business logic in UI:** Onboarding contains:
- Validation (`validateSignup`, `canProceed`, `getPersonalInfoMissingFields`)
- Mapping (`answers` → `saveOnboardingPreferences` payload)
- Error handling (toast logic for signup errors)

**Recommendation:** Move validation to `src/utils/onboardingValidation.ts`; mapping to `onboardingService` or a dedicated mapper.

**Validation placement:** Zod used in Onboarding for signup; other forms use ad-hoc checks. Consider centralizing schemas in `src/lib/validation/`.

---

### 3.3 Data Access Patterns

**Consistent:** Dashboard, Matches, Profile use services (`getProfile`, `getOnboardingPreferences`, `getGroupMembers`, etc.).

**Inconsistent:** These bypass the service layer:
- `Onboarding.tsx` — `supabase.auth.getUser()` (line 567)
- `GroupChat.tsx`, `Chat.tsx` — likely realtime subscriptions
- `PlaceSuggestions.tsx`, `ForgotPassword.tsx`, `AuthCallback.tsx`, `Auth.tsx`
- `NotificationPopover.tsx`, `UserEditDialog.tsx`, `UserBanDialog.tsx`
- `useSubscription.tsx`, `useAdminCheck.tsx`

**Recommendation:** Create `authService.ts` for `getUser`, password reset, etc. Use services for all data access; keep Supabase imports only in services and a minimal auth layer.

---

### 3.4 Error Handling

**Centralized:** `errorHandler.ts` provides `handleError`, `getUserFriendlyMessage`, `normalizeError`.

**Usage:** Inconsistent. Some files use:
```ts
const { handleError } = await import('@/utils/errorHandler');
handleError(error, 'Onboarding');
```
Others use `console.error` or inline toast logic.

**error.tsx:** Uses `console.error`; no integration with `errorHandler` or external logging (e.g. Sentry).

**Recommendation:**
1. Use `handleError` everywhere instead of ad-hoc `console.error`.
2. In `app/error.tsx`, call `handleError` and optionally report to Sentry.
3. Add `ErrorBoundary` usage for critical routes if not already present.

---

### 3.5 Modularity

**Duplicate code:**
- `Profile` / `OnboardingPreferences` types (see ISP)
- Pending onboarding save logic duplicated in `Onboarding.tsx` and `Dashboard.tsx` (similar `saveOnboardingPreferences` payload construction)

**Shared types:** `@/types/match.ts` exists; profile/onboarding types should be centralized.

**Barrel exports:** No `index.ts` in `services/` or `hooks/`; imports are direct. Acceptable but could simplify imports.

**Circular dependencies:** None detected.

---

## 4. Prioritized Recommendations

### High Priority

1. **Refactor Onboarding.tsx**
   - Extract `questions` to `src/data/onboardingQuestions.ts`
   - Extract `useOnboardingState` hook
   - Extract `PersonalInfoStep`, `SignupStep`, `OptionsStep` components
   - Target: Onboarding.tsx < 300 lines

2. **Introduce DB abstraction (DIP)**
   - Create `authService.ts` for `getUser`, password reset
   - Remove `supabase` imports from all pages and components
   - Keep Supabase only in services and `lib/supabase/`

3. **Consolidate types (ISP)**
   - Add `src/types/profile.ts` with `ProfileSummary`, `OnboardingPreferencesSummary`
   - Remove local `Profile` / `OnboardingPreferences` from Dashboard and Profile pages
   - Import from `@/services/profileService` and `@/services/onboardingService` or `@/types`

### Medium Priority

4. **Apply OCP to Onboarding steps**
   - Implement step renderer registry so new question types don’t require editing `Onboarding.tsx`

5. **Centralize error handling**
   - Replace ad-hoc `console.error` with `handleError`
   - Integrate `errorHandler` into `app/error.tsx`
   - Add Sentry or similar in production

6. **Extract Dashboard subcomponents**
   - `MatchGroupCard`, `InterestsCard`, `ProfileCompletionCard`
   - `useDashboardData` hook for fetch + pending-data logic

### Low Priority

7. **Add barrel exports**
   - `src/services/index.ts`, `src/hooks/index.ts` for cleaner imports

8. **Move validation out of UI**
   - `onboardingValidation.ts` for signup and personal-info validation
   - Reuse Zod schemas across forms

9. **Deduplicate pending onboarding logic**
   - Shared `savePendingOnboardingData(pendingData, userId)` used by Dashboard and Onboarding

---

## 5. Conclusion

The codebase has a solid service layer and clear separation between data access and UI in many places. The main issues are:

- **Onboarding.tsx** is a large, multi-responsibility component that violates SRP and OCP
- **Direct Supabase usage** in pages/components violates DIP
- **Duplicate types** violate ISP and reduce maintainability

Addressing the High priority items will significantly improve maintainability and testability. The Medium and Low items can be tackled incrementally.
