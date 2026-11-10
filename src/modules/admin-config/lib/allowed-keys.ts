/**
 * The public API allowlist (`publicApiAllowedKeys`): the top-level game-data
 * keys every non-private API may serve. The page edits it as a list: keys can
 * be struck out and new ones appended, and the saved order is the loaded
 * order followed by the additions.
 */

/**
 * The key list from a `GET /api/admin/config/public-api-keys` body
 * (`{ publicApiAllowedKeys: string[] }`), trimmed and without duplicates.
 * Anything else reads as an empty list.
 */
export function readAllowedKeys(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value
    : value && typeof value === "object"
      ? (value as Record<string, unknown>).publicApiAllowedKeys
      : null
  if (!Array.isArray(raw)) return []
  return uniqueKeys(raw.filter((item): item is string => typeof item === "string"))
}

function uniqueKeys(keys: readonly string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const key of keys) {
    const trimmed = key.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    result.push(trimmed)
  }
  return result
}

/** The keys typed or pasted into the add field: split on commas, semicolons and whitespace. */
export function splitKeyInput(input: string): string[] {
  return uniqueKeys(input.split(/[\s,，;；、]+/u))
}

export type AllowedKeysDraft = {
  /** Loaded keys the admin struck out. */
  removed: readonly string[]
  /** New keys, in the order they were added. */
  added: readonly string[]
}

export const EMPTY_ALLOWED_KEYS_DRAFT: AllowedKeysDraft = { removed: [], added: [] }

export type AddKeysResult = {
  draft: AllowedKeysDraft
  /** Keys that were already on the list (loaded or added) and changed nothing. */
  duplicates: string[]
}

/**
 * Adds keys to the draft. A key that was loaded and struck out comes back in
 * its place; a key already on the list is reported as a duplicate.
 */
export function addAllowedKeys(baseline: readonly string[], draft: AllowedKeysDraft, incoming: readonly string[]): AddKeysResult {
  const removed = new Set(draft.removed)
  const added = [...draft.added]
  const duplicates: string[] = []
  for (const key of uniqueKeys(incoming)) {
    if (baseline.includes(key)) {
      if (removed.has(key)) {
        removed.delete(key)
      } else {
        duplicates.push(key)
      }
    } else if (added.includes(key)) {
      duplicates.push(key)
    } else {
      added.push(key)
    }
  }
  return { draft: { removed: draft.removed.filter((key) => removed.has(key)), added }, duplicates }
}

/** Takes a key off the list: a new key disappears, a loaded one is struck out until saved. */
export function removeAllowedKey(baseline: readonly string[], draft: AllowedKeysDraft, key: string): AllowedKeysDraft {
  if (draft.added.includes(key)) {
    return { removed: draft.removed, added: draft.added.filter((item) => item !== key) }
  }
  if (baseline.includes(key) && !draft.removed.includes(key)) {
    return { removed: [...draft.removed, key], added: draft.added }
  }
  return draft
}

/** Brings a struck-out key back. */
export function restoreAllowedKey(draft: AllowedKeysDraft, key: string): AllowedKeysDraft {
  return { removed: draft.removed.filter((item) => item !== key), added: draft.added }
}

/** The list a save sends: the loaded keys that were kept, then the additions. */
export function applyAllowedKeysDraft(baseline: readonly string[], draft: AllowedKeysDraft): string[] {
  const removed = new Set(draft.removed)
  return [...baseline.filter((key) => !removed.has(key)), ...draft.added]
}

export function isAllowedKeysDraftDirty(draft: AllowedKeysDraft): boolean {
  return draft.removed.length > 0 || draft.added.length > 0
}
