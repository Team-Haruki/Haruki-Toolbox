import type { LocationQuery, LocationQueryValue } from "vue-router"

/**
 * Helpers for mirroring page state into `route.query`. Readers are lenient
 * (arrays take the first entry, garbage falls back to the default) so a
 * hand-edited or stale URL never breaks a page; writers omit defaults so the
 * address bar stays short.
 */

export type QueryWriteRecord = Record<string, string | undefined>

export function readQueryString(value: LocationQueryValue | LocationQueryValue[] | undefined): string | null {
  const first = Array.isArray(value) ? value[0] : value
  if (typeof first !== "string") {
    return null
  }
  const trimmed = first.trim()
  return trimmed === "" ? null : trimmed
}

export function readQueryInt(
  value: LocationQueryValue | LocationQueryValue[] | undefined,
  options: { min?: number; max?: number } = {},
): number | null {
  const raw = readQueryString(value)
  if (raw == null || !/^-?\d+$/.test(raw)) {
    return null
  }
  const parsed = Number(raw)
  if (!Number.isSafeInteger(parsed)) {
    return null
  }
  if (options.min != null && parsed < options.min) {
    return null
  }
  if (options.max != null && parsed > options.max) {
    return null
  }
  return parsed
}

export function readQueryEnum<T extends string>(
  value: LocationQueryValue | LocationQueryValue[] | undefined,
  allowed: readonly T[],
): T | null {
  const raw = readQueryString(value)
  return raw != null && (allowed as readonly string[]).includes(raw) ? (raw as T) : null
}

export function readQueryBoolean(value: LocationQueryValue | LocationQueryValue[] | undefined): boolean {
  const raw = readQueryString(value)
  return raw === "1" || raw === "true"
}

/** Comma-separated list; blank entries dropped, order kept, duplicates removed. */
export function readQueryList(value: LocationQueryValue | LocationQueryValue[] | undefined): string[] {
  const raw = readQueryString(value)
  if (raw == null) {
    return []
  }
  const seen = new Set<string>()
  const items: string[] = []
  for (const part of raw.split(",")) {
    const item = part.trim()
    if (item && !seen.has(item)) {
      seen.add(item)
      items.push(item)
    }
  }
  return items
}

export function readQueryEnumList<T extends string>(
  value: LocationQueryValue | LocationQueryValue[] | undefined,
  allowed: readonly T[],
): T[] {
  return readQueryList(value).filter((item): item is T => (allowed as readonly string[]).includes(item))
}

export function readQueryIntList(
  value: LocationQueryValue | LocationQueryValue[] | undefined,
  options: { min?: number } = {},
): number[] {
  const min = options.min ?? 1
  const seen = new Set<number>()
  const items: number[] = []
  for (const item of readQueryList(value)) {
    if (!/^-?\d+$/.test(item)) {
      continue
    }
    const parsed = Number(item)
    if (Number.isSafeInteger(parsed) && parsed >= min && !seen.has(parsed)) {
      seen.add(parsed)
      items.push(parsed)
    }
  }
  return items
}

export function writeQueryList(values: readonly (string | number)[]): string | undefined {
  return values.length > 0 ? values.map(String).join(",") : undefined
}

export function writeQueryValue(
  value: string | number | boolean | null | undefined,
  defaultValue?: string | number | boolean | null,
): string | undefined {
  if (value == null || value === "" || value === false) {
    return undefined
  }
  if (defaultValue != null && value === defaultValue) {
    return undefined
  }
  return value === true ? "1" : String(value)
}

/**
 * Merges page-owned keys into the current query: keys the codec writes as
 * `undefined` are removed, foreign keys are preserved untouched.
 */
export function mergeQuery(
  current: LocationQuery,
  ownedKeys: readonly string[],
  next: QueryWriteRecord,
): Record<string, LocationQueryValue | LocationQueryValue[]> {
  const merged: Record<string, LocationQueryValue | LocationQueryValue[]> = {}
  for (const [key, value] of Object.entries(current)) {
    if (!ownedKeys.includes(key) && value !== undefined) {
      merged[key] = value
    }
  }
  for (const key of ownedKeys) {
    const value = next[key]
    if (value != null && value !== "") {
      merged[key] = value
    }
  }
  return merged
}

/** Stable string form of a write record, for change detection. */
export function serializeQueryRecord(record: QueryWriteRecord): string {
  return Object.keys(record)
    .sort()
    .filter((key) => record[key] != null && record[key] !== "")
    .map((key) => `${key}=${record[key]}`)
    .join("&")
}
