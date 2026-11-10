import type { RuntimeConfig } from "@/types/admin"

/**
 * Read-only facts the runtime configuration reports (`GET
 * /api/admin/config/runtime`). The backend never sends a secret back, only
 * whether one is set; a member an older backend does not send reads as
 * unknown (`null`) rather than as "not set".
 */

/** The `…Configured` members: whether each secret has a value. */
export const RUNTIME_SECRET_KEYS = [
  "privateApiTokenConfigured",
  "harukiProxySecretConfigured",
  "harukiProxyUnpackKeyConfigured",
  "webhookJwtSecretConfigured",
] as const

export type RuntimeSecretKey = (typeof RUNTIME_SECRET_KEYS)[number]

/** The plain-text members shown as they are. */
export const RUNTIME_TEXT_KEYS = [
  "privateApiUserAgent",
  "harukiProxyUserAgent",
  "harukiProxyVersion",
] as const

export type RuntimeTextKey = (typeof RUNTIME_TEXT_KEYS)[number]

/** A boolean member, or null when the backend did not send one. */
export function readRuntimeFlag(config: RuntimeConfig | null | undefined, key: string): boolean | null {
  const value = config?.[key]
  return typeof value === "boolean" ? value : null
}

/** A text member, trimmed; null when the backend did not send one. */
export function readRuntimeText(config: RuntimeConfig | null | undefined, key: string): string | null {
  const value = config?.[key]
  return typeof value === "string" ? value.trim() : null
}

/** How many of the secrets the backend reports on are set. */
export function summarizeRuntimeSecrets(config: RuntimeConfig | null | undefined): { configured: number; known: number } {
  let configured = 0
  let known = 0
  for (const key of RUNTIME_SECRET_KEYS) {
    const flag = readRuntimeFlag(config, key)
    if (flag === null) continue
    known += 1
    if (flag) configured += 1
  }
  return { configured, known }
}
