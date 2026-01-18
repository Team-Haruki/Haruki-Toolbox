import {request} from "@/api/call-api";
import type {APIResponse, SekaiRegion} from "@/types";
import type { AxiosRequestConfig } from "axios";

export async function submitInherit(
    server: SekaiRegion,
    dataType: string,
    inherit_id: string,
    inherit_password: string,
    options?: AxiosRequestConfig
): Promise<APIResponse<null>> {
    const payload = {inherit_id, inherit_password}
    return await request<APIResponse<null>>(
        `/inherit/${server}/${dataType}/submit`,
        {
            method: "POST",
            data: payload,
            ...options
        }
    )
}
