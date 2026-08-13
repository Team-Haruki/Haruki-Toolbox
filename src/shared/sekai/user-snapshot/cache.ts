import type { SekaiRegion } from "@/types"
import { makeSuiteSubsetSignature } from "./api"

const DB_NAME = "haruki-sekai-user-snapshot"
const DB_VERSION = 1
const SUITE_SUBSET_STORE = "suiteSubsets"

let dbPromise: Promise<IDBDatabase> | null = null

export type UserSuiteSubsetCacheKeyParams = {
  toolboxUserId: string | number
  server: SekaiRegion
  gameUserId: string | number
  keys: readonly string[]
}

export type UserSuiteSubsetCacheRecord = {
  key: string
  toolboxUserId: string
  server: SekaiRegion
  gameUserId: string
  signature: string
  uploadTime: number
  data: Record<string, unknown>
  updatedAt: number
}

export function makeUserSuiteSubsetCacheKey(params: UserSuiteSubsetCacheKeyParams): string {
  return [
    String(params.toolboxUserId).trim(),
    params.server,
    String(params.gameUserId).trim(),
    makeSuiteSubsetSignature(params.keys),
  ].join(":")
}

export async function readUserSuiteSubsetCache(
  params: UserSuiteSubsetCacheKeyParams,
): Promise<UserSuiteSubsetCacheRecord | null> {
  const record = await readStoreRecord<UserSuiteSubsetCacheRecord>(
    SUITE_SUBSET_STORE,
    makeUserSuiteSubsetCacheKey(params),
  )
  return record ?? null
}

export async function writeUserSuiteSubsetCache(
  params: UserSuiteSubsetCacheKeyParams,
  data: Record<string, unknown>,
  uploadTime: number,
): Promise<UserSuiteSubsetCacheRecord> {
  const record: UserSuiteSubsetCacheRecord = {
    key: makeUserSuiteSubsetCacheKey(params),
    toolboxUserId: String(params.toolboxUserId).trim(),
    server: params.server,
    gameUserId: String(params.gameUserId).trim(),
    signature: makeSuiteSubsetSignature(params.keys),
    uploadTime,
    data,
    updatedAt: Date.now(),
  }
  await writeStoreRecord(SUITE_SUBSET_STORE, record)
  return record
}

export async function clearUserSuiteSubsetCache(toolboxUserId?: string | number | null): Promise<void> {
  const db = await openUserSnapshotDatabase()
  if (!db.objectStoreNames.contains(SUITE_SUBSET_STORE)) {
    return
  }

  const transaction = db.transaction(SUITE_SUBSET_STORE, "readwrite")
  await deleteMatchingRecords(transaction.objectStore(SUITE_SUBSET_STORE), toolboxUserId)
  await waitForTransaction(transaction)
}

async function readStoreRecord<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await openUserSnapshotDatabase()
  const transaction = db.transaction(storeName, "readonly")
  const request = transaction.objectStore(storeName).get(key)
  const result = await requestToPromise<T | undefined>(request)
  await waitForTransaction(transaction)
  return result
}

async function writeStoreRecord<T extends { key: string }>(storeName: string, record: T): Promise<void> {
  const db = await openUserSnapshotDatabase()
  const transaction = db.transaction(storeName, "readwrite")
  transaction.objectStore(storeName).put(record)
  await waitForTransaction(transaction)
}

function openUserSnapshotDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is unavailable"))
  }

  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(SUITE_SUBSET_STORE)) {
        db.createObjectStore(SUITE_SUBSET_STORE, { keyPath: "key" })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("Failed to open user snapshot cache"))
    request.onblocked = () => reject(new Error("User snapshot cache upgrade is blocked"))
  })

  return dbPromise
}

function deleteMatchingRecords(store: IDBObjectStore, toolboxUserId?: string | number | null): Promise<void> {
  const normalizedToolboxUserId = toolboxUserId == null ? null : String(toolboxUserId).trim()
  return new Promise((resolve, reject) => {
    const request = store.openCursor()
    request.onerror = () => reject(request.error ?? new Error("Failed to scan user snapshot cache"))
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
