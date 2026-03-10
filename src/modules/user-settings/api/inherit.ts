import {request} from "@/core/http/call-api";
import { encodePathSegment } from "@/core/http/url"
import type {APIResponse, SekaiRegion, UploadDataType} from "@/types";
import type { AxiosRequestConfig } from "axios";

export async function submitInherit(
    server: SekaiRegion,
    dataType: UploadDataType,
    inherit_id: string,
    inherit_password: string,
    options?: AxiosRequestConfig
): Promise<APIResponse<null>> {
    const payload = {inherit_id, inherit_password}
    return await request<APIResponse<null>>(
        `/inherit/${encodePathSegment(server)}/${encodePathSegment(dataType)}/submit`,
        {
            method: "POST",
            data: payload,
            ...options
        }
    )
}
