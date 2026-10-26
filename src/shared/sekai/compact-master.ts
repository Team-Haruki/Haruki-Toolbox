import type { SekaiRegion } from "@/types"
import type { SekaiMasterVersionInfo } from "./types"
import { manifestListsSekaiMasterFile, normalizeSekaiMasterFileName } from "./data-sources"

const COMPACT_CATALOGS = new Map([
  ["cards", { file: "compactCards", field: "cardParameters" }],
  ["gachas", { file: "compactGachas", field: "gachaDetails" }],
])

/** Keep logical cache names and consumer shapes unchanged across download variants. */
export async function loadSekaiMasterDownload(
  region: SekaiRegion,
  name: string,
  versionInfo: SekaiMasterVersionInfo,
  fetchFile: (name: string) => Promise<unknown>,
): Promise<unknown> {
  const fileName = normalizeSekaiMasterFileName(name)
  const compact = region === "jp" ? COMPACT_CATALOGS.get(fileName) : undefined
  if (compact && manifestListsSekaiMasterFile(versionInfo, compact.file) === true) {
    try {
      return restoreCompactCatalog(await fetchFile(compact.file), compact.field)
    } catch {
      // A stale edge or a malformed export must not poison the logical cache.
      // The original blob from the same manifest is the compatibility fallback.
    }
  }
  return fetchFile(fileName)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function restoreColumn(values: unknown, dictionary: unknown, rowCount: number): unknown[] {
  if (!Array.isArray(values) || values.length !== rowCount) {
    throw new Error("Mismatched compact master column lengths")
  }
  if (dictionary === undefined) return values
  if (!Array.isArray(dictionary)) {
    throw new Error("Invalid compact master enum column")
  }
  return values.map((cell: unknown) => {
    if (cell === null) return null
    if (typeof cell !== "number" || !Number.isInteger(cell) || cell < 0 || cell >= dictionary.length) {
      throw new Error("Invalid compact master enum index")
    }
    return dictionary[cell]
  })
}

/** Nuverse columns + optional __ENUM__ dictionaries, decoded without truncation. */
function restoreColumns(value: Record<string, unknown>): Record<string, unknown>[] {
  const enums = value.__ENUM__
  if (enums !== undefined && !isRecord(enums)) {
    throw new Error("Invalid compact master enum dictionary")
  }
  const columns = Object.entries(value).filter(([key]) => key !== "__ENUM__")
  const first = columns[0]?.[1]
  if (!Array.isArray(first)) {
    throw new Error("Invalid compact master columns")
  }
  const rows: Record<string, unknown>[] = Array.from({ length: first.length }, () => ({}))
  for (const [key, values] of columns) {
    const dictionary = enums && Object.hasOwn(enums, key) ? enums[key] : undefined
    const decoded = restoreColumn(values, dictionary, rows.length)
    for (let index = 0; index < decoded.length; index += 1) {
      // Define an own property even for a future field named __proto__.
      Object.defineProperty(rows[index], key, { value: decoded[index], enumerable: true, writable: true, configurable: true })
    }
  }
  return rows
}

export function restoreCompactCatalog(data: unknown, field: string): unknown[] {
  if (!Array.isArray(data)) {
    throw new Error("Invalid compact master catalog")
  }
  return data.map((row: unknown) => {
    if (!isRecord(row)) {
      throw new Error("Invalid compact master row")
    }
    const value = row[field]
    return isRecord(value) && Object.hasOwn(value, "__ENUM__")
      ? { ...row, [field]: restoreColumns(value) }
      : row
  })
}
