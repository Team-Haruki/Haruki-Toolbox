import { isJsonRecord } from "@/lib/json-utils"
import { asRecord } from "@/lib/record-utils"
import type { RiskRule } from "@/types/admin"

export type RiskRulesParseError =
  | { kind: "invalidJson" }
  | { kind: "notArray" }
  /** `index` is the 1-based position of the first rule that is not a rule object. */
  | { kind: "invalidRule"; index: number }

export type RiskRulesParseResult =
  | { ok: true; rules: RiskRule[] }
  | { ok: false; error: RiskRulesParseError }

function parseRule(item: unknown): RiskRule | null {
  const record = asRecord(item)
  if (!record) return null

  const { id, name, description, enabled, config } = record
  if (
    typeof id !== "string" ||
    typeof name !== "string" ||
    typeof description !== "string" ||
    typeof enabled !== "boolean"
  ) {
    return null
  }

  if (config !== undefined && config !== null && !isJsonRecord(config)) {
    return null
  }

  return {
    id,
    name,
    description,
    enabled,
    config: config ? config : undefined,
  }
}

/**
 * Validates the rules editor text: JSON, an array, and every entry a rule
 * (`id`, `name`, `description` strings, `enabled` boolean, optional object
 * `config`). The first failure is reported with its position, so the editor
 * can show it inline while typing.
 */
export function parseRiskRules(raw: string): RiskRulesParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: { kind: "invalidJson" } }
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, error: { kind: "notArray" } }
  }

  const rules: RiskRule[] = []
  for (const [index, item] of parsed.entries()) {
    const rule = parseRule(item)
    if (!rule) {
      return { ok: false, error: { kind: "invalidRule", index: index + 1 } }
    }
    rules.push(rule)
  }

  return { ok: true, rules }
}

/** The editor text for a rule set; `parseRiskRules` of it round-trips. */
export function formatRiskRules(rules: readonly RiskRule[]): string {
  return JSON.stringify(rules, null, 2)
}
