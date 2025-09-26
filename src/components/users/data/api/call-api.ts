import axios, { AxiosRequestConfig, Method } from "axios"
import { useUserStore } from "@/stores/user"

const apiClient = axios.create({
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
            Authorization: `Bearer ${userStore.sessionToken}`,
        }
    }
    return config
})

export async function callApi<T = any>(
    endpoint: string,
    method: Method = "GET",
    data?: any,
    config?: AxiosRequestConfig
): Promise<T> {
    try {
        const response = await apiClient.request<T>({
            url: endpoint,
            method,
            data,
            ...config,
        })
        return response.data
    } catch (error: any) {
        if (error.response) {
            console.error("API Error:", error.response.data)
            throw new Error(error.response.data?.message || "API request failed")
        } else if (error.request) {
            console.error("No response from API:", error.request)
            throw new Error("No response from API")
        } else {
            console.error("API setup error:", error.message)
            throw new Error(error.message)
        }
    }
}