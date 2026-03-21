import type { EntityId } from "@/types/common"

export type UnknownRecord = Record<string, unknown>

export function asRecord(value: unknown): UnknownRecord | null {
    return value && typeof value === "object" && !Array.isArray(value)
        ? (value as UnknownRecord)
        : null
}

function readFirst(record: UnknownRecord, keys: readonly string[]): unknown {
    for (const key of keys) {
        const value = record[key]
        if (value !== undefined) {
            return value
        }
    }
    return undefined
}

export function readString(
    record: UnknownRecord,
    keys: readonly string[],
    fallback = ""
): string {
    const value = readFirst(record, keys)
    if (value === undefined || value === null) return fallback
    return String(value)
}

export function readOptionalString(
    record: UnknownRecord,
    keys: readonly string[]
): string | undefined {
    const value = readFirst(record, keys)
    if (value === undefined || value === null) return undefined
    return String(value)
}

export function readBoolean(
    record: UnknownRecord,
    keys: readonly string[],
    fallback = false
): boolean {
    const value = readFirst(record, keys)
    if (value === undefined || value === null) return fallback

    if (typeof value === "boolean") return value
    if (typeof value === "number") return value !== 0
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase()
        if (normalized === "true" || normalized === "1") return true
        if (normalized === "false" || normalized === "0") return false
    }

    return fallback
}

export function readStringArray(
    record: UnknownRecord,
    keys: readonly string[]
): string[] {
    const value = readFirst(record, keys)
    if (Array.isArray(value)) {
        return value
            .map((item) => String(item ?? "").trim())
            .filter((item) => item !== "")
    }

    if (typeof value === "string") {
        const normalized = value.trim()
        return normalized ? [normalized] : []
    }

    return []
}

export function readRecord(
    record: UnknownRecord,
    keys: readonly string[]
): UnknownRecord | null {
    const value = readFirst(record, keys)
    return asRecord(value)
}

export function normalizeEntityId(value: unknown): EntityId {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "bigint") return value.toString()

    const text = String(value ?? "").trim()
    if (text === "") return ""

    return text
}
