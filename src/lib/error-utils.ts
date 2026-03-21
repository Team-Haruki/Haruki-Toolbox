import { isAxiosError } from "axios"
import { asRecord, readOptionalString } from "@/lib/record-utils"
import { translate } from "@/shared/i18n"

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
    if (isAxiosError(err)) {
        return getApiErrorMessage(err.response?.data) || err.message
    } else if (err instanceof Error) {
        return err.message
    }
    return defaultMessage
}
