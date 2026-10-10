import { describe, expect, test } from "bun:test"
import {
  compareVersions,
  decideAppUpdate,
  DEFAULT_RELOAD_GUARD_OPTIONS,
  evaluateReloadGuard,
  isBelowMinimumVersion,
  isChunkLoadError,
  isDifferentBuild,
  isProtectedInputType,
  normalizeBuildInfo,
  parseReloadGuardState,
  SILENT_APPLY_AFTER_HIDDEN_MS,
  type AppBuildInfo,
  type AppUpdateContext,
} from "./app-update-policy"
import { readAppUpdateMessage } from "./app-update-protocol"

const current: AppBuildInfo = { version: "9.9.0", gitCommit: "aaaaaaaaaaaa", buildTime: "2026-10-10T00:00:00.000Z" }

function remote(overrides: Partial<AppBuildInfo> = {}): AppBuildInfo {
  return { version: "9.9.1", gitCommit: "bbbbbbbbbbbb", buildTime: "2026-10-11T00:00:00.000Z", ...overrides }
}

function context(overrides: Partial<AppUpdateContext> = {}): AppUpdateContext {
  return { current, remote: remote(), hasUnsavedInput: false, hiddenForMs: 0, ...overrides }
}

describe("compareVersions", () => {
  test("orders major, minor and patch numerically", () => {
    expect(compareVersions("9.8.3", "9.9.0")).toBe(-1)
    expect(compareVersions("9.10.0", "9.9.9")).toBe(1)
    expect(compareVersions("10.0.0", "9.99.99")).toBe(1)
    expect(compareVersions("9.9.0", "9.9.0")).toBe(0)
  })

  test("accepts a leading v and ignores build metadata", () => {
    expect(compareVersions("v9.9.0", "9.9.0")).toBe(0)
    expect(compareVersions("9.9.0+abc", "9.9.0")).toBe(0)
  })

  test("ranks prereleases below their release, numerically then lexically", () => {
    expect(compareVersions("9.0.0-dev3", "9.0.0")).toBe(-1)
    expect(compareVersions("9.0.0", "9.0.0-dev3")).toBe(1)
    expect(compareVersions("9.0.0-dev2", "9.0.0-dev3")).toBe(-1)
    expect(compareVersions("9.0.0-rc.2", "9.0.0-rc.10")).toBe(-1)
    expect(compareVersions("9.0.0-1", "9.0.0-alpha")).toBe(-1)
    expect(compareVersions("9.0.0-alpha", "9.0.0-alpha.1")).toBe(-1)
    expect(compareVersions("9.0.0-beta", "9.0.0-alpha")).toBe(1)
  })

  test("returns null for anything that is not a version", () => {
    expect(compareVersions("unknown", "9.9.0")).toBeNull()
    expect(compareVersions("9.9", "9.9.0")).toBeNull()
    expect(compareVersions("9.9.0", "")).toBeNull()
  })
})

describe("isBelowMinimumVersion", () => {
  test("is true only for a strictly older version", () => {
    expect(isBelowMinimumVersion("9.5.0", "9.5.1")).toBe(true)
    expect(isBelowMinimumVersion("9.5.1", "9.5.1")).toBe(false)
    expect(isBelowMinimumVersion("9.9.0", "9.5.1")).toBe(false)
  })

  test("never forces on a missing or unparsable minimum", () => {
    expect(isBelowMinimumVersion("9.5.0", undefined)).toBe(false)
    expect(isBelowMinimumVersion("9.5.0", "")).toBe(false)
    expect(isBelowMinimumVersion("9.5.0", "latest")).toBe(false)
    expect(isBelowMinimumVersion("dev", "9.5.1")).toBe(false)
  })
})

describe("isDifferentBuild", () => {
  test("compares commits and ignores unknown ones", () => {
    expect(isDifferentBuild(current, remote())).toBe(true)
    expect(isDifferentBuild(current, remote({ gitCommit: current.gitCommit }))).toBe(false)
    expect(isDifferentBuild(current, remote({ gitCommit: "unknown" }))).toBe(false)
    expect(isDifferentBuild({ ...current, gitCommit: "unknown" }, remote())).toBe(false)
  })
})

