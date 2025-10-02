import {callApi} from "@/components/users/data/api/call-api";
import type {APIResponse, SekaiRegion} from "@/components/users/data/types";

export async function submitInherit(
    server: SekaiRegion,
    dataType: string,
    inherit_id: string,
    inherit_password: string,
): Promise<APIResponse<null>> {
    const payload = {inherit_id, inherit_password}
    return await callApi<null>(
        `/inherit/${server}/${dataType}/submit`,
        "POST",
        payload
    )
}