import { formatFileTimestamp } from "@/lib/csv"
import type { SekaiRegion } from "@/types"
import { fetchUserSuiteSubset, suiteUploadTimeToMillis } from "./api"

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
  dependencies: { fetchSubset: typeof fetchUserSuiteSubset; now: () => number } = {
    fetchSubset: fetchUserSuiteSubset,
    now: Date.now,
  },
): Promise<UserSuiteExport> {
  const result = await dependencies.fetchSubset({ ...params, keys: [] })
  if (result.kind !== "data") {
    throw new Error("suite export received no data")
  }
  // Named by when the data was uploaded, so two exports of one upload match.
  const stamp = formatFileTimestamp(
    result.uploadTime == null ? dependencies.now() : suiteUploadTimeToMillis(result.uploadTime),
  )
  return {
    fileName: `suite-${params.server}-${params.gameUserId}-${stamp}.json`,
    json: JSON.stringify(result.data),
  }
}