describe("decideAppUpdate", () => {
  test("does nothing without remote info or on the same build", () => {
    expect(decideAppUpdate(context({ remote: null }))).toBe("none")
    expect(decideAppUpdate(context({ remote: remote({ gitCommit: current.gitCommit }) }))).toBe("none")
  })

  test("prompts a visible reader about a newer build", () => {
    expect(decideAppUpdate(context())).toBe("prompt")
  })

  test("applies silently after a long hidden period without unsaved input", () => {
    expect(decideAppUpdate(context({ hiddenForMs: SILENT_APPLY_AFTER_HIDDEN_MS }))).toBe("apply")
    expect(decideAppUpdate(context({ hiddenForMs: SILENT_APPLY_AFTER_HIDDEN_MS - 1 }))).toBe("prompt")
    expect(decideAppUpdate(context({ hiddenForMs: SILENT_APPLY_AFTER_HIDDEN_MS, hasUnsavedInput: true }))).toBe("prompt")
  })

  test("forces a build below the minimum supported version, input or not", () => {
    const below = remote({ minSupportedVersion: "9.9.1" })
    expect(decideAppUpdate(context({ remote: below }))).toBe("force")
    expect(decideAppUpdate(context({ remote: below, hasUnsavedInput: true }))).toBe("force")
    // Even when the commits match (a rebuild that only raised the floor).
    expect(decideAppUpdate(context({ remote: { ...below, gitCommit: current.gitCommit } }))).toBe("force")
  })

  test("does not force a build at the minimum", () => {
    expect(decideAppUpdate(context({ remote: remote({ minSupportedVersion: "9.9.0" }) }))).toBe("prompt")
  })
})

describe("normalizeBuildInfo", () => {
  test("reads the build-info.json fields", () => {
    expect(normalizeBuildInfo({
      version: "9.9.0",
      gitCommit: "abc",
      buildTime: "t",
      minSupportedVersion: " 9.5.1 ",
    })).toEqual({ version: "9.9.0", gitCommit: "abc", buildTime: "t", minSupportedVersion: "9.5.1" })
  })

  test("accepts the legacy gitHash field and a missing minimum", () => {
    expect(normalizeBuildInfo({ version: "9.0.0", gitHash: "abc", buildTime: "t" }))
      .toEqual({ version: "9.0.0", gitCommit: "abc", buildTime: "t" })
  })

  test("rejects incomplete payloads", () => {
    expect(normalizeBuildInfo(null)).toBeNull()
    expect(normalizeBuildInfo("9.9.0")).toBeNull()
    expect(normalizeBuildInfo({ version: "9.9.0", buildTime: "t" })).toBeNull()
    expect(normalizeBuildInfo({ gitCommit: "abc", buildTime: "t" })).toBeNull()
  })
})

