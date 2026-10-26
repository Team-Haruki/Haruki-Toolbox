import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { translate } from "@/shared/i18n"
import { normalizeDeckRecommendWorkerError } from "./worker-error"

type EngineErrorRule = {
  pattern: RegExp
  resolve: (match: RegExpExecArray) => { key: string; params?: Record<string, unknown> }
}

/**
 * Engine / app-code failure strings mapped to `deckRecommend.errors.*` keys
 * that say what went wrong and what to try next. Patterns are tested against
 * the normalized worker message; the first match wins.
 */
const ENGINE_ERROR_RULES: readonly EngineErrorRule[] = [
  {
    pattern: /cannot recommend any deck in (\d+) cards/i,
    resolve: (match) => ({ key: "notEnoughCards", params: { count: Number(match[1]) } }),
  },
  { pattern: /current deck requires 5 cards/i, resolve: () => ({ key: "currentDeckIncomplete" }) },
  { pattern: /music_id is required|music_diff is required/i, resolve: () => ({ key: "musicRequired" }) },
  { pattern: /target_bonus_list is required/i, resolve: () => ({ key: "bonusTargetsRequired" }) },
  { pattern: /specific_skill_order is required/i, resolve: () => ({ key: "skillOrderRequired" }) },
  { pattern: /world_bloom_(event_turn|character_id)|event_unit is required for world_bloom/i, resolve: () => ({ key: "worldBloomConfigInvalid" }) },
  { pattern: /event_attr and event_unit are required/i, resolve: () => ({ key: "eventConditionRequired" }) },
  { pattern: /at least one algorithm is required/i, resolve: () => ({ key: "algorithmRequired" }) },
  { pattern: /toolbox user is required|game account is required/i, resolve: () => ({ key: "accountRequired" }) },
  { pattern: /master data is (not ready|missing)|music metas are not ready/i, resolve: () => ({ key: "masterNotReady" }) },
  { pattern: /timed out/i, resolve: () => ({ key: "timeout" }) },
  { pattern: /wasm engine failed|worker (failed|is not ready)|Exception/i, resolve: () => ({ key: "engineFailed" }) },
]

/**
 * User-facing text for a failed recommendation. Transport/backend failures
 * go through `describeError`; known engine messages become localized
 * `deckRecommend.errors.*` text with next steps; anything else falls back to
 * "推荐失败" with the raw message kept as a detail line.
 */
export function describeDeckRecommendError(error: unknown): ErrorDescription {
  const fallback = translate("deckRecommend.errors.unknown")
  const raw = normalizeDeckRecommendWorkerError(error)
  for (const rule of ENGINE_ERROR_RULES) {
    const match = rule.pattern.exec(raw)
    if (match) {
      const { key, params } = rule.resolve(match)
      return { message: translate(`deckRecommend.errors.${key}`, params), detail: raw }
    }
  }

  const described = describeError(error, fallback)
  // `describeError` passes app-code Error messages through as if they were
  // translated; engine strings are not, so keep them as the detail instead.
  if (error instanceof Error && described.message === raw) {
    return { message: fallback, detail: raw }
  }
  return described
}

/** The names of every `deckRecommend.errors.*` key the mapper can produce, for locale checks. */
export const DECK_RECOMMEND_ERROR_KEYS: readonly string[] = [
  "unknown",
  "notEnoughCards",
  "currentDeckIncomplete",
  "musicRequired",
  "bonusTargetsRequired",
  "skillOrderRequired",
  "worldBloomConfigInvalid",
  "eventConditionRequired",
  "algorithmRequired",
  "accountRequired",
  "masterNotReady",
  "timeout",
  "engineFailed",
]
