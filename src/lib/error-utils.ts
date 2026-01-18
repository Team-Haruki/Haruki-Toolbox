import { isAxiosError } from "axios"
import type { ApiErrorResponse } from "@/types/response"

export function extractErrorMessage(err: unknown, defaultMessage: string = "操作失败"): string {
    if (isAxiosError(err)) {
        return (err.response?.data as ApiErrorResponse)?.message || err.message
    } else if (err instanceof Error) {
        return err.message
    }
    return defaultMessage
}
