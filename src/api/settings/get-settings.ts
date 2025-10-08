import {toast} from "vue-sonner"
import {useUserStore} from "@/store"
import {callApiResponse} from "@/api/call-api"

import type {
    APIResponse,
    UserSettings
} from "@/types"


export async function getSettings(): Promise<APIResponse<UserSettings>> {
    const response = await callApiResponse<UserSettings>("/api/user/{toolboxUserId}/get-settings", "GET")

    if (response.status === 200 && response.updatedData) {
        const userStore = useUserStore()
        userStore.setUser(response.updatedData)
        toast.success("同步设置成功", {description: "已成功同步当前账号的云端设置"})
    }

    if (response.status === 401) {
        const userStore = useUserStore()
        userStore.clearUser()
        toast.warning("同步设置失败", {description: "会话已过期，请重新登录"})
    }

    return response
}