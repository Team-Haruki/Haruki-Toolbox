import {toast} from "vue-sonner";
import {callApi} from "@/components/users/data/api/call-api"
import type {
    APIResponse,
    ChangePasswordPayload
} from "@/components/users/data/types"

export async function changePassword(password: string): Promise<APIResponse<null>> {
    const payload: ChangePasswordPayload = {password}
    return await callApi<null>(
        "/api/user/{toolboxUserId}/change-password",
        "PUT",
        payload
    )
}
