import type { SekaiRegion, UploadDataType } from "@/types"
import { asRecord, readString } from "@/lib/record-utils"
import { isSekaiRegion } from "@/lib/sekai-region"
import { isUploadDataType } from "@/lib/upload-data-type"

export interface InheritData {
  inherit_id: string
  inherit_password: string
  server: SekaiRegion
  type: UploadDataType
  timestamp?: number
}

const INHERIT_STORAGE_KEY = "haruki_inherit"

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
    const server = isSekaiRegion(parsed.server) ? parsed.server : "jp"
    const type = isUploadDataType(parsed.type) ? parsed.type : "suite"

    if (!inherit_id || !inherit_password) {
      return null
    }

    return { inherit_id, inherit_password, server, type }
  } catch {
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
    console.warn("Failed to save inherit info to localStorage")
  }
}
