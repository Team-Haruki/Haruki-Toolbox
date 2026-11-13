import { isAxiosError } from "axios"
import type { BotNeoRegistrationResult } from "@/modules/haruki-bot-neo/api/registration"

/** The NEO distributed-bot QQ group a registered owner joins. */
export const BOT_NEO_QQ_GROUP = "111612548"

export type BotNeoStep = "input" | "verify" | "result"

/** The three steps in the order the page walks them. */
export const BOT_NEO_STEPS: readonly BotNeoStep[] = ["input", "verify", "result"]

export type BotNeoFieldIssue = "missing" | "invalid"

export type BotNeoFieldCheck<T> =
  | { ok: true; value: T }
  | { ok: false; issue: BotNeoFieldIssue }

const QQ_NUMBER_PATTERN = /^[1-9]\d{4,11}$/
const VERIFICATION_CODE_PATTERN = /^\d{6}$/

/** A QQ number is 5–12 digits and never starts with 0. */
export function checkQQNumber(input: string): BotNeoFieldCheck<number> {
  const raw = input.trim()
  if (!raw) return { ok: false, issue: "missing" }
  if (!QQ_NUMBER_PATTERN.test(raw)) return { ok: false, issue: "invalid" }
  return { ok: true, value: Number(raw) }
}

/** The mailed code is exactly six digits. */
export function checkVerificationCode(input: string): BotNeoFieldCheck<string> {
  const code = input.trim()
  if (!code) return { ok: false, issue: "missing" }
  if (!VERIFICATION_CODE_PATTERN.test(code)) return { ok: false, issue: "invalid" }
  return { ok: true, value: code }
}

/** Seconds to wait after a 429, from its `Retry-After` header; null for anything else. */
export function parseRetryAfterSeconds(error: unknown): number | null {
  if (!isAxiosError(error) || error.response?.status !== 429) return null
  const header = error.response.headers?.["retry-after"]
  if (!header) return null
  const seconds = Number(header)
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null
}

/** The HTTP status of a failed request, or null when it never got a response. */
export function readErrorStatus(error: unknown): number | null {
  return isAxiosError(error) ? error.response?.status ?? null : null
}

/** Where a step sits relative to the current one, for the step strip. */
export function resolveStepState(step: BotNeoStep, current: BotNeoStep): "done" | "current" | "upcoming" {
  const index = BOT_NEO_STEPS.indexOf(step)
  const currentIndex = BOT_NEO_STEPS.indexOf(current)
  if (index < currentIndex) return "done"
  return index === currentIndex ? "current" : "upcoming"
}

function normalizeRouteValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ""
  }

  return String(value).trim()
}

/**
 * The config generator link of a finished registration: it carries the new
 * bot's id and credential so the form opens filled in. The owner falls back to
 * the QQ number that was just registered.
 */
export function buildConfigGeneratorLocation(
  result: BotNeoRegistrationResult | null,
  qqNumber: string,
): { path: string; query: { ownerId: string; botId: string; credential: string } } {
  return {
    path: "/client-config-generator",
    query: {
      ownerId: normalizeRouteValue(result?.owner_id ?? result?.ownerId ?? qqNumber),
      botId: result?.bot_id ?? "",
      credential: result?.credential ?? "",
    },
  }
}
