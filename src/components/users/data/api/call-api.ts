import axios, {type AxiosRequestConfig, type Method} from "axios"
import {useUserStore} from "@/components/users/data/store"

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_HARUKI_TOOLBOX_USER_BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
})
apiClient.interceptors.request.use((config) => {
    const userStore = useUserStore()
    if (userStore.sessionToken) {
        config.headers = {
            ...config.headers,
            Authorization: `${userStore.sessionToken}`,
        }
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
): Promise<T> {
    const response = await apiClient.request<T>({
        url: endpoint,
        method,
        data,
        ...config,
    })

    if (isApiResponse<T>(response.data)) {
        return response.data as unknown as T
    }

    return response.data
}