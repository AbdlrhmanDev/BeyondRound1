# Prompt Variants

Specialized versions of the architecture review prompt for different frameworks and focus areas.

---

## 1. Vue / Nuxt

```
You are a senior full-stack engineer and architecture reviewer. Analyze the following Vue/Nuxt project codebase and generate a professional audit that includes:

### 1. SOLID Principles Evaluation
- **SRP:** Pinpoint composables, stores, or components with mixed responsibilities
- **OCP:** Check composables and plugins for extensibility; provide/inject usage
- **LSP:** Evaluate class-based components or TypeScript inheritance
- **ISP:** Find duplicated types between components and composables
- **DIP:** Identify direct Pinia/Supabase/API imports; recommend dependency injection

### 2. Vue/Nuxt-Specific Checks
- **Composition API:** Proper use of composables vs logic in setup(); extraction of reusable logic
- **State management:** Pinia store structure; avoid prop drilling; proper use of provide/inject
- **Routing:** Route guards, middleware, layout composition
- **SSR/SSG:** Data fetching in useAsyncData/useFetch; hydration mismatches
- **Performance:** v-if vs v-show; lazy loading; bundle splitting

### 3. Output
- Summary table (✅/⚠️/❌) per principle and area
- Before/after code snippets for each violation
- Prioritized recommendations (High/Medium/Low)
- Markdown format for senior developers

---
Codebase follows:
```

---

## 2. Angular

```
You are a senior full-stack engineer and architecture reviewer. Analyze the following Angular project codebase and generate a professional audit that includes:

### 1. SOLID Principles Evaluation
- **SRP:** Components vs services; single-purpose directives and pipes
- **OCP:** Module structure; strategy pattern for interchangeable implementations
- **LSP:** Class hierarchies; interface compliance
- **ISP:** Service interfaces; avoid "god services"
- **DIP:** Constructor injection; avoid direct instantiation of HttpClient, Router, etc.

### 2. Angular-Specific Checks
- **Dependency injection:** Proper use of inject()/constructor injection; providedIn scope
- **RxJS:** Subscription management; avoid memory leaks; proper operators
- **Change detection:** OnPush strategy; avoid unnecessary re-renders
- **Lazy loading:** Feature modules; route-level code splitting
- **Standalone components:** Migration path; consistency

### 3. Output
- Summary table (✅/⚠️/❌) per principle and area
- Before/after code snippets
- Prioritized recommendations
- Markdown format for tech leads

---
Codebase follows:
```

---

## 3. Backend / Node.js / API

```
You are a senior backend engineer and architecture reviewer. Analyze the following backend/API codebase and generate a professional audit that includes:

### 1. SOLID Principles Evaluation
- **SRP:** Controllers vs services vs repositories; single-purpose modules
- **OCP:** Middleware and plugin architecture; strategy pattern for business logic
- **LSP:** Class hierarchies; interface substitution
- **ISP:** API contracts; avoid bloated DTOs
- **DIP:** Repository pattern; inject DB clients, external APIs; avoid hardcoded dependencies

### 2. Backend-Specific Checks
- **Layered architecture:** Controller → Service → Repository separation
- **Error handling:** Centralized error middleware; consistent error responses
- **Validation:** Input validation (Zod, Joi, class-validator); sanitization
- **Security:** Auth flow; rate limiting; CORS; SQL injection / XSS prevention
- **Testing:** Unit vs integration; mocking strategies

### 3. Output
- Summary table (✅/⚠️/❌) per principle and area
- Before/after code snippets
- Prioritized recommendations
- Markdown format for backend leads

---
Codebase follows:
```

---

## 4. Performance-Focused Review

