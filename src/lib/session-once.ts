/**
 * Per-tab "did this already happen" marks backed by sessionStorage, for
 * boot-time work that should not repeat on every full page load (prefetches,
 * one-time notices). Storage may be missing or throw (private mode, quota);
 * every helper then behaves as if nothing was recorded.
 */

type MarkStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">

const KEY_PREFIX = "haruki-toolbox-once:"

function resolveSessionStorage(): MarkStorage | null {
  if (typeof window === "undefined") return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export interface SessionOnceOptions {
  storage?: MarkStorage | null
  now?: number
  /** A mark older than this is treated as absent. Omit for "once per session". */
  ttlMs?: number
}

export function readSessionMark(key: string, options: SessionOnceOptions = {}): number | null {
  const storage = options.storage === undefined ? resolveSessionStorage() : options.storage
  if (!storage) return null
  try {
    const raw = storage.getItem(KEY_PREFIX + key)
    if (raw === null) return null
    const at = Number.parseInt(raw, 10)
    return Number.isFinite(at) ? at : null
  } catch {
    return null
  }
}

export function writeSessionMark(key: string, options: SessionOnceOptions = {}) {
  const storage = options.storage === undefined ? resolveSessionStorage() : options.storage
  if (!storage) return
  try {
    storage.setItem(KEY_PREFIX + key, String(options.now ?? Date.now()))
  } catch {
    // Best effort: without storage the work simply repeats.
  }
}

export function clearSessionMark(key: string, options: SessionOnceOptions = {}) {
  const storage = options.storage === undefined ? resolveSessionStorage() : options.storage
  if (!storage) return
  try {
    storage.removeItem(KEY_PREFIX + key)
  } catch {
    // Nothing to clear.
  }
}

/**
 * True the first time it is asked for `key` in this tab session (or after
 * `ttlMs` has elapsed since the last time), and records the mark; false
 * otherwise. Callers run their work only on true.
 */
export function claimSessionOnce(key: string, options: SessionOnceOptions = {}): boolean {
  const now = options.now ?? Date.now()
  const last = readSessionMark(key, options)
  if (last !== null) {
    const expired = options.ttlMs !== undefined && now - last >= options.ttlMs
    if (!expired) return false
  }
  writeSessionMark(key, { ...options, now })
  return true
}
