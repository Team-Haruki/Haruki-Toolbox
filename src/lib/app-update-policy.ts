/**
 * Pure decisions behind the app update flow in `src/pwa.ts`: comparing the
 * running build with the deployed `/build-info.json`, choosing between doing
 * nothing, prompting, applying silently and forcing, and guarding the
 * automatic reloads against loops.
 */

export type AppBuildInfo = {
  version: string
  gitCommit: string
  buildTime: string
  /**
   * Oldest app version the deployment still supports (package.json
   * `harukiToolbox.minSupportedVersion`). A running build below it reloads
   * even if the reader has unsaved input (after a grace period).
   */
  minSupportedVersion?: string
}

export type AppUpdateDecision =
  /** The running build is the deployed one (or the comparison is unknown). */
  | "none"
  /** Show the update prompt; the reader decides. */
  | "prompt"
  /** Reload now without asking: nobody is looking and nothing would be lost. */
  | "apply"
  /** The running build is no longer supported: reload regardless. */
  | "force"

/** A tab hidden at least this long with no unsaved input updates silently. */
export const SILENT_APPLY_AFTER_HIDDEN_MS = 15 * 60 * 1000

type ParsedVersion = {
  core: [number, number, number]
  prerelease: string[]
}

const VERSION_PATTERN = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/

function parseVersion(value: string): ParsedVersion | null {
  const match = VERSION_PATTERN.exec(value.trim())
  if (!match) {
    return null
  }

  return {
    core: [Number(match[1]), Number(match[2]), Number(match[3])],
    prerelease: match[4] ? match[4].split(".") : [],
  }
}

function comparePrereleaseIdentifier(left: string, right: string) {
  const leftNumeric = /^\d+$/.test(left)
  const rightNumeric = /^\d+$/.test(right)
  if (leftNumeric && rightNumeric) {
    return Math.sign(Number(left) - Number(right))
  }
  if (leftNumeric !== rightNumeric) {
    // Numeric identifiers sort before alphanumeric ones (semver 11.4.3).
    return leftNumeric ? -1 : 1
  }
  if (left === right) {
    return 0
  }
  return left < right ? -1 : 1
}

/**
 * Semver precedence of two `major.minor.patch[-prerelease]` versions:
 * negative when `left` is older, positive when newer, 0 when equal, and
 * `null` when either side is not a version (callers then must not act).
 */
export function compareVersions(left: string, right: string): number | null {
  const a = parseVersion(left)
  const b = parseVersion(right)
  if (!a || !b) {
    return null
  }

  for (let index = 0; index < 3; index += 1) {
    const difference = a.core[index] - b.core[index]
    if (difference !== 0) {
      return Math.sign(difference)
    }
  }

  // A release outranks its own prereleases (9.0.0-dev3 < 9.0.0).
  if (a.prerelease.length === 0 || b.prerelease.length === 0) {
    return Math.sign(b.prerelease.length - a.prerelease.length)
  }

  const length = Math.max(a.prerelease.length, b.prerelease.length)
  for (let index = 0; index < length; index += 1) {
    const leftPart = a.prerelease[index]
    const rightPart = b.prerelease[index]
    if (leftPart === undefined || rightPart === undefined) {
      return leftPart === undefined ? -1 : 1
    }
    const difference = comparePrereleaseIdentifier(leftPart, rightPart)
    if (difference !== 0) {
      return difference
    }
  }

  return 0
}

/** True only when both versions parse and `version` is strictly older. */
export function isBelowMinimumVersion(version: string, minimum: string | null | undefined) {
  if (!minimum) {
    return false
  }

  const comparison = compareVersions(version, minimum)
  return comparison !== null && comparison < 0
}

function isKnownCommit(commit: string) {
  return commit !== "" && commit !== "unknown"
}

export function isDifferentBuild(current: AppBuildInfo, remote: AppBuildInfo) {
  return isKnownCommit(current.gitCommit)
    && isKnownCommit(remote.gitCommit)
    && current.gitCommit !== remote.gitCommit
}

export type AppUpdateContext = {
  current: AppBuildInfo
  remote: AppBuildInfo | null
  /** A field the reader typed into still holds text. */
  hasUnsavedInput: boolean
  /**
   * How long the tab has been out of sight: the running hidden time while it
   * is hidden, or the time it just spent hidden when the check runs on its
   * return. 0 for an ordinary check of a visible tab.
   */
  hiddenForMs: number
}

export function decideAppUpdate(context: AppUpdateContext): AppUpdateDecision {
  const { current, remote } = context
  if (!remote) {
    return "none"
  }

  if (isBelowMinimumVersion(current.version, remote.minSupportedVersion)) {
    return "force"
  }

  if (!isDifferentBuild(current, remote)) {
    return "none"
  }

  if (!context.hasUnsavedInput && context.hiddenForMs >= SILENT_APPLY_AFTER_HIDDEN_MS) {
    return "apply"
  }

  return "prompt"
}

