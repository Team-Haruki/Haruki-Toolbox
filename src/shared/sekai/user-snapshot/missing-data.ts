import { isAxiosError } from "axios"

export type MissingUploadDataType = "suite" | "mysekai"

/** Only missing uploaded snapshots qualify; binding/profile/CDN 404s do not. */
export function getMissingUploadDataType(error: unknown): MissingUploadDataType | null {
  if (!isAxiosError<{ message?: unknown }>(error) || error.response?.status !== 404) {
    return null
  }
  const message = error.response.data?.message
  if (typeof message !== "string" || !/^(player|suite|mysekai) data not found\.?$/i.test(message.trim())) {
    return null
  }
  const path = (error.config?.url ?? "").split(/[?#]/, 1)[0] ?? ""
  const match = /\/game-account\/(?:jp|en|tw|kr|cn)\/[^/]+\/(suite|mysekai)\/?$/.exec(path)
  return match ? match[1] as MissingUploadDataType : null
}
