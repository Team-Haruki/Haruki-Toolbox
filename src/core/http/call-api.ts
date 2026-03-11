import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios"
import { toast } from "vue-sonner"
import { useUserStore } from "@/shared/stores/user"
import { useSettingsStore } from "@/shared/stores/settings"
import { redirectToLogin } from "@/core/router/navigation"
import { getApiErrorMessage } from "@/lib/error-utils"
import { isAccountBannedMessage } from "@/lib/account-status"
import type { Router } from "vue-router"
import type { APIResponse } from "@/types/response"
import { translate } from "@/shared/i18n"

declare module 'axios' {
    export interface AxiosRequestConfig {
        skipErrorToast?: boolean
        retry?: number
        retryAttempt?: number
        retryMax?: number
    }
}

export const apiClient: AxiosInstance = axios.create({
    timeout: 60000,
    headers: {
        "Content-Type": "application/json",
    },
})

function generateRequestId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function isIdempotentMethod(method?: string): boolean {
    const normalizedMethod = (method ?? "GET").toUpperCase()
    return normalizedMethod === "GET" || normalizedMethod === "HEAD" || normalizedMethod === "OPTIONS"
}

function shouldRetry(error: unknown): error is AxiosError {
    if (!axios.isAxiosError(error)) {
        return false
    }

    const status = error.response?.status
    if (typeof status === "number" && status >= 500) {
        return true
    }

    return error.code === "ECONNABORTED" || error.code === "ERR_NETWORK"
}

async function retryDelay(attempt: number) {
    const delayMs = 150 * 2 ** Math.max(attempt - 1, 0)
    await new Promise((resolve) => setTimeout(resolve, delayMs))
}

export function setupInterceptors(router: Router) {
    apiClient.interceptors.request.use((config) => {
        const userStore = useUserStore()
        const settingsStore = useSettingsStore()
        config.baseURL = settingsStore.currentEndpoint
        if (!config.headers.get("X-Request-ID")) {
            config.headers.set("X-Request-ID", generateRequestId())
        }
        if (userStore.sessionToken) {
            config.headers.set('Authorization', `Bearer ${userStore.sessionToken}`)
        }
        return config
    })
    apiClient.interceptors.response.use(
        (response) => response,
        async (error) => {
            const retryAttempt = Number(error.config?.retryAttempt ?? 0)
            const retryMax = Number(error.config?.retryMax ?? 0)
            const willRetry = shouldRetry(error) && retryAttempt < retryMax
            if (willRetry) {
                return Promise.reject(error)
            }

            const userStore = useUserStore()
            if (error.response?.status === 401) {
                if (userStore.sessionToken) {
                    toast.error(translate("core.auth.sessionExpiredTitle"), {
                        description: translate("core.auth.sessionExpiredDescription"),
                    })
                    userStore.clearUser()
                    await redirectToLogin(router, { redirect: router.currentRoute.value.fullPath })
                }
            } else if (error.response?.status === 403) {
                const message = getApiErrorMessage(error.response.data) || translate("core.auth.permissionDeniedTitle")
                const isBanned = isAccountBannedMessage(message)

                if (isBanned) {
                    // Always surface banned reason before forcing logout redirect.
                    // This should not be suppressed by local skipErrorToast defaults.
                    toast.error(translate("core.auth.accountBannedTitle"), { description: message })
                    if (userStore.sessionToken) {
                        userStore.clearUser()
                        await redirectToLogin(router)
                    }
                } else if (!error.config?.skipErrorToast) {
                    toast.error(translate("core.auth.permissionDeniedTitle"), { description: message })
                }
            } else if (error.response && !error.config?.skipErrorToast) {
                const message = getApiErrorMessage(error.response.data) || error.message
                toast.error(translate("core.auth.apiRequestFailedTitle"), {
                    description: translate("core.auth.apiRequestFailedDescription", {
                        status: error.response.status,
                        message,
                    }),
                })
            }
            return Promise.reject(error)
        }
    )
}

export async function request<T = unknown>(
    url: string,
    options: AxiosRequestConfig = {}
): Promise<T> {
    const { retry, ...axiosOptions } = options
    const requestOptions: AxiosRequestConfig = {
        ...axiosOptions,
        // Most feature modules provide local error toasts. Default to local handling
        // to avoid duplicate toasts from both interceptor and page-level catches.
        skipErrorToast: axiosOptions.skipErrorToast ?? true,
    }
    const method = (requestOptions.method ?? "GET").toUpperCase()
    const maxRetries = retry ?? (isIdempotentMethod(method) ? 1 : 0)
    let attempt = 0

    while (true) {
        try {
            const response = await apiClient.request<T>({
                url,
                retryAttempt: attempt,
                retryMax: maxRetries,
                ...requestOptions,
            })
            return response.data
        } catch (error) {
            if (!shouldRetry(error) || attempt >= maxRetries) {
                throw error
            }

            attempt += 1
            await retryDelay(attempt)
        }
    }
}

export function unwrapUpdatedData<T>(response: APIResponse<T>, context = translate("common.apiResponse")): T {
    if (response.updatedData == null) {
        throw new Error(translate("common.missingUpdatedData", { context }))
    }
    return response.updatedData
}

export function readUpdatedItems<T>(
    updatedData: { items?: T[] } | T[] | null | undefined
): T[] {
    if (Array.isArray(updatedData)) {
        return updatedData
    }

    const items = updatedData?.items
    return Array.isArray(items) ? items : []
}

export function readUpdatedTotal(
    updatedData: { total?: number } | null | undefined
): number {
    return typeof updatedData?.total === "number" ? updatedData.total : 0
}