export function normalizeBuildInfo(value: unknown): AppBuildInfo | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = value as Partial<Record<keyof AppBuildInfo | "gitHash", unknown>>
  if (typeof candidate.version !== "string" || typeof candidate.buildTime !== "string") {
    return null
  }

  let gitCommit: string | null = null
  if (typeof candidate.gitCommit === "string") {
    gitCommit = candidate.gitCommit
  } else if (typeof candidate.gitHash === "string") {
    gitCommit = candidate.gitHash
  }

  if (!gitCommit) {
    return null
  }

  const buildInfo: AppBuildInfo = {
    version: candidate.version,
    gitCommit,
    buildTime: candidate.buildTime,
  }
  if (typeof candidate.minSupportedVersion === "string" && candidate.minSupportedVersion.trim() !== "") {
    buildInfo.minSupportedVersion = candidate.minSupportedVersion.trim()
  }
  return buildInfo
}

export type ReloadGuardRecord = {
  attempts: number
  firstAt: number
  lastAt: number
}

export type ReloadGuardState = Record<string, ReloadGuardRecord>

export type ReloadGuardOptions = {
  /** Automatic reloads allowed per key inside one window. */
  maxAttempts: number
  /** After this long the key's attempts start over. */
  windowMs: number
  /** Minimum gap between two reloads for the same key. */
  minIntervalMs: number
}

export const DEFAULT_RELOAD_GUARD_OPTIONS: ReloadGuardOptions = {
  maxAttempts: 2,
  windowMs: 10 * 60 * 1000,
  minIntervalMs: 30 * 1000,
}

const MAX_GUARD_KEYS = 16

/**
 * Decides whether an automatic reload for `key` (for example the target
 * commit of an update, or the build that hit a chunk-load error) may happen
 * now, and returns the state to persist if it does. Each key gets at most
 * `maxAttempts` reloads per `windowMs`, spaced by `minIntervalMs`, so a
 * deployment that keeps serving the old build (a stale CDN edge, a broken
 * chunk) can never trap the tab in a reload loop.
 */
export function evaluateReloadGuard(
  state: ReloadGuardState | null,
  key: string,
  now: number,
  options: ReloadGuardOptions = DEFAULT_RELOAD_GUARD_OPTIONS,
): { allowed: boolean, state: ReloadGuardState } {
  const entries = Object.entries(state ?? {})
    .filter(([, record]) => now - record.firstAt <= options.windowMs)
  const current = Object.fromEntries(entries) as ReloadGuardState
  const record = current[key]

  if (record) {
    if (record.attempts >= options.maxAttempts || now - record.lastAt < options.minIntervalMs) {
      return { allowed: false, state: current }
    }
    current[key] = { attempts: record.attempts + 1, firstAt: record.firstAt, lastAt: now }
  } else {
    current[key] = { attempts: 1, firstAt: now, lastAt: now }
  }

  const trimmed = Object.entries(current)
    .sort(([, left], [, right]) => right.lastAt - left.lastAt)
    .slice(0, MAX_GUARD_KEYS)
  return { allowed: true, state: Object.fromEntries(trimmed) }
}

export function parseReloadGuardState(raw: string | null): ReloadGuardState | null {
  if (!raw) {
    return null
  }

  try {
    const value = JSON.parse(raw) as unknown
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null
    }

    const state: ReloadGuardState = {}
    for (const [key, record] of Object.entries(value as Record<string, unknown>)) {
      const candidate = record as Partial<ReloadGuardRecord> | null
      if (
        candidate
        && Number.isFinite(candidate.attempts)
        && Number.isFinite(candidate.firstAt)
        && Number.isFinite(candidate.lastAt)
      ) {
        state[key] = {
          attempts: candidate.attempts as number,
          firstAt: candidate.firstAt as number,
          lastAt: candidate.lastAt as number,
        }
      }
    }
    return state
  } catch {
    return null
  }
}

const CHUNK_LOAD_ERROR_PATTERNS = [
  // Chromium
  /Failed to fetch dynamically imported module/i,
  // Firefox
  /error loading dynamically imported module/i,
  // Safari
  /Importing a module script failed/i,
  // Vite's preload helper
  /Unable to preload CSS/i,
  /Failed to load module script/i,
  /Loading (?:CSS )?chunk [\w-]+ failed/i,
]

/**
 * Recognises the errors a lazily-loaded chunk produces when the deployment
 * that referenced it is gone (old content-hashed files removed, or HTML
 * served for a missing script).
 */
export function isChunkLoadError(error: unknown) {
  if (!error) {
    return false
  }

  const name = typeof error === "object" && "name" in error ? String((error as { name: unknown }).name) : ""
  if (name === "ChunkLoadError") {
    return true
  }

  let message = ""
  if (typeof error === "string") {
    message = error
  } else if (typeof error === "object" && "message" in error) {
    message = String((error as { message: unknown }).message)
  }

  return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(message))
}

const IGNORED_INPUT_TYPES: ReadonlySet<string> = new Set([
  "button",
  "checkbox",
  "color",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "search",
  "submit",
])

/** Whether typing into an `<input type=…>` counts as input worth protecting. */
export function isProtectedInputType(type: string) {
  return !IGNORED_INPUT_TYPES.has(type.toLowerCase())
}
