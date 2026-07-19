import { buildUserApiPath } from "@/core/http/path"
import { requestWithResponse } from "@/core/http/call-api"
import type { SekaiRegion } from "@/types"
import type { AxiosRequestConfig, AxiosResponse } from "axios"

export const SUITE_UPLOAD_TIME_KEY = "upload_time"

export type UserSuiteSubsetParams = {
  toolboxUserId: string | number
  server: SekaiRegion
  gameUserId: string | number
  keys: readonly string[]
  knownUploadTime?: number
}

export type UserSuiteSubsetReadResult =
  | {
      kind: "not-modified"
      uploadTime: number
    }
  | {
      kind: "data"
      data: Record<string, unknown>
      uploadTime: number | null
    }

export type UserSuiteRequester = <T = unknown>(
  url: string,
  options?: AxiosRequestConfig,
) => Promise<AxiosResponse<T>>

export function normalizeSuiteSubsetKeys(keys: readonly string[]): string[] {
  const normalized = new Set<string>()
  for (const key of keys) {
    const trimmed = key.trim()
    if (trimmed !== "" && trimmed !== SUITE_UPLOAD_TIME_KEY) {
      normalized.add(trimmed)
    }
  }
  return [...normalized].sort()
}

export function makeSuiteSubsetSignature(keys: readonly string[]): string {
  return normalizeSuiteSubsetKeys(keys).join(",")
}

export function normalizeSuiteUploadTime(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }
  if (isRecord(value)) {
    const numberLong = value.$numberLong
    if (typeof numberLong === "string" && numberLong.trim() !== "") {
      const parsed = Number(numberLong)
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null
    }
  }

  return null
}

export function unwrapSuiteSubsetResponse(value: unknown): Record<string, unknown> {
  const data = unwrapSuiteSubsetValue(value)
  if (!data) {
    throw new Error("invalid suite subset response")
  }

  return data
}

export function isSuiteSubsetComplete(
  data: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return normalizeSuiteSubsetKeys(keys).every((key) => key in data)
}

export async function fetchUserSuiteSubset(
  params: UserSuiteSubsetParams,
  requester: UserSuiteRequester = requestWithResponse,
): Promise<UserSuiteSubsetReadResult> {
  const keys = normalizeSuiteSubsetKeys(params.keys)
  const response = await requester(
    buildUserApiPath(
      params.toolboxUserId,
      "game-account",
      params.server,
      params.gameUserId,
      "suite",
    ),
    {
      params: {
        ...(keys.length > 0 ? { key: [...keys, SUITE_UPLOAD_TIME_KEY].join(",") } : {}),
        ...(isValidSuiteUploadTime(params.knownUploadTime)
          ? { known_upload_time: params.knownUploadTime }
          : {}),
      },
      validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
    },
  )
  if (response.status === 304) {
    if (!isValidSuiteUploadTime(params.knownUploadTime)) {
      throw new Error("received 304 without a valid known upload time")
    }

    return { kind: "not-modified", uploadTime: params.knownUploadTime }
  }

  const data = unwrapSuiteSubsetResponse(response.data)
  return {
    kind: "data",
    data,
    uploadTime: normalizeSuiteUploadTime(data[SUITE_UPLOAD_TIME_KEY]),
  }
}

export function isValidSuiteUploadTime(value: number | undefined | null): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
}

function unwrapSuiteSubsetValue(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    return unwrapSuiteSubsetValue(value[0])
  }

  if (!isRecord(value)) {
    return null
  }

  if (isLikelySuiteData(value)) {
    return value
  }

  for (const key of ["updatedData", "data", "payload", "result", "body"]) {
    if (key in value) {
      const unwrapped = unwrapSuiteSubsetValue(value[key])
      if (unwrapped) {
        return unwrapped
      }
    }
  }

  return value
}

function isLikelySuiteData(value: Record<string, unknown>): boolean {
  if (SUITE_UPLOAD_TIME_KEY in value) {
    return true
  }

  return Object.keys(value).some((key) => key.startsWith("user"))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
