# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Also read `AGENTS.md` — it contains the full agent-facing guide (source map, conventions, HTTP/auth rules, pitfalls). This file summarizes the essentials and highlights points that are easy to miss.

## Runtime and Commands

Bun (≥ 1.2) is the required runtime and package manager. Vite is invoked via `bunx --bun`.

- `bun i` — install dependencies
- `bun run dev` — Vite dev server
- `bun run build` — runs `check:imports` → `vue-tsc --noEmit` → `vite build`
- `bun run preview` — typecheck + preview built app
- `bun run lint` — ESLint with `--max-warnings=0` over `src/**/*.{ts,vue}`, `scripts/**/*.mjs`, `vite.config.ts`
- `bun run typecheck` — `check:imports` + `vue-tsc --noEmit`
- `bun run check:imports` — runs `scripts/check-imports.mjs` (see "Import Guard" below)
- `bun run test` — `bun test` (unit tests, `*.test.ts`)
- `bun run e2e` — Playwright tests in `tests/e2e/**/*.e2e.ts`; Playwright auto-starts `bun run dev --host 127.0.0.1 --port 4173`
- `bun run e2e:install` — one-time `playwright install chromium`
- `bun run quality` — lint + typecheck + test (use as a broad pre-commit check)

Run a single unit test: `bun test path/to/file.test.ts` (or pass a pattern: `bun test -t "name"`).
Run a single Playwright test: `bunx playwright test tests/e2e/foo.e2e.ts` (add `--headed` / `--debug` as needed).

## Architecture

Frontend-only SPA (Vue 3 + `<script setup lang="ts">` + Pinia + Vue Router + vue-i18n + Tailwind 4). Backend auth is Ory (Kratos/Hydra/Oathkeeper); the backend lives in a separate repo.

Three-layer source layout:

- `src/core/` — app-wide infrastructure that truly spans features:
  - `core/http/call-api.ts` exports the shared `request()` / `apiClient` used for all business API calls. It reads the base URL from `useSettingsStore().currentEndpoint`, handles `skipErrorToast` (default `true`), retries, and redirect-to-login on 401.
  - `core/router/` builds the router from `@/modules/web/routes` and installs guards (`requiresAuth`, `requiresAdmin`, `requiresSuperAdmin`, `guestOnly`, `meta.titleKey`).
- `src/shared/` — cross-feature state and UI:
  - `shared/stores/user.ts` — `useUserStore()`, the source of truth for session/profile. `settingsSyncState` gates post-login hydration in `App.vue`.
  - `shared/stores/settings.ts` — `useSettingsStore()` owns endpoint selection, theme, locale (persisted via `pinia-plugin-persistedstate`; do not add duplicate persistence).
  - `shared/i18n/messages/{en-US,zh-CN}.ts` — both locales must be updated for every new user-facing string.
  - `shared/components/` — cross-feature components (e.g. `Turnstile.vue`).
- `src/modules/<feature>/` — each feature owns its `api/`, `components/`, `composables/`, `lib/`, `views/`, and `routes.ts`. Routes are collected via `src/modules/web/routes`. Feature-level `index.ts` is the public barrel; internals must not import it (see Import Guard). `src/components/ui/` hosts reusable UI primitives (shadcn-style) — reuse before adding new ones.

Bootstrap is a sensitive cluster: `src/main.ts` + `src/App.vue` + `src/shared/stores/user.ts`. Kratos browser flows only return partial session data; the toolbox user profile is synced separately. When hydrating from a fallback Kratos session, preserve cached user context unless the session is definitely gone — clearing it breaks post-login sync paths that depend on `userId`.

Vite build uses manual vendor chunks: `vendor-vue`, `vendor-ui`, `vendor-chart`, `vendor-monaco` (see `vite.config.ts`). `envPrefix` allows both `VITE_` and `ENABLE_` env vars.

## Import Guard (enforced in build/typecheck)

`scripts/check-imports.mjs` runs before `vue-tsc` in `build` and `typecheck`. Fix violations before expecting either to pass.

Banned import tokens (with replacements):
- `@/components/pages/*` → module-local `views/`/`components/`
- `@/components/WebLayout.vue` → `@/modules/web/views/WebLayout.vue`
- `@/components/Maintenance.vue` → `@/modules/navigation/views/Maintenance.vue`
- `@/components/Turnstile.vue` → `@/shared/components/Turnstile.vue`
- `@/api/*` / `from "@/api"` → `@/modules/<feature>/api` (or `@/core/http/call-api` for the HTTP client)
- `@/store` → `@/shared/stores/user`
- `@/settingsStore` → `@/shared/stores/settings`
- `@/router` / `./router` → `@/core/router`
- `@/lib/ticket-display` → `@/modules/tickets/lib/display`

Barrel rules:
- A module's internals must not import its own `index.ts` barrel (`@/modules/<self>` or relative equivalents). Import the concrete subpath instead (`./api/user`, `./composables/list`, etc.).
- A module's non-`api/` internals must not import their own `api` barrel (`@/modules/<self>/api`). Import concrete files like `./api/user`.
- Consumers in other modules **may** import the public `@/modules/<feature>` or `@/modules/<feature>/api` barrels.

Always use `@/` aliases rather than deep relative paths.

## HTTP / Auth Rules

- Business APIs: use `request()` from `@/core/http/call-api`. Do not spin up new Axios instances or hardcode origins.
- `request()` defaults `skipErrorToast: true`. Opt in to local, user-meaningful toasts (`vue-sonner`) at the call site when appropriate.
- Kratos self-service flows live in `src/modules/auth/lib/kratos.ts` and the auth composables. Do not replace them with generic `request()` calls unless the auth layer is being intentionally redesigned.

## I18n

Every new user-facing string must be added to both `src/shared/i18n/messages/en-US.ts` and `src/shared/i18n/messages/zh-CN.ts`. Keep key structure aligned with the owning module. Reuse existing keys before adding new ones.

## Testing Expectations

- Unit (`bun test`): add/update `*.test.ts` for pure helpers, normalizers, and domain mapping logic.
- E2E (`bun run e2e`): add Playwright coverage when changing routing, auth redirects, bootstrap behavior, or page-level flows.
- For large UI/type-heavy changes, run `bun run build` as a final confidence check.
- Don't commit `dist/` or `test-results/`.

## Commit Message Format

All commits must follow `[Type] Short description`:

- Allowed types: `[Feat]` (new feature), `[Fix]` (bug fix), `[Chore]` (maintenance, refactor, deps, build), `[Docs]` (docs-only).
- Description **must start with a capital letter**.
- Use imperative mood ("Add X", not "Added X").
- Do **not** end the subject line with a period.
- Keep it short.
- When Claude Code authors the commit, append a `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>` trailer (blank line between subject and trailer).
- Bump `version` in `package.json` with every commit: **patch** (+0.0.1) for `[Fix]`, **minor** (+0.1.0) for `[Feat]`, **major** (+1.0.0) for breaking changes.

Examples (from this repo's history):
- `[Feat] Add hydra oauth2 flow`
- `[Fix] Sidebar option big gap issue in Safari`
- `[Chore] Add AGENTS.md and copilot-instructions.md`
- `[Docs] Update CLAUDE.md with commit format`
