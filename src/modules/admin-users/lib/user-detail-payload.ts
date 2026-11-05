import { asRecord } from "@/lib/record-utils"
import { UnexpectedPayloadError } from "@/modules/admin/lib/unexpected-payload"
import type { AdminUserDetail } from "@/types/admin"

/** True when the payload has the `userData` block the detail page renders. */
export function isUserDetailPayload(value: unknown): value is AdminUserDetail {
  const record = asRecord(value)
  if (!record) return false
  const userData = asRecord(record.userData)
  if (!userData) return false
  const userId = userData.userId
  return (typeof userId === "string" || typeof userId === "number")
    && typeof userData.name === "string"
    && typeof userData.role === "string"
}

/** Returns the payload typed as a user detail, or throws `UnexpectedPayloadError`. */
export function assertUserDetailPayload(value: unknown): AdminUserDetail {
  if (!isUserDetailPayload(value)) {
    throw new UnexpectedPayloadError("/api/admin/users/:id/detail")
  }
  return value
}