describe("evaluateReloadGuard", () => {
  const { minIntervalMs, windowMs, maxAttempts } = DEFAULT_RELOAD_GUARD_OPTIONS

  test("allows the first reload for a key and records it", () => {
    const result = evaluateReloadGuard(null, "update:b", 1000)
    expect(result.allowed).toBe(true)
    expect(result.state).toEqual({ "update:b": { attempts: 1, firstAt: 1000, lastAt: 1000 } })
  })

  test("blocks an immediate second reload (a page that came back stale)", () => {
    const first = evaluateReloadGuard(null, "update:b", 1000)
    const second = evaluateReloadGuard(first.state, "update:b", 1000 + minIntervalMs - 1)
    expect(second.allowed).toBe(false)
  })

  test("allows at most maxAttempts reloads per window", () => {
    let state = evaluateReloadGuard(null, "chunk:a", 0).state
    let now = 0
    for (let attempt = 1; attempt < maxAttempts; attempt += 1) {
      now += minIntervalMs
      const result = evaluateReloadGuard(state, "chunk:a", now)
      expect(result.allowed).toBe(true)
      state = result.state
    }
    now += minIntervalMs
    expect(evaluateReloadGuard(state, "chunk:a", now).allowed).toBe(false)
  })

  test("starts over once the window has passed", () => {
    let state = evaluateReloadGuard(null, "chunk:a", 0).state
    state = evaluateReloadGuard(state, "chunk:a", minIntervalMs).state
    const later = evaluateReloadGuard(state, "chunk:a", windowMs + minIntervalMs + 1)
    expect(later.allowed).toBe(true)
    expect(later.state["chunk:a"].attempts).toBe(1)
  })

  test("tracks keys independently, so alternating causes cannot loop", () => {
    let state = evaluateReloadGuard(null, "update:b", 0).state
    state = evaluateReloadGuard(state, "chunk:a", 1).state
    const again = evaluateReloadGuard(state, "update:b", 2)
    expect(again.allowed).toBe(false)
    expect(Object.keys(again.state).sort()).toEqual(["chunk:a", "update:b"])
  })

  test("round-trips through storage and drops malformed records", () => {
    const { state } = evaluateReloadGuard(null, "update:b", 5)
    expect(parseReloadGuardState(JSON.stringify(state))).toEqual(state)
    expect(parseReloadGuardState(null)).toBeNull()
    expect(parseReloadGuardState("not json")).toBeNull()
    expect(parseReloadGuardState("[]")).toBeNull()
    expect(parseReloadGuardState(JSON.stringify({ a: { attempts: "1" }, b: { attempts: 1, firstAt: 2, lastAt: 3 } })))
      .toEqual({ b: { attempts: 1, firstAt: 2, lastAt: 3 } })
  })
})

describe("isChunkLoadError", () => {
  test("recognises dynamic import failures across browsers", () => {
    expect(isChunkLoadError(new TypeError("Failed to fetch dynamically imported module: https://x/assets/a-1.js"))).toBe(true)
    expect(isChunkLoadError(new TypeError("error loading dynamically imported module: https://x/assets/a-1.js"))).toBe(true)
    expect(isChunkLoadError(new TypeError("Importing a module script failed."))).toBe(true)
    expect(isChunkLoadError(new Error("Unable to preload CSS for /assets/a-1.css"))).toBe(true)
    expect(isChunkLoadError({ name: "ChunkLoadError", message: "" })).toBe(true)
    expect(isChunkLoadError("Failed to fetch dynamically imported module")).toBe(true)
  })

  test("ignores other errors", () => {
    expect(isChunkLoadError(new Error("Request failed with status code 500"))).toBe(false)
    expect(isChunkLoadError(new TypeError("Failed to fetch"))).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
    expect(isChunkLoadError(undefined)).toBe(false)
  })
})

describe("isProtectedInputType", () => {
  test("protects text-like fields and file pickers, not toggles or search boxes", () => {
    expect(isProtectedInputType("text")).toBe(true)
    expect(isProtectedInputType("number")).toBe(true)
    expect(isProtectedInputType("file")).toBe(true)
    expect(isProtectedInputType("checkbox")).toBe(false)
    expect(isProtectedInputType("SEARCH")).toBe(false)
  })
})

describe("readAppUpdateMessage", () => {
  test("accepts only the update protocol's messages", () => {
    expect(readAppUpdateMessage({ type: "haruki-app-update:probe" })).toEqual({ type: "haruki-app-update:probe" })
    expect(readAppUpdateMessage({ type: "SKIP_WAITING" })).toEqual({ type: "SKIP_WAITING" })
    const build = { version: "9.9.0", gitCommit: "abc" }
    expect(readAppUpdateMessage({ type: "haruki-app-update:ack", build })).toEqual({ type: "haruki-app-update:ack", build })
    expect(readAppUpdateMessage({ type: "haruki-app-update:hello", build })).toEqual({ type: "haruki-app-update:hello", build })
    expect(readAppUpdateMessage({ type: "haruki-app-update:ack" })).toBeNull()
    expect(readAppUpdateMessage({ type: "haruki-app-update:hello", build: { version: 9 } })).toBeNull()
    expect(readAppUpdateMessage({ type: "other" })).toBeNull()
    expect(readAppUpdateMessage("haruki-app-update:probe")).toBeNull()
    expect(readAppUpdateMessage(null)).toBeNull()
  })
})
