import { isAxiosError } from "axios"
import type { ApiErrorResponse } from "@/types/response"

/**
 * Extracts a user-friendly error message from an unknown error.
 * @param err The caught error (of unknown type)
 * @param defaultMessage Fallback message if no specific message can be extracted
 * @returns A string suitable for display to the user
 */
export function extractErrorMessage(err: unknown, defaultMessage: string = "操作失败"): string {
    if (isAxiosError(err)) {
        return (err.response?.data as ApiErrorResponse)?.message || err.message
    } else if (err instanceof Error) {
        return err.message
    }
    return defaultMessage
}
