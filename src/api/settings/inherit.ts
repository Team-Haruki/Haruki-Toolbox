import {callApiResponse} from "@/api/call-api";
import type {APIResponse, SekaiRegion} from "@/types";

export async function submitInherit(
    server: SekaiRegion,
    dataType: string,
    inherit_id: string,
    inherit_password: string,
): Promise<APIResponse<null>> {
    const payload = {inherit_id, inherit_password}
    return await callApiResponse<null>(
        `/inherit/${server}/${dataType}/submit`,
        "POST",
        payload
    )
}