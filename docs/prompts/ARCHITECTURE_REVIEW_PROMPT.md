# Architecture & SOLID Review Prompt

> **Copy the prompt below into ChatGPT, Claude, or any LLM to get a professional codebase audit.**

---

## Core Prompt (Next.js / React)

```
You are a senior full-stack engineer and architecture reviewer. Analyze the following Next.js project codebase and generate a professional audit that includes:

### 1. SOLID Principles Evaluation
For each principle, provide:
- **SRP (Single Responsibility):** Identify components/services doing too much; flag files >300 lines or with 5+ distinct responsibilities
- **OCP (Open/Closed):** Check if code is extensible without modification; look for strategy/plugin patterns or hardcoded branches
- **LSP (Liskov Substitution):** Evaluate inheritance hierarchies; ensure subtypes are substitutable for base types
- **ISP (Interface Segregation):** Find fat interfaces; check for duplicated/overlapping type definitions across files
- **DIP (Dependency Inversion):** Identify direct imports of concrete implementations (e.g., DB clients, APIs); flag missing abstractions

### 2. Concrete Evidence
- Quote actual code snippets (with file paths and line numbers) where each principle is **applied** or **violated**
- For each violation, provide a **before/after** code example showing the improvement

### 3. Architecture Assessment
- **Component size:** Flag components >200 lines; recommend extraction into hooks/subcomponents
- **Separation of concerns:** Data access (services vs direct DB in pages), business logic in UI, validation placement
- **Data access patterns:** Consistency of service layer usage; direct client imports in components
- **Error handling:** Centralized vs scattered; use of error boundaries, logging, user-facing messages
- **Modularity:** Duplicate code, shared types, barrel exports, circular dependencies

### 4. Output Format
- **Summary table:** One row per principle/area with status (✅ Applied | ⚠️ Partial | ❌ Violated) and brief notes
- **Prioritized recommendations:** Numbered list (High/Medium/Low) with actionable items
- Use **markdown** with headings, code blocks (with language tags), and bullets
- Target audience: senior developers and tech leads

### 5. Codebase Input
Paste the relevant code snippets below (e.g., key services, largest pages, layout components, hooks).

---
Codebase snippet or repo follows:

\`\`\`tsx
// Paste relevant sections here (e.g., Dashboard.tsx, profileService.ts, Providers.tsx)
\`\`\`
```

---

## Usage Tips

| Scenario | What to paste |
|----------|---------------|
| **Full review** | 5–10 key files: largest page, 2–3 services, auth hook, layout, error handler |
| **Quick check** | 2–3 most complex files |
| **SOLID focus** | Services + hooks + one fat component |
| **No code** | Describe structure: "Next.js app with 19 services, 29 pages, Supabase backend" |

---

## Why This Prompt Works

| Element | Benefit |
|---------|---------|
| **Role assignment** | Sets expertise level |
| **Explicit criteria** | Covers all 5 SOLID principles + architecture |
| **Concrete output format** | Enforces structure and readability |
| **Before/after snippets** | Makes recommendations actionable |
| **Prioritization** | Helps teams decide what to fix first |
| **Partial code support** | Works with snippets or full repo |
