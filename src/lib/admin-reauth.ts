import { isAxiosError } from "axios"
import { asRecord, readOptionalString } from "@/lib/record-utils"

// The backend guards sensitive admin routes (runtime config, public API keys,
// game-data cache purge, …) with RequireRecentAdminReauth. Without a recent
// POST /api/admin/me/reauth on the current session they answer
//   403 {"status":403,"message":"reauthentication required"}
// with no updatedData and no machine-readable code, so the status, the message
// and the admin API prefix are matched together.
export const ADMIN_REAUTH_ENDPOINT = "/api/admin/me/reauth"
const ADMIN_API_PREFIX = "/api/admin/"
const REAUTH_REQUIRED_MESSAGE = "reauthentication required"
const PASSWORD_MISMATCH_MESSAGE = "password mismatch"

function requestPath(url: string | undefined): string {
    if (!url) return ""
    try {
        return new URL(url, "http://localhost").pathname
    } catch {
        return url
    }
}

function responseMessage(data: unknown): string {
    const record = asRecord(data)
    return (record ? readOptionalString(record, ["message"]) ?? "" : "").trim().toLowerCase()
}

/** True for the 403 an admin route returns when the session needs a fresh password check. */
export function isAdminReauthRequiredError(error: unknown): boolean {
    if (!isAxiosError(error) || error.response?.status !== 403) return false
    const path = requestPath(error.config?.url)
    if (!path.startsWith(ADMIN_API_PREFIX) || path === ADMIN_REAUTH_ENDPOINT) return false
    return responseMessage(error.response.data) === REAUTH_REQUIRED_MESSAGE
}

/** Resolves true once the admin re-authenticated, false when they gave up. */
export type AdminReauthPrompt = () => Promise<boolean>

/**
 * Sends a request and, when it fails because the admin session needs a fresh
 * password check, asks `prompt` for one and sends it again exactly once. A
 * cancelled prompt rethrows the original error; a second reauth-required
 * failure after a successful prompt goes back to the caller instead of
 * reopening the prompt.
 */
export async function withAdminReauthRetry<T>(send: () => Promise<T>, prompt: AdminReauthPrompt): Promise<T> {
    try {
        return await send()
    } catch (error) {
        if (!isAdminReauthRequiredError(error)) throw error
        const reauthenticated = await prompt().catch(() => false)
        if (!reauthenticated) throw error
        return await send()
    }
}

/**
 * Holds the prompt the admin shell registers. Requests that hit the reauth
 * check while a prompt is open share it instead of stacking dialogs; without a
 * registered prompt the original error goes back to the caller.
 */
export function createAdminReauthGate() {
    let prompt: AdminReauthPrompt | null = null
    let pending: Promise<boolean> | null = null

    function register(next: AdminReauthPrompt): () => void {
        prompt = next
        return () => {
            if (prompt === next) prompt = null
        }
    }

    function request(): Promise<boolean> {
        if (!prompt) return Promise.resolve(false)
        pending ??= prompt()
            .catch(() => false)
            .finally(() => {
                pending = null
            })
        return pending
    }

    return { register, request }
}

/**
 * How a POST /api/admin/me/reauth failure is handled by the dialog:
 * - `passwordMismatch` (403 "password mismatch"): inline, the admin may retry.
 * - `rejected` (any other 403, e.g. an account that cannot verify a password): inline, generic.
 * - `passwordRequired` / `invalidInput` (400 "password is required" / invalid payload): inline validation.
 * - `fatal` (401 invalid session, 500, network): close the dialog with a toast.
 */
export type AdminReauthFailure = "passwordMismatch" | "rejected" | "passwordRequired" | "invalidInput" | "fatal"

export function classifyAdminReauthFailure(error: unknown): AdminReauthFailure {
    if (!isAxiosError(error)) return "fatal"
    const status = error.response?.status
    const message = responseMessage(error.response?.data)
    if (status === 403) {
        return message === PASSWORD_MISMATCH_MESSAGE ? "passwordMismatch" : "rejected"
    }
    if (status === 400) {
        return message === "password is required" ? "passwordRequired" : "invalidInput"
    }
    return "fatal"
}