```
You are a senior frontend engineer specializing in performance. Analyze the following project and generate a performance audit that includes:

### 1. Core Web Vitals & Metrics
- **LCP:** Image optimization, font loading, critical CSS, server components
- **FID/INP:** Long tasks; main thread blocking; event handler efficiency
- **CLS:** Layout shifts; image dimensions; dynamic content injection

### 2. Framework-Specific
- **React/Next.js:** Component re-renders; React.memo; useMemo/useCallback; dynamic imports; ISR/SSG
- **Bundle size:** Tree shaking; code splitting; duplicate dependencies; analysis tools

### 3. Data & Network
- **Data fetching:** Over-fetching; waterfall requests; caching (React Query, SWR)
- **Realtime:** WebSocket efficiency; message batching; reconnection strategy

### 4. Output
- Performance scorecard (Good/Needs Work/Poor) per area
- Concrete before/after optimizations with code
- Prioritized recommendations by impact
- Markdown format

---
Codebase follows:
```

---

## 5. Security-Focused Review

```
You are a senior security engineer. Analyze the following project and generate a security audit that includes:

### 1. Authentication & Authorization
- Token storage (httpOnly cookies vs localStorage); refresh flow
- RLS/policy enforcement; role-based access
- Session management; logout behavior

### 2. Input & Output
- XSS: Sanitization; CSP; dangerouslySetInnerHTML usage
- SQL injection: Parameterized queries; ORM usage
- CSRF: Token validation; SameSite cookies

### 3. Sensitive Data
- Secrets in code; env var usage; .env in .gitignore
- PII handling; logging of sensitive data
- API keys; CORS configuration

### 4. Dependencies
- Known vulnerabilities (npm audit); outdated packages
- Supply chain: Lock files; integrity checks

### 5. Output
- Risk matrix (Critical/High/Medium/Low) per finding
- Remediation steps with code examples
- Prioritized recommendations
- Markdown format

---
Codebase follows:
```

---

## 6. Testing Architecture Review

```
You are a senior QA engineer and testing architect. Analyze the following project and generate a testing strategy audit that includes:

### 1. Test Coverage & Structure
- Unit tests: Services, utils, pure functions
- Integration tests: API routes, DB operations, auth flows
- E2E tests: Critical user journeys
- Test organization: Co-located vs separate; naming conventions

### 2. Testing Patterns
- Mocking: What to mock (DB, APIs, time); over-mocking risks
- Fixtures: Reusable test data; factories
- Assertions: Clarity; custom matchers
- Isolation: Test independence; cleanup

### 3. Tooling & CI
- Jest/Vitest/Playwright configuration
- Coverage thresholds; flaky test handling
- CI integration; parallelization

### 4. Output
- Coverage gap analysis
- Recommended test pyramid per area
- Before/after examples for critical paths
- Prioritized recommendations
- Markdown format

---
Codebase follows:
```

---

## 7. SOLID-Compliant Code Generation

```
You are a senior architect. Generate [SERVICE/HOOK/COMPONENT] code that strictly adheres to SOLID principles.

### Requirements
- **SRP:** One clear responsibility per module
- **OCP:** Extensible via configuration or composition, not modification
- **ISP:** Small, focused interfaces; no fat types
- **DIP:** Depend on abstractions (interfaces); inject concrete implementations

### Output Format
1. Interface/type definitions first
2. Implementation with dependency injection
3. Usage example showing injection
4. Brief explanation of how each principle is satisfied

### Context
[Describe the feature: e.g., "A profile service that fetches and updates user profiles, with caching and error handling"]

### Tech Stack
[ e.g., TypeScript, React, Supabase ]
```

---

## Quick Reference

| Variant | Use When |
|---------|----------|
| **Next.js/React** | Default for React/Next projects |
| **Vue/Nuxt** | Vue 3, Nuxt 3, Composition API |
| **Angular** | Angular 2+ projects |
| **Backend** | Node.js, Express, Fastify, NestJS APIs |
| **Performance** | Slow apps; Core Web Vitals focus |
| **Security** | Pre-launch audit; compliance; sensitive data |
| **Testing** | Building or improving test suite |
| **SOLID Code Gen** | Creating new services/hooks from scratch |
