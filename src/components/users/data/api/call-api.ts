import {toast} from "vue-sonner"
import axios, {type AxiosRequestConfig, type Method} from "axios"
import {useUserStore} from "@/components/users/data/store"
import type { APIResponse } from "../types"

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_HARUKI_TOOLBOX_USER_BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
})
apiClient.interceptors.request.use((config) => {
    const userStore = useUserStore()
    if (userStore.sessionToken) {
        config.headers.set('Authorization', userStore.sessionToken)
    }
    if (config.url && userStore.userId) {
        config.url = config.url.replace(`/api/user/{toolboxUserId}`, `/api/user/${userStore.userId}`)
    }
    return config
})

function isApiResponse<T>(data: any): data is APIResponse<T> {
    return (
        typeof data === "object" &&
        data !== null &&
        "status" in data &&
        "message" in data
    )
}

export async function callApi<T = unknown>(
    endpoint: string,
    method: Method = "GET",
    data?: any,
    config?: AxiosRequestConfig
): Promise<APIResponse<T>> {
    const response = await apiClient.request<APIResponse<T>>({
        url: endpoint,
        method,
        data,
        ...config,
    })

    if (isApiResponse<T>(response.data)) {
        if (response.data.status !== 200) {
            toast.error("API请求失败", {description: `状态码: ${response.data.status}，信息: ${response.data.message}`})
            throw response.data
        }
        return response.data
    }

    toast.error("API请求失败", {description: `无效的响应格式`})

    throw {
        status: 500,
        message: "Invalid API response format",
    }
}