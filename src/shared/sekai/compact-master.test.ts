import { describe, expect, it } from "bun:test"
import { loadSekaiMasterDownload, restoreCompactCatalog } from "./compact-master"
import type { SekaiMasterVersionInfo } from "./types"

const manifest: SekaiMasterVersionInfo = {
  dataVersion: "1", cdnVersion: null, contentHash: "version",
  files: { cards: "original", compactCards: "small", gachas: "gacha", compactGachas: "small-gacha" },
}

describe("compact catalog downloads", () => {
  it("decodes both catalogs, preserving all fields and enum values", async () => {
    for (const [name, field, compact] of [
      ["cards", "cardParameters", "compactCards"],
      ["gachas", "gachaDetails", "compactGachas"],
    ] as const) {
      const calls: string[] = []
      const source = [{ id: 4, extra: [null, { x: 1 }], [field]: {
        id: [1, 2, 3], kind: [0, 1, null], wish: [0, 0, 1],
        __ENUM__: { kind: ["param1", "param2"], wish: [false, true] },
      } }]
      const actual = await loadSekaiMasterDownload("jp", name, manifest, async (file) => {
        calls.push(file)
        return source
      })
      expect(calls).toEqual([compact])
      expect(actual).toEqual([{ id: 4, extra: [null, { x: 1 }], [field]: [
        { id: 1, kind: "param1", wish: false },
        { id: 2, kind: "param2", wish: false },
        { id: 3, kind: null, wish: true },
      ] }])
      expect(Array.isArray(source[0]?.[field])).toBe(false)
    }
  })

  it("uses originals for other regions, other files and manifests without the export", async () => {
    for (const [region, name, version] of [
      ["cn", "cards", manifest], ["en", "gachas", manifest],
      ["jp", "events", manifest], ["jp", "cards.json", { ...manifest, files: {} }],
      ["jp", "gachas", { ...manifest, files: { gachas: "original" } }],
    ] as const) {
      const calls: string[] = []
      const original = [{ id: 1 }]
      expect(await loadSekaiMasterDownload(region, name, version, async (file) => {
        calls.push(file)
        return original
      })).toBe(original)
      expect(calls).toEqual([name.replace(".json", "")])
    }
  })

  it("falls back on a failed download or invalid compact data and propagates original failures", async () => {
    for (const invalid of [null, [null], [{ cardParameters: { id: [1, 2], power: [1], __ENUM__: {} } }],
      [{ cardParameters: { id: [2], __ENUM__: { id: [1] } } }], new Error("404")]) {
      const calls: string[] = []
      const original = [{ id: 8 }]
      const result = await loadSekaiMasterDownload("jp", "cards", manifest, async (file) => {
        calls.push(file)
        if (file === "cards") return original
        if (invalid instanceof Error) throw invalid
        return invalid
      })
      expect(calls).toEqual(["compactCards", "cards"])
      expect(result).toBe(original)
    }
    await expect(loadSekaiMasterDownload("jp", "cards", manifest, async () => {
      throw new Error("offline")
    })).rejects.toThrow("offline")
  })

  it("preserves unchanged arrays, absent fields, nulls, and empty catalogs", () => {
    const rows = [{ cardParameters: [] }, { id: 1 }, { cardParameters: null },
      { cardParameters: [{ x: 1 }, {}] }, { cardParameters: { param1: [5, 10] } }]
    expect(restoreCompactCatalog(rows, "cardParameters")).toEqual(rows)
    expect(restoreCompactCatalog([], "cardParameters")).toEqual([])
  })

  it("rejects malformed column and enum shapes", () => {
    for (const value of [{ __ENUM__: {} }, { x: 1, __ENUM__: {} }, { x: [1], __ENUM__: [] },
      { x: [1], __ENUM__: { x: "bad" } }, { x: [0.5], __ENUM__: { x: [1] } },
      { x: [-1], __ENUM__: { x: [1] } }, { x: ["0"], __ENUM__: { x: [1] } }]) {
      expect(() => restoreCompactCatalog([{ cardParameters: value }], "cardParameters")).toThrow()
    }
  })

  it("retains special own field names without changing object prototypes", () => {
    const columns: unknown = JSON.parse('{"__proto__":[{"x":1}],"constructor":[2],"__ENUM__":{}}')
    const result = restoreCompactCatalog([{ cardParameters: columns }], "cardParameters") as Array<{ cardParameters: object[] }>
    expect(JSON.stringify(result)).toBe('[{"cardParameters":[{"__proto__":{"x":1},"constructor":2}]}]')
    expect(Object.getPrototypeOf(result[0]?.cardParameters[0])).toBe(Object.prototype)
  })
})
