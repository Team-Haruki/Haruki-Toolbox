# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Also read `AGENTS.md` — it contains the full agent-facing guide (source map, conventions, HTTP/auth rules, pitfalls). This file summarizes the essentials and highlights points that are easy to miss.

## Runtime and Commands

Bun (≥ 1.2) is the required runtime and package manager. Vite is invoked via `bunx --bun`.

- `bun i` — install dependencies
- `bun run dev` — Vite dev server
- `bun run build` — runs `check:imports` → `vue-tsc --noEmit` → `vite build`
- `bun run build:edgeone` — `check:imports` + `vite build` without typecheck (EdgeOne Pages deploy)
- `bun run preview` — `vue-tsc --noEmit` + preview built app
- `bun run lint` — ESLint with `--max-warnings=0` over `src/**/*.{ts,vue}`, `scripts/**/*.mjs`, `vite.config.ts`
- `bun run typecheck` — `check:imports` + `vue-tsc --noEmit`
- `bun run check:imports` — runs `scripts/check-imports.mjs` (see "Import Guard" below)
- `bun run test` — `bun test` (unit tests, `*.test.ts`)
- `bun run e2e` — Playwright tests in `tests/e2e/**/*.e2e.ts`; Playwright auto-starts `bunx vite --mode e2e --host 127.0.0.1 --port 4173 --strictPort`. The webServer command deliberately runs Vite under node (plain `bunx`, not `bunx --bun`): vite under the bun runtime hangs before listening on linux-x64 CI runners. Do not reintroduce `--bun` there.
- `bun run e2e:install` — one-time `playwright install chromium`
- `bun run quality` — lint + typecheck + test (use as a broad pre-commit check)
- `bun scripts/sync-i18n-zh-tw.mjs` — auto-fill zh-TW locale bundles from zh-CN via OpenCC (see "I18n")

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
  - `shared/i18n/` — three locales (`zh-CN` default, `zh-TW`, `en-US`) split into lazy per-feature bundles; see "I18n".
  - `shared/sekai/` — Sekai game-data layer: master-data loading/caching (web worker), catalog/search helpers, asset endpoint and URL resolution (`data-sources.ts`), Service-Worker image cache recovery (`image-recovery.ts`).
  - `shared/components/` — cross-feature components (e.g. `Turnstile.vue`).
- `src/shared/components/catalog/` + `src/shared/components/Sekai*.vue` — the Sekai catalog foundation (page/detail shells, filter panel, results bar, pagination, status badge, countdown, entity visuals, lightbox). Catalog pages keep filter state in `route.query` via `useRouteQueryState` and read master data through `useCatalogResource` + the canonical index resources (`useCardsIndex`, `useEventsIndex`, `useGachasIndex`, `useMusicsIndex`, `useCharactersIndex`). See "Sekai Catalog Conventions" in `AGENTS.md`.
- `src/modules/<feature>/` — each feature owns its `api/`, `components/`, `composables/`, `lib/`, `views/`, and `routes.ts`. Routes are collected via `src/modules/web/routes`. Feature-level `index.ts` is the public barrel; internals must not import it (see Import Guard). `src/components/ui/` hosts reusable UI primitives (shadcn-style) — reuse before adding new ones. Top-level `src/lib/`, `src/composables/`, and `src/config/` hold cross-feature pure helpers, composables, and app config.

Bootstrap is a sensitive cluster: `src/main.ts` + `src/App.vue` + `src/shared/stores/user.ts`. Kratos browser flows only return partial session data; the toolbox user profile is synced separately. When hydrating from a fallback Kratos session, preserve cached user context unless the session is definitely gone — clearing it breaks post-login sync paths that depend on `userId`.

Vite build uses manual vendor chunks (rolldown `advancedChunks`): `vendor-vue`, `vendor-ui`, `vendor-chart`, `vendor-monaco` (see `vite.config.ts`). `envPrefix` allows both `VITE_` and `ENABLE_` env vars.

The app is a PWA (`vite-plugin-pwa`, `registerType: 'prompt'`): workbox precaches the build (heavy wasm/3D/locale chunks excluded) and runtime-caches Sekai/toolbox images CacheFirst (`sekai-image-assets-v2`). Those `<img>` loads are cross-origin no-cors, so cached responses are opaque and can pin CDN errors — image error handlers must go through `@/shared/sekai/image-recovery` (purge + one cache-busted retry). `src/pwa.ts` owns SW registration, the update prompt, build-info polling, and old-cache cleanup.

## Import Guard (enforced in build/typecheck)

`scripts/check-imports.mjs` runs before `vue-tsc` in `build` and `typecheck`. Fix violations before expecting either to pass.

Banned import tokens (with replacements):
- `@/components/pages/*` → module-local `views/`/`components/`
- `@/components/WebLayout.vue` → `@/modules/web/views/WebLayout.vue`
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

Three locales: `zh-CN` (default), `zh-TW`, `en-US`. Messages are split into lazy per-feature bundles (`core` always loads at boot; `catalog`, `deck`, `rank`, `tools`, `user-settings`, `admin`, `tickets`, `public-pages` load per route via `src/shared/i18n/bundles.ts`). Message files live at `src/shared/i18n/messages/<locale>/<locale>-<bundle>.ts`. Catalog page strings go in the `catalog` bundle (`cardCatalog`, `eventCatalog`, `gachaCatalog`, `musicCatalog`); shared shell strings (`catalog.*`) and game enum labels stay in `core`.

- Every new user-facing string must exist in all three locales, in the same bundle file.
- Write zh-CN and en-US by hand; zh-TW can then be auto-filled with `bun scripts/sync-i18n-zh-tw.mjs` (OpenCC s2twp; only fills keys missing in zh-TW, drops orphans, keeps key order aligned with zh-CN).
- Put keys in the bundle that owns the consuming page; a new top-level route prefix needs a mapping in `bundles.ts` or its non-core strings won't load.
- Reuse existing keys before adding new ones.

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
- When Claude Code authors the commit, append a `Co-Authored-By` trailer naming the authoring model, e.g. `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` (blank line between subject and trailer).
- Version bumps (`version` in `package.json`, `major.minor.patch`): **patch** for `[Fix]`, **minor** for `[Feat]`, **major** for breaking changes. `[Chore]`/`[Docs]` commits normally do not bump. When several commits ship together, one bump for the batch is enough.

Examples (from this repo's history):
- `[Feat] Add hydra oauth2 flow`
- `[Fix] Sidebar option big gap issue in Safari`
- `[Chore] Add AGENTS.md and copilot-instructions.md`
- `[Docs] Update CLAUDE.md with commit format`
