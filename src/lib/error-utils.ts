import { isAxiosError } from "axios"
import { asRecord, readOptionalString, readString } from "@/lib/record-utils"
import { translate } from "@/shared/i18n"
import { isAdminReauthRequiredError } from "@/lib/admin-reauth"

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

export function extractErrorMessage(err: unknown, defaultMessage: string = translate("common.actionFailed")): string {
    if (isAdminReauthRequiredError(err)) {
        // Left over when the admin cancels the password prompt.
        return translate("core.auth.reauthRequired")
    }
    if (isAxiosError(err)) {
        return getApiErrorMessage(err.response?.data) || err.message
    } else if (err instanceof Error) {
        return err.message
    }
    return defaultMessage
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
