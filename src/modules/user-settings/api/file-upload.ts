import {useUserStore} from "@/shared/stores/user"
import {apiClient} from "@/core/http/call-api"
import { encodePathSegment } from "@/core/http/url"
import { translate } from "@/shared/i18n"
import type {APIResponse, SekaiRegion, UploadDataType} from "@/types";
import type { AxiosRequestConfig } from "axios";

export async function uploadManualData(
    server: SekaiRegion,
    gameUserId: string,
    dataType: UploadDataType,
    file: Blob,
    onProgress?: (progress: number) => void,
    options?: AxiosRequestConfig
): Promise<APIResponse<null>> {
    const userStore = useUserStore()
    if (!userStore.userId) {
        throw new Error(translate("userSettings.common.missingUserDescription"))
    }

    const url = `/manual/${encodePathSegment(server)}/${encodePathSegment(gameUserId)}/${encodePathSegment(dataType)}/upload`

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
