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
- vite-plugin-pwa (Service Worker: precache + runtime image caches)
- Playwright for E2E smoke tests

This repository is the web UI for the Haruki ecosystem. It integrates with Ory Kratos/Hydra/Oathkeeper, but it is not the backend repository.

## Source Map

- `src/main.ts`: app bootstrap, Pinia setup, auth/session bootstrap, i18n initialization
- `src/App.vue`: top-level app shell and user settings sync retry flow
- `src/pwa.ts`: Service Worker registration, update prompt, build-info polling, old-cache cleanup
- `src/core/`: app-wide router and HTTP infrastructure
- `src/shared/`: shared stores, i18n, shared components, and the Sekai game-data layer (`src/shared/sekai/`: master-data loading/caching via a web worker, catalog helpers, asset endpoint/URL resolution, Service-Worker image cache recovery)
- `src/components/ui/`: reusable UI primitives
- `src/composables/`, `src/lib/`, `src/config/`: cross-feature composables, pure helpers, and app config
- `src/modules/<feature>/`: feature-local `api`, `components`, `composables`, `lib`, `views`, and `routes`
- `src/types/`: shared API and domain typings
- `scripts/`: repo tooling (`check-imports.mjs` import guard, `sync-i18n-zh-tw.mjs` zh-TW locale fill)
- `tests/e2e/`: Playwright browser tests

## Architecture Conventions

- Keep feature code inside the owning module under `src/modules/<feature>/`.
- Keep `views/` thin. Move async logic, API orchestration, and reusable state into `composables/` or `lib/`.
- Put app-wide infrastructure in `src/core/` only when it truly spans multiple features.
- Put reusable cross-feature state in `src/shared/stores/`.
- Reuse `src/components/ui/*` and shared components before introducing new UI primitives.
- Use `@/` imports instead of deep relative paths.
- Match the formatting/style of the file you are editing instead of reformatting unrelated code.

## Sekai Catalog Conventions

The catalog pages (`/cards`, `/events`, `/gachas`, `/music` list + detail) share one foundation; new catalog-like pages must build on it rather than re-implementing the pieces.

- **Shells and sections**: `src/shared/components/catalog/` — `CatalogPageShell` (list column: title row, toolbar, filters, results, footer), `CatalogDetailShell` (back/breadcrumb row, title row, loading/error/not-found states, document-title override), `CatalogDetailSection` (titled Card; `collapsible` sections emit `open` once — heavy/lazy data loads on that event, never on mount), `CatalogFilterPanel` (collapsed by default on phones, remembers its state per `pageKey`, shows removable `activeChips` while collapsed), `CatalogResultsBar`, `CatalogPagination`, `CatalogRegionSelect`, `CatalogCharacterPicker`, `CatalogStatusBadge`, `CatalogCountdown`, `CatalogEmptyState`, `CatalogErrorState`, `CatalogInfoList`/`CatalogInfoRow`, `CatalogEntityGrid`.
- **Entity visuals**: `src/shared/components/Sekai*.vue` (`SekaiAssetImage` for any ordered-candidate image, `SekaiCardThumbnail`, `SekaiCharacterAvatar`, `SekaiUnitLogo`, `SekaiAttrIcon`, `SekaiRarityStars`) and `ImageLightbox`. They all route errors through `@/shared/sekai/image-recovery`; `handleSekaiImageError` returns `false` once retries are exhausted — only then switch to a placeholder.
- **URL is the state**: list filters/sort/page/size live in `route.query` through `useRouteQueryState(codec, …)` (`src/composables/`), with the page's codec in `lib/<module>-query.ts` (+ tests) built from `@/lib/query-codec` readers/writers. Layout preferences (grid/list view, art mode, filter panel open) are per-device localStorage values via `useCatalogViewPreference`, never query keys.
- **Scroll memory**: list routes carry `meta.scrollMemory`; the router then leaves scrolling to the page, which calls `useCatalogScrollMemory(ready)` and restores its position once real results rendered.
- **Data**: `useCatalogResource(region, key, files, build, options)` over `useSekaiCatalogStore` caches one built value per region + master version and keeps a small LRU of raw master arrays. Canonical index resources are the only code allowed to read the big files: `useCharactersIndex` (`@/shared/sekai/catalog-resources`), `useCardsIndex` (`@/modules/cards`), `useEventsIndex` (`@/modules/events`), `useGachasIndex` (`@/modules/gachas`), `useMusicsIndex` (`@/modules/music-library`). Other resources declare their own `"<module>/<name>"` key exactly once with their file list and builder; builders return plain data (no reactivity, no asset URLs, no `t()`); region-conditional files go in `optional`.
- **Labels**: enum values from master data go through `resolveSekai*Label({ t, te }, value)` (`@/shared/sekai/labels`) so unknown members render as raw text instead of i18n keys.
- **Cross-module imports** between catalog modules go through the public barrels (`@/modules/<feature>`) or `lib/` files only, never another module's `components/` or `composables/`.

