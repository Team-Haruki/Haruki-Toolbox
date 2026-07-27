import { describe, expect, it } from "bun:test"
import { loadMasterFilesCacheFirst, type MasterFilesCacheFirstDependencies } from "./master-loader"
import type { SekaiRegionCacheMeta } from "./types"

function makeMeta(fetchVersion: string): SekaiRegionCacheMeta {
  return {
    region: "jp",
    master: {
      repo: "repo",
      dataVersion: fetchVersion,
      displayVersion: fetchVersion,
      fetchVersion,
      cdnVersion: null,
      files: [],
      updatedAt: 0,
    },
    musicMetas: null,
  }
}

function makeDeps(input: {
  metas: Array<string | null>
  files?: Record<string, unknown>
}): MasterFilesCacheFirstDependencies {
  let metaCall = 0
  return {
    readMeta: async () => {
      const version = input.metas[Math.min(metaCall, input.metas.length - 1)]
      metaCall += 1
      return version ? makeMeta(version) : null
    },
    readFiles: async () => ({ ...(input.files ?? {}) }),
  }
}

describe("loadMasterFilesCacheFirst", () => {
  it("applies complete cache once and skips the re-read when the version is unchanged", async () => {
    const applied: Record<string, unknown>[] = []
    const result = await loadMasterFilesCacheFirst(
      {
        region: "jp",
        files: ["gameCharacters"],
        ensure: async () => {},
        apply: (files) => applied.push(files),
      },
      makeDeps({ metas: ["v1", "v1"], files: { gameCharacters: [] } }),
    )

    expect(result).toEqual({ appliedFromCache: true, refreshed: false })
    expect(applied).toHaveLength(1)
  })

  it("re-applies after the remote check when the cached version changed", async () => {
    const applied: Record<string, unknown>[] = []
    const result = await loadMasterFilesCacheFirst(
      {
        region: "jp",
        files: ["gameCharacters"],
        ensure: async () => {},
        apply: (files) => applied.push(files),
      },
      makeDeps({ metas: ["v1", "v2"], files: { gameCharacters: [] } }),
    )

    expect(result).toEqual({ appliedFromCache: true, refreshed: true })
    expect(applied).toHaveLength(2)
  })

  it("waits for ensure when the cache is incomplete", async () => {
    const applied: Record<string, unknown>[] = []
    let ensured = false
    const result = await loadMasterFilesCacheFirst(
      {
        region: "jp",
        files: ["gameCharacters", "characterRanks"],
        ensure: async () => {
          ensured = true
        },
        apply: (files) => applied.push(files),
      },
      makeDeps({ metas: ["v1"], files: { gameCharacters: [] } }),
    )

    expect(ensured).toBe(true)
    expect(result).toEqual({ appliedFromCache: false, refreshed: true })
    expect(applied).toHaveLength(1)
  })

  it("keeps stale cached data when the remote check fails", async () => {
    const applied: Record<string, unknown>[] = []
    const result = await loadMasterFilesCacheFirst(
      {
        region: "jp",
        files: ["gameCharacters"],
        ensure: async () => {
          throw new Error("offline")
        },
        apply: (files) => applied.push(files),
      },
      makeDeps({ metas: ["v1"], files: { gameCharacters: [] } }),
    )

    expect(result).toEqual({ appliedFromCache: true, refreshed: false })
    expect(applied).toHaveLength(1)
  })

  it("rethrows ensure failures when nothing could be applied from cache", async () => {
    await expect(loadMasterFilesCacheFirst(
      {
        region: "jp",
        files: ["gameCharacters"],
        ensure: async () => {
          throw new Error("offline")
        },
        apply: () => {},
      },
      makeDeps({ metas: [null] }),
    )).rejects.toThrow("offline")
  })

  it("stops applying when the load was superseded", async () => {
    const applied: Record<string, unknown>[] = []
    const result = await loadMasterFilesCacheFirst(
      {
        region: "jp",
        files: ["gameCharacters"],
        ensure: async () => {},
        isCurrent: () => false,
        apply: (files) => applied.push(files),
      },
      makeDeps({ metas: ["v1", "v2"], files: { gameCharacters: [] } }),
    )

    expect(result).toEqual({ appliedFromCache: false, refreshed: false })
    expect(applied).toHaveLength(0)
  })
})
