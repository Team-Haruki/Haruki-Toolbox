import { isJsonRecord } from "@/lib/json-utils"
import { asRecord } from "@/lib/record-utils"
import type { RiskRuleDraft, RiskRuleItem } from "@/modules/admin-risk/api/types"

/** Limits the backend enforces on PUT /api/admin/risk/rules. */
export const RISK_RULE_KEY_MAX_LENGTH = 64
export const RISK_RULES_MAX_PER_SAVE = 100

export type RiskRulesParseError =
  | { kind: "invalidJson" }
  | { kind: "notArray" }
  | { kind: "tooMany"; max: number }
  /** `index` is the 1-based position of the first entry that is not a rule object. */
  | { kind: "invalidRule"; index: number }
  /** `index` is the 1-based position of the second rule with this key. */
  | { kind: "duplicateKey"; index: number; key: string }

export type RiskRulesParseResult =
  | { ok: true; rules: RiskRuleDraft[] }
  | { ok: false; error: RiskRulesParseError }

function parseRule(item: unknown): RiskRuleDraft | null {
  const record = asRecord(item)
  if (!record) return null

  const { key, description, config } = record
  if (typeof key !== "string") return null
  const trimmedKey = key.trim()
  if (!trimmedKey || trimmedKey.length > RISK_RULE_KEY_MAX_LENGTH) return null

  if (description !== undefined && description !== null && typeof description !== "string") return null
  if (config !== undefined && config !== null && !isJsonRecord(config)) return null

  return {
    key: trimmedKey,
    description: typeof description === "string" ? description.trim() : "",
    config: config ? config : {},
  }
}

/**
 * Validates the rules editor text: JSON, an array of at most 100 entries,
 * every entry a rule (`key`: 1–64 characters, optional string `description`,
 * optional object `config`) and no key twice. The first failure is reported
 * with its position, so the editor can show it inline while typing. Members
 * the backend sets itself (`updatedAt`, `updatedBy`) are ignored.
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
  if (parsed.length > RISK_RULES_MAX_PER_SAVE) {
    return { ok: false, error: { kind: "tooMany", max: RISK_RULES_MAX_PER_SAVE } }
  }

  const rules: RiskRuleDraft[] = []
  const seen = new Set<string>()
  for (const [index, item] of parsed.entries()) {
    const rule = parseRule(item)
    if (!rule) {
      return { ok: false, error: { kind: "invalidRule", index: index + 1 } }
    }
    if (seen.has(rule.key)) {
      return { ok: false, error: { kind: "duplicateKey", index: index + 1, key: rule.key } }
    }
    seen.add(rule.key)
    rules.push(rule)
  }

  return { ok: true, rules }
}

/** The editor text for a rule set: the three editable members of each rule. */
export function formatRiskRules(rules: readonly RiskRuleDraft[]): string {
  return JSON.stringify(
    rules.map((rule) => ({ key: rule.key, description: rule.description, config: rule.config })),
    null,
    2,
  )
}

/** JSON with object keys sorted, so two configs compare by content, not by key order. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>
    // Code-unit order: the same on every machine, unlike a locale-aware sort.
    const keys = Object.keys(record).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`
  }
  return JSON.stringify(value) ?? "null"
}

export type RiskRuleChange = "new" | "changed" | "unchanged"

export type RiskRuleDiffEntry = {
  rule: RiskRuleDraft
  change: RiskRuleChange
  /** The stored rule with the same key, when there is one. */
  saved: RiskRuleItem | null
}

export type RiskRulesDiff = {
  entries: RiskRuleDiffEntry[]
  added: number
  changed: number
  /** Keys of stored rules the draft does not list. Saving leaves them as they are. */
  omitted: string[]
}

/**
 * What saving `draft` would do to the stored rules: which entries are new,
 * which change a description or a config, and which stored rules the draft
 * leaves out (the backend upserts by key, so those stay untouched).
 */
export function diffRiskRules(saved: readonly RiskRuleItem[], draft: readonly RiskRuleDraft[]): RiskRulesDiff {
  const savedByKey = new Map(saved.map((rule) => [rule.key, rule]))
  const draftKeys = new Set(draft.map((rule) => rule.key))

  const entries = draft.map((rule): RiskRuleDiffEntry => {
    const stored = savedByKey.get(rule.key) ?? null
    if (!stored) return { rule, change: "new", saved: null }
    const same = stored.description.trim() === rule.description.trim()
      && stableStringify(stored.config) === stableStringify(rule.config)
    return { rule, change: same ? "unchanged" : "changed", saved: stored }
  })

  return {
    entries,
    added: entries.filter((entry) => entry.change === "new").length,
    changed: entries.filter((entry) => entry.change === "changed").length,
    omitted: saved.map((rule) => rule.key).filter((key) => !draftKeys.has(key)),
  }
}

/** The stored rules after the backend answered a save with `updated`, sorted by key like the list endpoint. */
export function mergeSavedRiskRules(saved: readonly RiskRuleItem[], updated: readonly RiskRuleItem[]): RiskRuleItem[] {
  const byKey = new Map(saved.map((rule) => [rule.key, rule]))
  for (const rule of updated) byKey.set(rule.key, rule)
  return [...byKey.values()].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
}
