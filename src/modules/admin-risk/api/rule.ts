import { request, unwrapUpdatedData } from "@/core/http/call-api"
import { isJsonRecord } from "@/lib/json-utils"
import { asRecord, readString } from "@/lib/record-utils"
import { translate } from "@/shared/i18n"
import type { APIResponse } from "@/types/response"
import type { RiskRuleDraft, RiskRuleItem } from "./types"

const BASE = "/api/admin/risk"

export function normalizeRiskRule(value: unknown): RiskRuleItem | null {
  const record = asRecord(value)
  if (!record) return null

  const key = readString(record, ["key"]).trim()
  if (!key) return null

  return {
    key,
    description: readString(record, ["description"]),
    config: isJsonRecord(record.config) ? record.config : {},
    updatedAt: readString(record, ["updatedAt"]).trim(),
    updatedBy: readString(record, ["updatedBy"]).trim(),
  }
}

/** The `items` of a rule list response (`{ generatedAt, items }`). */
export function normalizeRiskRuleList(value: unknown): RiskRuleItem[] {
  const record = asRecord(value)
  const rawItems = Array.isArray(record?.items) ? record.items : []
  return rawItems
    .map((item) => normalizeRiskRule(item))
    .filter((item): item is RiskRuleItem => item !== null)
}

export async function getRiskRules(): Promise<RiskRuleItem[]> {
  const res = await request<APIResponse<unknown>>(`${BASE}/rules`, { method: "GET" })
  return normalizeRiskRuleList(unwrapUpdatedData(res, translate("adminRisk.toast.loadRulesFailedTitle")))
}

/**
 * Upserts the given rules by key (super admin only) and returns them as
 * stored. Rules that are not in the request are left as they are.
 */
export async function updateRiskRules(rules: readonly RiskRuleDraft[]): Promise<RiskRuleItem[]> {
  const res = await request<APIResponse<unknown>>(`${BASE}/rules`, { method: "PUT", data: { rules } })
  return normalizeRiskRuleList(res.updatedData)
}
