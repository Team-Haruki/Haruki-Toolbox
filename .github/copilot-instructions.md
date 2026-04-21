# GitHub Copilot Instructions

## Repository Context

- This is the Haruki Toolbox frontend, not the backend repository.
- Stack: Vue 3, TypeScript, Vite, Bun, Pinia, Vue Router, Vue I18n, Tailwind CSS 4.
- Feature code is organized under `src/modules/<feature>/`.

## Code Generation Rules

- Prefer Vue 3 Composition API with `<script setup lang="ts">`.
- Use `@/` path aliases for imports.
- Keep route views thin; move reusable logic into `composables/` or `lib/`.
- Reuse existing UI primitives from `src/components/ui/` and shared components before adding new ones.
- Match the style and formatting of the surrounding file instead of reformatting unrelated code.

## API and Auth Rules

- Use `request()` from `src/core/http/call-api.ts` for business API requests.
- Do not create new Axios clients or hardcode API origins in feature code.
- API base URL is selected centrally via `useSettingsStore().currentEndpoint`.
- Kratos browser-flow logic belongs in `src/modules/auth/lib/kratos.ts` and related auth composables.
- Do not replace Kratos self-service flows with generic API calls unless the task explicitly requires that redesign.

## Session and Bootstrap Safety

- `src/main.ts`, `src/App.vue`, and `src/shared/stores/user.ts` are tightly coupled.
- Partial Kratos session data may not contain the full toolbox profile.
- Preserve cached user context during fallback session hydration unless logout/no-session is confirmed.
- Changes that affect `userId`, `isLoggedIn`, or `settingsSyncState` should be made carefully because they can break post-login settings sync.

## State and Routing

- Use `useUserStore()` for current user/session state.
- Use `useSettingsStore()` for endpoint, theme, and locale state.
- Keep route metadata consistent with existing `titleKey`, `requiresAuth`, `requiresAdmin`, and `requiresSuperAdmin` usage.

## Internationalization

- Put all user-facing strings in both:
  - `src/shared/i18n/messages/en-US.ts`
  - `src/shared/i18n/messages/zh-CN.ts`
- Do not leave new UI copy hardcoded in components unless unavoidable.

## Testing Expectations

After meaningful changes, prefer validating with:

- `bun run lint`
- `bun run typecheck`
- `bun run test`

Also consider:

- `bun run e2e` for routing, auth, bootstrap, or page-flow changes
- `bun run build` for larger UI or integration changes

## Commit Message Format

All commits must follow `[Type] Short description`:

- Allowed types: `[Feat]` (new feature), `[Fix]` (bug fix), `[Chore]` (maintenance, refactor, deps, build), `[Docs]` (docs-only).
- Description must start with a capital letter.
- Use imperative mood ("Add X", not "Added X").
- Do not end the subject line with a period.
- Keep it short.
- When an agent (Copilot, Claude Code, etc.) authors the commit, append a `Co-Authored-By:` trailer identifying the agent (blank line between subject and trailer).
- Bump `version` in `package.json` with every commit: **patch** (+0.0.1) for `[Fix]`, **minor** (+0.1.0) for `[Feat]`, **major** (+1.0.0) for breaking changes.

Examples (from this repo's history):

- `[Feat] Add hydra oauth2 flow`
- `[Fix] Sidebar option big gap issue in Safari`
- `[Chore] Add AGENTS.md and copilot-instructions.md`
- `[Docs] Update CLAUDE.md with commit format`
