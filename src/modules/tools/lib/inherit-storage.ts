import type { InheritServer, UploadDataType } from "@/types"
import { asRecord, readString } from "@/lib/record-utils"
import { isUploadDataType } from "@/lib/upload-data-type"
import { createLogger } from "@/lib/logger"

const logger = createLogger("inherit-storage")

export interface InheritData {
  inherit_id: string
  inherit_password: string
  server: InheritServer
  type: UploadDataType
  timestamp?: number
}

function isInheritServer(value: unknown): value is InheritServer {
  return value === "jp" || value === "en"
}

const INHERIT_STORAGE_KEY = "haruki_inherit"
const INHERIT_STORAGE_TTL_MS = 24 * 60 * 60 * 1000

export function clearInheritStorage(): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.removeItem(INHERIT_STORAGE_KEY)
  } catch {
  }
}

export function loadInheritFromStorage(): InheritData | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const raw = window.localStorage.getItem(INHERIT_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = asRecord(JSON.parse(raw))
    if (!parsed) {
      return null
    }

    const inherit_id = readString(parsed, ["inherit_id"])
    const inherit_password = readString(parsed, ["inherit_password"])
    const server = isInheritServer(parsed.server) ? parsed.server : "jp"
    const type = isUploadDataType(parsed.type) ? parsed.type : "suite"
    const timestamp = typeof parsed.timestamp === "number" ? parsed.timestamp : null

    if (!inherit_id || !inherit_password || timestamp === null) {
      clearInheritStorage()
      return null
    }

    if (Date.now() - timestamp > INHERIT_STORAGE_TTL_MS) {
      clearInheritStorage()
      return null
    }

    return { inherit_id, inherit_password, server, type, timestamp }
  } catch {
    clearInheritStorage()
    return null
  }
}

export function saveInheritToStorage(data: InheritData): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(INHERIT_STORAGE_KEY, JSON.stringify({ ...data, timestamp: Date.now() }))
  } catch {
    logger.warn("Failed to save inherit info to localStorage")
  }
}
