export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) {
    return true
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return true
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
  }

  if (Array.isArray(value)) {
    return value.every((item) => isJsonValue(item))
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).every((item) => isJsonValue(item))
  }

  return false
}

export function isJsonRecord(value: unknown): value is Record<string, JsonValue> {
  return !!value && typeof value === "object" && !Array.isArray(value) && isJsonValue(value)
}

export function isStringRecord(value: unknown): value is Record<string, string> {
  return !!value
    && typeof value === "object"
    && !Array.isArray(value)
    && Object.values(value as Record<string, unknown>).every((item) => typeof item === "string")
}
