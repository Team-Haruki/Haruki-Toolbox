import type { SekaiRegion } from "@/types"
import type {
  SekaiMasterFileRecord,
  SekaiMusicMetasRecord,
  SekaiRegionCacheMeta,
} from "./types"
import { normalizeSekaiMasterFileName } from "./data-sources"

const DB_NAME = "haruki-sekai-data"
const DB_VERSION = 1
const META_STORE = "metadata"
const MASTER_FILES_STORE = "masterFiles"
const MUSIC_METAS_STORE = "musicMetas"

let dbPromise: Promise<IDBDatabase> | null = null

export function makeSekaiRegionMetaKey(region: SekaiRegion): string {
  return `region:${region}:meta`
}

export function makeSekaiMasterFileKey(region: SekaiRegion, version: string, name: string): string {
  return `master:${region}:${version}:${normalizeSekaiMasterFileName(name)}`
}

export function makeSekaiMusicMetasKey(region: SekaiRegion): string {
  return `music-metas:${region}:current`
}

export async function readSekaiRegionCacheMeta(region: SekaiRegion): Promise<SekaiRegionCacheMeta | null> {
  const record = await readStoreRecord<{ key: string; value: SekaiRegionCacheMeta }>(
    META_STORE,
    makeSekaiRegionMetaKey(region),
  )
  return record?.value ?? null
}

export async function writeSekaiRegionCacheMeta(meta: SekaiRegionCacheMeta): Promise<void> {
  await writeStoreRecord(META_STORE, {
    key: makeSekaiRegionMetaKey(meta.region),
    value: meta,
  })
}

export async function readSekaiMasterFile<T = unknown>(
  region: SekaiRegion,
  name: string,
  version?: string,
): Promise<T | null> {
  const fileName = normalizeSekaiMasterFileName(name)
  const activeVersion = version ?? (await readSekaiRegionCacheMeta(region))?.master?.fetchVersion
  if (!activeVersion) {
    return null
  }

  const record = await readStoreRecord<SekaiMasterFileRecord<T>>(
    MASTER_FILES_STORE,
    makeSekaiMasterFileKey(region, activeVersion, fileName),
  )
  return record?.data ?? null
}

export async function readSekaiMasterFiles(
  region: SekaiRegion,
  names: readonly string[],
  version?: string,
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {}
  const fileVersion = version ?? (await readSekaiRegionCacheMeta(region))?.master?.fetchVersion
  if (!fileVersion) {
    return result
  }

  await Promise.all(names.map(async (name) => {
    const fileName = normalizeSekaiMasterFileName(name)
    const data = await readSekaiMasterFile(region, fileName, fileVersion)
    if (data != null) {
      result[fileName] = data
    }
  }))

  return result
}

export async function writeSekaiMasterFiles(
  region: SekaiRegion,
  version: string,
  files: Record<string, unknown>,
): Promise<void> {
  const updatedAt = Date.now()
  const db = await openSekaiDataDatabase()
  const transaction = db.transaction(MASTER_FILES_STORE, "readwrite")
  const store = transaction.objectStore(MASTER_FILES_STORE)

  for (const [name, data] of Object.entries(files)) {
    const fileName = normalizeSekaiMasterFileName(name)
    store.put({
      key: makeSekaiMasterFileKey(region, version, fileName),
      region,
      version,
      name: fileName,
      data,
      updatedAt,
    } satisfies SekaiMasterFileRecord)
  }

  await waitForTransaction(transaction)
}

export async function readSekaiMusicMetas<T = unknown>(region: SekaiRegion): Promise<T | null> {
  const record = await readStoreRecord<SekaiMusicMetasRecord<T>>(
    MUSIC_METAS_STORE,
    makeSekaiMusicMetasKey(region),
  )
  return record?.data ?? null
}

export async function writeSekaiMusicMetas(
  region: SekaiRegion,
  data: unknown,
  url: string,
  pairedMasterDisplayVersion: string | null,
): Promise<void> {
  await writeStoreRecord(MUSIC_METAS_STORE, {
    key: makeSekaiMusicMetasKey(region),
    region,
    data,
    url,
    pairedMasterDisplayVersion,
    updatedAt: Date.now(),
  } satisfies SekaiMusicMetasRecord)
}

export async function clearSekaiRegionCache(region: SekaiRegion): Promise<void> {
  const db = await openSekaiDataDatabase()
  const transaction = db.transaction([META_STORE, MASTER_FILES_STORE, MUSIC_METAS_STORE], "readwrite")
  transaction.objectStore(META_STORE).delete(makeSekaiRegionMetaKey(region))
  transaction.objectStore(MUSIC_METAS_STORE).delete(makeSekaiMusicMetasKey(region))

  await deleteRegionRecords(transaction.objectStore(MASTER_FILES_STORE), region)
  await waitForTransaction(transaction)
}

async function readStoreRecord<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await openSekaiDataDatabase()
  const transaction = db.transaction(storeName, "readonly")
  const request = transaction.objectStore(storeName).get(key)
  const result = await requestToPromise<T | undefined>(request)
  await waitForTransaction(transaction)
  return result
}

async function writeStoreRecord<T extends { key: string }>(storeName: string, record: T): Promise<void> {
  const db = await openSekaiDataDatabase()
  const transaction = db.transaction(storeName, "readwrite")
  transaction.objectStore(storeName).put(record)
  await waitForTransaction(transaction)
}

function openSekaiDataDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is unavailable"))
  }

  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" })
      }
      if (!db.objectStoreNames.contains(MASTER_FILES_STORE)) {
        db.createObjectStore(MASTER_FILES_STORE, { keyPath: "key" })
      }
      if (!db.objectStoreNames.contains(MUSIC_METAS_STORE)) {
        db.createObjectStore(MUSIC_METAS_STORE, { keyPath: "key" })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("Failed to open Sekai IndexedDB"))
    request.onblocked = () => reject(new Error("Sekai IndexedDB upgrade is blocked"))
  })

  return dbPromise
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

function deleteRegionRecords(store: IDBObjectStore, region: SekaiRegion): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = store.openCursor()
    request.onerror = () => reject(request.error ?? new Error("Failed to scan Sekai cache records"))
    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor) {
        resolve()
        return
      }

      const value = cursor.value as { region?: unknown }
      if (value.region === region) {
        cursor.delete()
      }
      cursor.continue()
    }
  })
}