## Import Guard

`scripts/check-imports.mjs` runs before `vue-tsc` in `bun run build` and `bun run typecheck`; violations fail both. It bans legacy paths (`@/components/pages/*`, `@/api/*`, `@/store`, `@/settingsStore`, `@/router`, `@/lib/ticket-display`, old `WebLayout.vue`/`Turnstile.vue` locations) in favor of the module/shared/core layout, and enforces barrel rules:

- A module's internals must not import its own `index.ts` barrel (`@/modules/<self>` or relative equivalents) — import the concrete subpath (`./api/user`, `./composables/list`).
- A module's non-`api/` internals must not import their own `api` barrel (`@/modules/<self>/api`) — import concrete files like `./api/user`.
- Consumers in other modules may import the public `@/modules/<feature>` or `@/modules/<feature>/api` barrels.

See `CLAUDE.md` for the full banned-token table with replacements.

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
- If you change auth routing, review existing auth flow code in `src/modules/auth/` carefully first.

## UI and UX Expectations

- Prefer `<script setup lang="ts">` for Vue components.
- Use existing composables and UI patterns before creating new abstractions.
- Keep forms, dialogs, and toasts consistent with surrounding modules.
- Use `vue-sonner` for toast feedback.
- Reuse existing i18n keys/patterns where possible rather than embedding strings inline.
- Maintain responsive behavior for both desktop and mobile.

## Internationalization

- Three locales: `zh-CN` (default), `zh-TW`, `en-US`. Messages are split into lazy per-feature bundles (`core`, `catalog`, `deck`, `rank`, `tools`, `user-settings`, `admin`, `tickets`, `public-pages`); files live at `src/shared/i18n/messages/<locale>/<locale>-<bundle>.ts`. The `catalog` bundle (routes `/cards`, `/events`, `/gachas`, `/music`) holds the page-level namespaces `cardCatalog`, `eventCatalog`, `gachaCatalog`, `musicCatalog`; the shared shell strings (`catalog.*`) and every game enum label (`cards.unit/attr/rarity/supply`, `events.type`, `gachas.type`, `musicLibrary.difficulty`, …) stay in `core` because other features render them.
- All user-facing text must exist in all three locales, in the same bundle file. Write zh-CN and en-US by hand; fill zh-TW with `bun scripts/sync-i18n-zh-tw.mjs` (OpenCC, only fills missing keys).
- `core` loads at boot; other bundles load per route prefix via `src/shared/i18n/bundles.ts`. A new top-level route prefix needs a mapping there, or its non-core strings won't load.
- Do not leave new UI strings hardcoded in components unless there is a very strong project-specific reason.
- Keep translation key structure aligned with the owning module.

## Testing and Validation

Run the smallest relevant set, and prefer the full set for broad changes:

- `bun run lint`
- `bun run typecheck` (includes the import guard)
- `bun run test`
- `bun run e2e`
- `bun run quality` — lint + typecheck + test in one command

Guidelines:

- Add or update `*.test.ts` files when changing pure helpers, normalizers, or domain mapping logic.
- Consider Playwright coverage when changing routing, auth redirects, bootstrap behavior, or page-level flows.
- `bun run build` is a good final confidence check for larger UI or type-heavy changes.
- The Playwright webServer runs Vite under node on purpose (`bunx vite --mode e2e ...`, no `--bun`): vite under the bun runtime hangs before listening on linux-x64 CI runners. Do not reintroduce `--bun` there.

## Common Pitfalls

- Do not hardcode auth or API origins when helpers/stores already resolve them.
- Do not clear cached user data in partial-session bootstrap paths unless logout is explicit or the session is confirmed invalid.
- Do not add new business logic directly to route views if it belongs in a composable or `lib/` helper.
- Do not update only some of the three locale bundles (zh-CN, zh-TW, en-US).
- Do not bypass `request()` response handling unless you are working inside the auth/browser-flow integration layer.
- Do not hand-roll `<img>` error handling for Sekai/CDN images: the Service Worker caches them CacheFirst with opaque responses (errors included), so recovery must go through `@/shared/sekai/image-recovery` (purge + cache-busted retry).
- Do not commit generated artifacts like `dist/` or ephemeral Playwright output.

## Recommended Change Checklist

Before finishing a non-trivial change, verify:

1. The change lives in the correct module or shared layer.
2. New strings exist in all three locales (zh-TW via the sync script is fine).
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
- Version bumps (`version` in `package.json`, `major.minor.patch`): **patch** for `[Fix]`, **minor** for `[Feat]`, **major** for breaking changes. `[Chore]`/`[Docs]` commits normally do not bump. When several commits ship together, one bump for the batch is enough.

Examples (from this repo's history):

- `[Feat] Add hydra oauth2 flow`
- `[Fix] Sidebar option big gap issue in Safari`
- `[Chore] Add AGENTS.md and copilot-instructions.md`
- `[Docs] Update CLAUDE.md with commit format`
