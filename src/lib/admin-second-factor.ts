import { isAxiosError } from "axios"
import { asRecord, readOptionalString } from "@/lib/record-utils"

// The backend guards every admin route with RequireBrowserAAL2 and answers a
// session that has not passed a second factor with
//   403 {"status":403,"message":"administrator access requires two-factor authentication"}
// There is no machine-readable code, so status, admin prefix and message are
// matched together (as for the re-authentication 403 in `@/lib/admin-reauth`).
const ADMIN_API_PREFIX = "/api/admin/"
const SECOND_FACTOR_REQUIRED_MESSAGE = "administrator access requires two-factor authentication"

function requestPath(url: string | undefined): string {
    if (!url) return ""
    try {
        return new URL(url, "http://localhost").pathname
    } catch {
        return url
    }
}

/** True for the 403 an admin route returns to a session without a passed second factor. */
export function isAdminSecondFactorRequiredError(error: unknown): boolean {
    if (!isAxiosError(error) || error.response?.status !== 403) return false
    if (!requestPath(error.config?.url).startsWith(ADMIN_API_PREFIX)) return false
    const record = asRecord(error.response.data)
    const message = record ? readOptionalString(record, ["message"]) ?? "" : ""
    return message.trim().toLowerCase() === SECOND_FACTOR_REQUIRED_MESSAGE
}
