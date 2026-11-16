import { formatFileTimestamp } from "@/lib/csv"
import { request } from "@/core/http/call-api"
import { buildUserApiPath } from "@/core/http/path"
import type { SekaiRegion } from "@/types"
import { normalizeSuiteUploadTime, suiteUploadTimeToMillis } from "./api"

export type UserSuiteExport = {
  fileName: string
  /** The Suite as JSON text, as the server serves it. */
  json: string
}

/**
 * Everything the server serves of an account's uploaded Suite, for the viewer
 * to keep as a file. Asking with no keys returns every table on the backend's
 * allowlist (`others.allowed_keys`, with `userGamedata` cut to a few fields),
 * which is less than the raw upload. The local cache holds only the subsets
 * pages asked for, so this always reads the server.
 */
export async function fetchUserSuiteExport(
  params: { toolboxUserId: string | number; server: SekaiRegion; gameUserId: string | number },
  dependencies: { request: typeof request; now: () => number } = {
    request,
    now: Date.now,
  },
): Promise<UserSuiteExport> {
  // Keep the response text intact: parsing then stringifying rounds every
  // numeric game ID above 2^53, including IDs nested in other Suite tables.
  const json = await dependencies.request<string>(
    buildUserApiPath(params.toolboxUserId, "game-account", params.server, params.gameUserId, "suite"),
    { responseType: "text" },
  )
  const data: unknown = JSON.parse(json)
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("suite export received no data")
  }
  // Only the safe upload timestamp is read from the parsed copy. The file
  // always receives the original text, including the original number types.
  const uploadTime = normalizeSuiteUploadTime((data as Record<string, unknown>).upload_time)
  // Named by when the data was uploaded, so two exports of one upload match.
  const stamp = formatFileTimestamp(
    uploadTime == null ? dependencies.now() : suiteUploadTimeToMillis(uploadTime),
  )
  return {
    fileName: `suite-${params.server}-${params.gameUserId}-${stamp}.json`,
    json,
  }
}
