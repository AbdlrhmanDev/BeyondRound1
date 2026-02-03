# Architecture Review Prompts

Reusable prompts for AI-assisted codebase audits. Use with ChatGPT, Claude, Cursor, or any LLM.

## Quick Start

1. Open **[ARCHITECTURE_REVIEW_PROMPT.md](./ARCHITECTURE_REVIEW_PROMPT.md)** for the main Next.js/React prompt
2. Copy the prompt block (everything between the triple backticks)
3. Paste your code snippets at the end
4. Run in your preferred AI tool

## Files

| File | Description |
|------|-------------|
| `ARCHITECTURE_REVIEW_PROMPT.md` | Core SOLID + architecture review (Next.js/React) |
| `PROMPT_VARIANTS.md` | 7 variants: Vue, Angular, Backend, Performance, Security, Testing, SOLID code gen |

## Variants at a Glance

- **Vue/Nuxt** — Composables, Pinia, SSR, provide/inject
- **Angular** — DI, RxJS, change detection, standalone components
- **Backend** — Layered architecture, repositories, validation
- **Performance** — Core Web Vitals, bundle size, data fetching
- **Security** — Auth, XSS, CSRF, secrets, dependencies
- **Testing** — Coverage, mocking, CI, test pyramid
- **SOLID Code Gen** — Generate new services/hooks that follow SOLID

## Tips

- **Paste 5–10 key files** for a thorough review
- **Include the largest/most complex** components and services
- **Add context** if needed: "This is a Next.js 14 app with Supabase"
- **Iterate:** Run the prompt, apply fixes, then run again on changed files
