import type { SekaiRegion } from "@/types"
import type {
  DeckRecommendUserDataMode,
  DeckRecommendUserDataResponse,
  GetUserProfileResponse,
} from "../api/recommend-data"

const DB_NAME = "haruki-deck-recommend-user-data"
const DB_VERSION = 3
const USER_DATA_STORE = "gameAccountData"
const LEGACY_SUITE_USER_DATA_STORE = "suiteUserData"

let dbPromise: Promise<IDBDatabase> | null = null

export type DeckRecommendUserDataCacheKeyParams = {
  toolboxUserId: string | number
  server: SekaiRegion
  gameUserId: string | number
  mode: DeckRecommendUserDataMode
}

export type DeckRecommendProfileCacheKeyParams = {
  toolboxUserId: string | number
  server: SekaiRegion
  gameUserId: string | number
}

export type DeckRecommendUserDataCacheRecord = {
  key: string
  toolboxUserId: string
  server: SekaiRegion
  gameUserId: string
  mode: DeckRecommendUserDataMode
  uploadTime: number
  data: DeckRecommendUserDataResponse
  updatedAt: number
}

export type DeckRecommendProfileCacheRecord = {
  key: string
  toolboxUserId: string
  server: SekaiRegion
  gameUserId: string
  data: GetUserProfileResponse
  updatedAt: number
}

export function makeDeckRecommendUserDataCacheKey(params: DeckRecommendUserDataCacheKeyParams): string {
  return [
    params.mode,
    String(params.toolboxUserId).trim(),
    params.server,
    String(params.gameUserId).trim(),
  ].join(":")
}

export function makeDeckRecommendProfileCacheKey(params: DeckRecommendProfileCacheKeyParams): string {
  return [
    "profile",
    String(params.toolboxUserId).trim(),
    params.server,
    String(params.gameUserId).trim(),
  ].join(":")
}

export async function readDeckRecommendUserDataCache(
  params: DeckRecommendUserDataCacheKeyParams,
): Promise<DeckRecommendUserDataCacheRecord | null> {
  const record = await readStoreRecord<DeckRecommendUserDataCacheRecord>(
    USER_DATA_STORE,
    makeDeckRecommendUserDataCacheKey(params),
  )
  return record ?? null
}

export async function readDeckRecommendProfileCache(
  params: DeckRecommendProfileCacheKeyParams,
): Promise<DeckRecommendProfileCacheRecord | null> {
  const record = await readStoreRecord<DeckRecommendProfileCacheRecord>(
    USER_DATA_STORE,
    makeDeckRecommendProfileCacheKey(params),
  )
  return record ?? null
}

export async function writeDeckRecommendUserDataCache(
  params: DeckRecommendUserDataCacheKeyParams,
  data: DeckRecommendUserDataResponse,
  uploadTime: number,
): Promise<DeckRecommendUserDataCacheRecord> {
  const record: DeckRecommendUserDataCacheRecord = {
    key: makeDeckRecommendUserDataCacheKey(params),
    toolboxUserId: String(params.toolboxUserId).trim(),
    server: params.server,
    gameUserId: String(params.gameUserId).trim(),
    mode: params.mode,
    uploadTime,
    data,
    updatedAt: Date.now(),
  }
  await writeStoreRecord(USER_DATA_STORE, record)
  return record
}

export async function writeDeckRecommendProfileCache(
  params: DeckRecommendProfileCacheKeyParams,
  data: GetUserProfileResponse,
): Promise<DeckRecommendProfileCacheRecord> {
  const record: DeckRecommendProfileCacheRecord = {
    key: makeDeckRecommendProfileCacheKey(params),
    toolboxUserId: String(params.toolboxUserId).trim(),
    server: params.server,
    gameUserId: String(params.gameUserId).trim(),
    data,
    updatedAt: Date.now(),
  }
  await writeStoreRecord(USER_DATA_STORE, record)
  return record
}

export async function clearDeckRecommendUserDataCache(toolboxUserId?: string | number | null): Promise<void> {
  const db = await openDeckRecommendUserDataDatabase()
  const storeNames = [USER_DATA_STORE, LEGACY_SUITE_USER_DATA_STORE]
    .filter((storeName) => db.objectStoreNames.contains(storeName))
  if (storeNames.length === 0) {
    return
  }

  const transaction = db.transaction(storeNames, "readwrite")
  await Promise.all(storeNames.map((storeName) =>
    deleteMatchingRecords(transaction.objectStore(storeName), toolboxUserId),
  ))
  await waitForTransaction(transaction)
}

async function readStoreRecord<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDeckRecommendUserDataDatabase()
  const transaction = db.transaction(storeName, "readonly")
  const request = transaction.objectStore(storeName).get(key)
  const result = await requestToPromise<T | undefined>(request)
  await waitForTransaction(transaction)
  return result
}

async function writeStoreRecord<T extends { key: string }>(storeName: string, record: T): Promise<void> {
  const db = await openDeckRecommendUserDataDatabase()
  const transaction = db.transaction(storeName, "readwrite")
  transaction.objectStore(storeName).put(record)
  await waitForTransaction(transaction)
}

function openDeckRecommendUserDataDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is unavailable"))
  }

  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(USER_DATA_STORE)) {
        db.createObjectStore(USER_DATA_STORE, { keyPath: "key" })
        return
      }

      // Suite user data moved to the shared user snapshot cache; drop orphaned "suite:*" records.
      request.transaction
        ?.objectStore(USER_DATA_STORE)
        .delete(IDBKeyRange.bound("suite:", "suite;", false, true))
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("Failed to open deck recommend user data cache"))
    request.onblocked = () => reject(new Error("Deck recommend user data cache upgrade is blocked"))
  })

  return dbPromise
}

function deleteMatchingRecords(store: IDBObjectStore, toolboxUserId?: string | number | null): Promise<void> {
  const normalizedToolboxUserId = toolboxUserId == null ? null : String(toolboxUserId).trim()
  return new Promise((resolve, reject) => {
    const request = store.openCursor()
    request.onerror = () => reject(request.error ?? new Error("Failed to scan deck recommend user data cache"))
    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor) {
        resolve()
        return
      }

      const value = cursor.value as { toolboxUserId?: unknown }
      if (!normalizedToolboxUserId || String(value.toolboxUserId ?? "").trim() === normalizedToolboxUserId) {
        cursor.delete()
      }
      cursor.continue()
    }
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"))
  })
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"))
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"))
  })
}
