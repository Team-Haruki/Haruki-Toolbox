import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios"
import { toast } from "vue-sonner"
import { useUserStore } from "@/store"
import { useSettingsStore } from "@/settingsStore"
import type { Router } from "vue-router"
import type { ApiErrorResponse } from "@/types/response"

// Extend AxiosRequestConfig to include our custom property
declare module 'axios' {
    export interface AxiosRequestConfig {
        skipErrorToast?: boolean
    }
}

export const apiClient: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_HARUKI_TOOLBOX_USER_BASE_URL,
    timeout: 60000,
    headers: {
        "Content-Type": "application/json",
    },
})

export function setupInterceptors(router: Router) {
    apiClient.interceptors.request.use((config) => {
        const userStore = useUserStore()
        const settingsStore = useSettingsStore()

        // Dynamically set baseURL based on preferred endpoint
        config.baseURL = settingsStore.currentEndpoint

        if (userStore.sessionToken) {
            config.headers.set('Authorization', 'Bearer ' + userStore.sessionToken)
        }
        return config
    })

    apiClient.interceptors.response.use(
        (response) => response,
        async (error) => {
            const userStore = useUserStore()

            if (error.response?.status === 401) {
                if (userStore.sessionToken) {
                    toast.error("会话已过期", { description: "请重新登录" })
                    userStore.clearUser()
                    if (router.currentRoute.value.path !== "/user/login") {
                        await router.push("/user/login")
                    }
                }
            } else if (error.response?.status === 403) {
                // User is banned - clear state and redirect
                const data = error.response.data as ApiErrorResponse
                const banMessage = data?.message || "您的账号已被封禁"
                toast.error("账号已被封禁", { description: banMessage })
                userStore.clearUser()
                if (router.currentRoute.value.path !== "/user/login") {
                    await router.push("/user/login")
                }
            } else if (error.response && !error.config.skipErrorToast) {
                const data = error.response.data as ApiErrorResponse
                const message = data?.message || error.message
                toast.error("API请求失败", {
                    description: `状态码: ${error.response.status}，信息: ${message}`,
                })
            }
            return Promise.reject(error)
        }
    )
}

/**
 * Generic request wrapper that returns the response data directly.
 */
export async function request<T = unknown>(
    url: string,
    options: AxiosRequestConfig = {}
): Promise<T> {
    const response = await apiClient.request<T>({
        url,
        ...options,
    })
    return response.data
}
