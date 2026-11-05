import { asRecord } from "@/lib/record-utils"
import { UnexpectedPayloadError } from "@/modules/admin/lib/unexpected-payload"
import type { DashboardData } from "@/types/admin"

function hasNumbers(record: Record<string, unknown> | null, keys: readonly string[]): boolean {
  return record !== null && keys.every((key) => typeof record[key] === "number")
}

/** True when the payload carries the counters the dashboard renders. */
export function isDashboardPayload(value: unknown): value is DashboardData {
  const record = asRecord(value)
  if (!record) return false
  const users = asRecord(record.users)
  const bindings = asRecord(record.bindings)
  const uploads = asRecord(record.uploads)
  return hasNumbers(users, ["total", "banned", "admin", "superAdmin"])
    && hasNumbers(bindings, ["total", "verified"])
    && hasNumbers(uploads, ["total", "success", "failed"])
}

/** Returns the payload typed as dashboard data, or throws `UnexpectedPayloadError`. */
export function assertDashboardPayload(value: unknown): DashboardData {
  if (!isDashboardPayload(value)) {
    throw new UnexpectedPayloadError("/api/admin/statistics/dashboard")
  }
  return value
}
