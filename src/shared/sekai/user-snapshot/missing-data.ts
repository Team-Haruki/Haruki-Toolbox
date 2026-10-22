import { isAxiosError } from "axios"

export type MissingUploadDataType = "suite" | "mysekai" | "profile"

/**
 * Only missing game data qualifies: an uploaded Suite/MySekai snapshot the
 * account never uploaded, or a realtime profile the backend has no player
 * record for. Binding/CDN/proxy 404s do not.
 */
export function getMissingUploadDataType(error: unknown): MissingUploadDataType | null {
  if (!isAxiosError<{ message?: unknown }>(error) || error.response?.status !== 404) {
    return null
  }
  const message = error.response.data?.message
  if (typeof message !== "string" || !/^(player|suite|mysekai) data not found\.?$/i.test(message.trim())) {
    return null
  }
  const path = (error.config?.url ?? "").split(/[?#]/, 1)[0] ?? ""
  const match = /\/game-account\/(?:jp|en|tw|kr|cn)\/[^/]+\/(suite|mysekai|profile)\/?$/.exec(path)
  return match ? match[1] as MissingUploadDataType : null
}

/** True when a granted account's read came back 403: the grant lapsed after it was listed. */
export function isLapsedGrantError(error: unknown, ownership: "own" | "granted" | null | undefined): boolean {
  return ownership === "granted" && isAxiosError(error) && error.response?.status === 403
}
