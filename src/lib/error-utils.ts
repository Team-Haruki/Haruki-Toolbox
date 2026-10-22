import { isAxiosError, type AxiosError } from "axios"
import { asRecord, readOptionalString, readString } from "@/lib/record-utils"
import { translate } from "@/shared/i18n"
import { isAdminReauthCancelledError, isAdminReauthRequiredError } from "@/lib/admin-reauth"
import { resolveBackendMessage } from "@/lib/backend-messages"

export function getApiErrorMessage(payload: unknown): string | undefined {
    const record = asRecord(payload)
    if (!record) return undefined
    return (
        readOptionalString(record, ["message"]) ??
        readOptionalString(record, ["error_description", "errorDescription"]) ??
        readOptionalString(record, ["detail"]) ??
        readOptionalString(record, ["error"])
    )
}

export type TransportErrorKind = "network" | "timeout" | "rateLimited" | "serverUnavailable"

export interface TransportError {
    kind: TransportErrorKind
    status?: number
}

const TIMEOUT_CODES = new Set(["ECONNABORTED", "ETIMEDOUT"])
const FETCH_NETWORK_MESSAGE_RE = /failed to fetch|networkerror|network request failed|load failed/i

function classifyAxiosTransport(error: AxiosError): TransportError | null {
    const response = error.response
    if (!response) {
        if (error.code === "ERR_CANCELED") return null
        if (TIMEOUT_CODES.has(error.code ?? "") || /timeout/i.test(error.message)) {
            return { kind: "timeout" }
        }
        return { kind: "network" }
    }

    const status = response.status
    if (status === 429) {
        return { kind: "rateLimited", status }
    }
    if (status >= 500) {
        return { kind: "serverUnavailable", status }
    }
    // A gateway or static error page instead of the backend's JSON envelope.
    if (status >= 400 && !asRecord(response.data)) {
        return { kind: "serverUnavailable", status }
    }
    return null
}

/**
 * Classifies failures that never carry a meaningful backend message: the
 * request did not reach the server, timed out, was rate limited, or the server
 * (or a proxy in front of it) answered with an error page.
 */
export function classifyTransportError(err: unknown): TransportError | null {
    if (isAxiosError(err)) {
        return classifyAxiosTransport(err)
    }
    if (typeof DOMException !== "undefined" && err instanceof DOMException) {
        if (err.name === "TimeoutError") return { kind: "timeout" }
        if (err.name === "AbortError") return null
    }
    if (err instanceof TypeError && FETCH_NETWORK_MESSAGE_RE.test(err.message)) {
        return { kind: "network" }
    }
    return null
}

function translateTransportError(transport: TransportError): string {
    return translate(`core.errors.${transport.kind}`, { status: transport.status ?? "" })
}

export interface ErrorDescription {
    /** What happened and what to do next, in the user's language. */
    message: string
    /** The raw backend text when it could not be translated, for support; render it small. */
    detail?: string
}

const DETAIL_MAX_LENGTH = 240

function normalizeDetail(raw: string | undefined): string | undefined {
    const trimmed = raw?.trim() ?? ""
    if (!trimmed) return undefined
    return trimmed.length > DETAIL_MAX_LENGTH ? `${trimmed.slice(0, DETAIL_MAX_LENGTH - 1)}…` : trimmed
}

/**
 * Turns any thrown value into user-facing text. Known backend messages and
 * transport failures are translated; anything else becomes the caller's
 * fallback with the raw backend message kept as `detail`. Axios' own messages
 * ("Network Error", "Request failed with status code 502") never reach the user.
 */
export function describeError(err: unknown, fallback: string = translate("common.actionFailed")): ErrorDescription {
    if (isAdminReauthCancelledError(err) || isAdminReauthRequiredError(err)) {
        // A cancelled prompt is a no-op the toast helpers skip (`shouldReportError`);
        // this text only backs call sites that report every error themselves.
        return { message: translate("core.auth.reauthRequired") }
    }

    if (isAxiosError(err)) {
        const raw = getApiErrorMessage(err.response?.data)?.trim()
        const mapped = resolveBackendMessage(raw)
        if (mapped) {
            return { message: translate(mapped.key, mapped.params) }
        }
        const transport = classifyAxiosTransport(err)
        if (transport) {
            return { message: translateTransportError(transport), detail: normalizeDetail(raw) }
        }
        return { message: fallback, detail: normalizeDetail(raw) }
    }

    const transport = classifyTransportError(err)
    if (transport) {
        return { message: translateTransportError(transport) }
    }

    if (err instanceof Error) {
        const raw = err.message.trim()
        if (!raw) {
            return { message: fallback }
        }
        const mapped = resolveBackendMessage(raw)
        if (mapped) {
            return { message: translate(mapped.key, mapped.params) }
        }
        // Errors thrown by app code already carry translated text.
        return { message: raw }
    }

    if (typeof err === "string" && err.trim()) {
        const mapped = resolveBackendMessage(err)
        return mapped ? { message: translate(mapped.key, mapped.params) } : { message: fallback, detail: normalizeDetail(err) }
    }

    return { message: fallback }
}

/**
 * `describeError` flattened to one string: the message, plus a "Details: …"
 * line when an untranslated backend message is available.
 */
export function extractErrorMessage(err: unknown, defaultMessage: string = translate("common.actionFailed")): string {
    const { message, detail } = describeError(err, defaultMessage)
    return detail ? `${message}\n${translate("core.errors.detail", { detail })}` : message
}

/**
 * False for failures the user chose themselves, such as cancelling the admin
 * password prompt: nothing ran, so there is nothing to report. Error toasts and
 * inline error lines check this before showing anything.
 */
export function shouldReportError(error: unknown): boolean {
    return !isAdminReauthCancelledError(error)
}

/** The HTTP status of a failed API call, or null when the request never got a response. */
export function readApiErrorStatus(error: unknown): number | null {
    return isAxiosError(error) ? error.response?.status ?? null : null
}

/**
 * True when the backend answered 404: the record the page asked for does not
 * exist, which pages show as "not found" instead of a retryable load failure.
 */
export function isNotFoundError(error: unknown): boolean {
    return readApiErrorStatus(error) === 404
}

/** `updatedData.code` of a failed API call, or "" when it has none. */
export function readApiErrorCode(error: unknown): string {
    if (!isAxiosError(error)) {
        return ""
    }
    const body = asRecord(error.response?.data)
    const updatedData = body ? asRecord(body.updatedData) : null
    return updatedData ? readString(updatedData, ["code"]).trim() : ""
}
