# Haruki Toolbox Agent Guide

## Project Summary

Haruki Toolbox is a frontend-only project built with:

- Vue 3
- TypeScript
- Vite
- Bun
- Pinia
- Vue Router
- Vue I18n
- Tailwind CSS 4
- Playwright for E2E smoke tests

This repository is the web UI for the Haruki ecosystem. It integrates with Ory Kratos/Hydra/Oathkeeper, but it is not the backend repository.

Important: some files under `docs/` describe backend or deployment topology. Use them to understand API and auth behavior, but do not treat backend directory names in those docs as frontend source layout rules.

## Source Map

- `src/main.ts`: app bootstrap, Pinia setup, auth/session bootstrap, i18n initialization
- `src/App.vue`: top-level app shell and user settings sync retry flow
- `src/core/`: app-wide router and HTTP infrastructure
- `src/shared/`: shared stores, i18n, shared components
- `src/components/ui/`: reusable UI primitives
- `src/modules/<feature>/`: feature-local `api`, `components`, `composables`, `lib`, `views`, and `routes`
- `src/types/`: shared API and domain typings
- `tests/e2e/`: Playwright browser tests
- `docs/`: API, auth, and integration references

## Architecture Conventions

- Keep feature code inside the owning module under `src/modules/<feature>/`.
- Keep `views/` thin. Move async logic, API orchestration, and reusable state into `composables/` or `lib/`.
- Put app-wide infrastructure in `src/core/` only when it truly spans multiple features.
- Put reusable cross-feature state in `src/shared/stores/`.
- Reuse `src/components/ui/*` and shared components before introducing new UI primitives.
- Use `@/` imports instead of deep relative paths.
- Match the formatting/style of the file you are editing instead of reformatting unrelated code.

## HTTP, Auth, and Session Rules

- For business API requests, use `request()` from `src/core/http/call-api.ts`.
- Do not create ad-hoc Axios instances or hardcode API base URLs in feature code.
- API base URL is resolved centrally from `useSettingsStore().currentEndpoint`.
- Kratos browser flows belong in `src/modules/auth/lib/kratos.ts` and related auth composables.
- Do not replace Kratos browser flow logic with generic `request()` calls unless the existing auth layer is being intentionally redesigned.
- `request()` defaults `skipErrorToast` to `true`; features should opt into local, user-meaningful toasts where appropriate.
- `src/main.ts`, `src/App.vue`, and `src/shared/stores/user.ts` are a sensitive cluster. Partial Kratos session data is not a full substitute for synced toolbox user data.
- When hydrating from a fallback Kratos session, preserve cached user context unless the session is definitely gone. Otherwise post-login sync paths that depend on `userId` can break.

## State and Persistence

- `useUserStore()` is the source of truth for current user/session state.
- `settingsSyncState` is meaningful. If you change bootstrap or sync flows, verify how it affects `App.vue`.
- `useSettingsStore()` owns endpoint selection, theme, and locale.
- Theme and locale are persisted; do not add duplicate persistence elsewhere without a strong reason.
- Avoid clearing the user store on recoverable bootstrap errors unless you are certain the session is invalid.

## Routing Rules

- Route definitions live with the owning feature and are assembled through the web route tree.
- Use route `meta.titleKey` values for page titles when adding routes.
- Respect `requiresAuth`, `requiresAdmin`, `requiresSuperAdmin`, and `guestOnly` semantics already handled by `src/core/router/guards.ts`.
- If you change auth routing, read `docs/ory-frontend-reference.md` first.

## UI and UX Expectations

- Prefer `<script setup lang="ts">` for Vue components.
- Use existing composables and UI patterns before creating new abstractions.
- Keep forms, dialogs, and toasts consistent with surrounding modules.
- Use `vue-sonner` for toast feedback.
- Reuse existing i18n keys/patterns where possible rather than embedding strings inline.
- Maintain responsive behavior for both desktop and mobile.

## Internationalization

- All user-facing text must be added to both:
  - `src/shared/i18n/messages/en-US.ts`
  - `src/shared/i18n/messages/zh-CN.ts`
- Do not leave new UI strings hardcoded in components unless there is a very strong project-specific reason.
- Keep translation key structure aligned with the owning module.

## Testing and Validation

Run the smallest relevant set, and prefer the full set for broad changes:

- `bun run lint`
- `bun run typecheck`
- `bun run test`
- `bun run e2e`

Guidelines:

- Add or update `*.test.ts` files when changing pure helpers, normalizers, or domain mapping logic.
- Consider Playwright coverage when changing routing, auth redirects, bootstrap behavior, or page-level flows.
- `bun run build` is a good final confidence check for larger UI or type-heavy changes.

## Working With Docs

Useful frontend-facing references:

- `docs/frontend-integration-api.md`
- `docs/api-request-reference.md`
- `docs/ory-frontend-reference.md`

Be careful with:

- `docs/architecture.md`
- `docs/development.md`

Those files currently include backend-oriented notes from the wider Haruki system. They are still useful context, but they are not a map of this frontend repo's source tree.

## Common Pitfalls

- Do not hardcode auth or API origins when helpers/stores already resolve them.
- Do not clear cached user data in partial-session bootstrap paths unless logout is explicit or the session is confirmed invalid.
- Do not add new business logic directly to route views if it belongs in a composable or `lib/` helper.
- Do not update only one locale file.
- Do not bypass `request()` response handling unless you are working inside the auth/browser-flow integration layer.
- Do not commit generated artifacts like `dist/` or ephemeral Playwright output.

## Recommended Change Checklist

Before finishing a non-trivial change, verify:

1. The change lives in the correct module or shared layer.
2. New strings exist in both locales.
3. API calls use the shared request/auth patterns.
4. Session/bootstrap behavior still preserves valid user context.
5. Relevant lint, typecheck, and test commands pass.

## Commit Message Format

All commits must follow `[Type] Short description`:

- Allowed types: `[Feat]` (new feature), `[Fix]` (bug fix), `[Chore]` (maintenance, refactor, deps, build), `[Docs]` (docs-only).
- Description must start with a capital letter.
- Use imperative mood ("Add X", not "Added X").
- Do not end the subject line with a period.
- Keep it short.
- When an agent authors the commit, append a `Co-Authored-By:` trailer identifying the agent (blank line between subject and trailer).

Examples (from this repo's history):

- `[Feat] Add hydra oauth2 flow`
- `[Fix] Sidebar option big gap issue in Safari`
- `[Chore] Add AGENTS.md and copilot-instructions.md`
- `[Docs] Update CLAUDE.md with commit format`
