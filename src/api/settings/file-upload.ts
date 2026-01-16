import {useUserStore} from "@/store"
import {apiClient} from "@/api/call-api"
import type {APIResponse} from "@/types";
import type { AxiosRequestConfig } from "axios";

export async function uploadManualData(
    server: string,
    gameUserId: string,
    dataType: string,
    file: Blob,
    onProgress?: (progress: number) => void,
    options?: AxiosRequestConfig
): Promise<APIResponse<null>> {
    const userStore = useUserStore()
    if (!userStore.userId) {
        throw new Error("用户未登录")
    }

    const url = `/manual/${server}/${gameUserId}/${dataType}/upload`

    const resp = await apiClient.post<APIResponse<null>>(url, file, {
        headers: {
            "Content-Type": "application/octet-stream",
        },
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                onProgress(percent)
            }
        },
        ...options
    })

    return resp.data
}
