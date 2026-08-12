import { describe, expect, it } from "bun:test"
import {
  buildCostumeThumbnailAssetbundleName,
  buildRuntimeCostumeNameMap,
  listRuntimeCostumeOptions,
  normalizeRuntimePartType,
  pickDefaultOptionId,
  resolveRoleDefaults,
} from "./costume-options"

describe("buildCostumeThumbnailAssetbundleName", () => {
  it("keeps a real name that already carries a part suffix", () => {
    expect(buildCostumeThumbnailAssetbundleName(2, "body", 1, "body_seifuku_a")).toBe("body_seifuku_a")
  })

  it("reconstructs the name from id/part/color when the master ships it empty (Nuverse)", () => {
    // Verified against jp values: cn costume3dId 1002/1004/1006 map to these.
    expect(buildCostumeThumbnailAssetbundleName(1002, "body", 1, "")).toBe("cos0001_body")
    expect(buildCostumeThumbnailAssetbundleName(1004, "body", 2, "")).toBe("cos0001_body_01")
    expect(buildCostumeThumbnailAssetbundleName(1006, "body", 3, "")).toBe("cos0001_body_02")
    expect(buildCostumeThumbnailAssetbundleName(29001, "head", 1, "")).toBe("cos0029_head")
  })

  it("cannot reconstruct without a part type, so it returns the empty override", () => {
    expect(buildCostumeThumbnailAssetbundleName(1002, "", 1, "")).toBe("")
    expect(buildCostumeThumbnailAssetbundleName(1002, "  ", 1, "  ")).toBe("")
  })

  it("reconstructs from a blank (whitespace-only) override once a part type is known", () => {
    expect(buildCostumeThumbnailAssetbundleName(1002, "body", 1, "  ")).toBe("cos0001_body")
  })
})

const REGISTRY = {
  version: 1,
  entries: [
    { costume3dId: 2, partType: "body", characterId: 1, unit: "light_sound", name: "制服", colorId: 1, colorName: "赤", costumeAssetbundleName: "body_seifuku_a", costume3dGroupId: 3, packagePath: "parts/body/a/" },
    // Duplicate id from a second package: options must dedupe.
    { costume3dId: 2, partType: "body", characterId: 1, unit: "light_sound", name: "制服", colorId: 1, colorName: "赤", costumeAssetbundleName: "body_seifuku_a", costume3dGroupId: 3, packagePath: "parts/body/a-delta/" },
    { costume3dId: 9, partType: "body", characterId: 2, unit: "light_sound", name: "别人的", packagePath: "parts/body/x/" },
    { costume3dId: 201, partType: "hair", characterId: 1, unit: "light_sound", name: "デフォルト", packagePath: "parts/hair/a/" },
    // head_and_hair head sources act as full heads.
    { costume3dId: 29001, partType: "head", characterId: 1, unit: "light_sound", name: "トゥインクル", headCostume3dAssetbundleType: "head_and_hair", packagePath: "parts/head/a/" },
    // head_only accessories stay selectable in the head slot.
    { costume3dId: 1, partType: "head_optional", characterId: 1, unit: "light_sound", name: "未設定", headCostume3dAssetbundleType: "head_only", packagePath: "parts/head_optional/a/" },
    // Ambiguous id across two independent sources: must be skipped.
    { costume3dId: 500, partType: "head", characterId: 1, unit: "light_sound", name: "曖昧", headCostume3dAssetbundleType: "head_and_hair", packagePath: "parts/head/b/" },
    { costume3dId: 500, partType: "head_optional", characterId: 1, unit: "light_sound", name: "曖昧", headCostume3dAssetbundleType: "head_only", packagePath: "parts/head_optional/b/" },
    // Missing entries never become options.
    { costume3dId: 900, partType: "body", characterId: 1, unit: "light_sound", name: "缺失", status: "missing", packagePath: "parts/body/missing/" },
  ],
}

describe("normalizeRuntimePartType", () => {
  it("maps head_and_hair sources to full heads", () => {
    expect(normalizeRuntimePartType("head", "head_and_hair")).toBe("head")
    expect(normalizeRuntimePartType("head_optional", "head_and_hair")).toBe("head")
  })

  it("maps head_only-style heads to optional accessories", () => {
    expect(normalizeRuntimePartType("head", "head_only")).toBe("head_optional")
    expect(normalizeRuntimePartType("accessory", null)).toBe("head_optional")
    expect(normalizeRuntimePartType("body", null)).toBe("body")
    expect(normalizeRuntimePartType("prop", null)).toBeNull()
  })
})

describe("listRuntimeCostumeOptions", () => {
  it("lists deduped body options for the character only", () => {
    const options = listRuntimeCostumeOptions(REGISTRY, 1, "body")
    expect(options.map((option) => option.id)).toEqual([2])
    expect(options[0]).toMatchObject({ name: "制服", thumbnailAssetbundleName: "body_seifuku_a" })
  })

  it("combines full heads and accessories, skipping ambiguous ids", () => {
    const options = listRuntimeCostumeOptions(REGISTRY, 1, "head")
    expect(options.map((option) => option.id)).toEqual([1, 29001])
    // Full head_and_hair sets carry their own hairstyle; accessories do not.
    expect(options.map((option) => option.includesHair)).toEqual([false, true])
  })

  it("filters missing entries", () => {
    expect(listRuntimeCostumeOptions(REGISTRY, 1, "body").some((option) => option.id === 900)).toBe(false)
  })
})

describe("buildRuntimeCostumeNameMap", () => {
  it("maps every costume id to its name, keeping ambiguous heads that options drop", () => {
    const names = buildRuntimeCostumeNameMap(REGISTRY, 1)
    expect(names.get(2)).toEqual({ name: "制服", colorName: "赤" })
    expect(names.get(29001)?.name).toBe("トゥインクル")
    // id 500 is ambiguous, so listRuntimeCostumeOptions drops it — but its name
    // must still be resolvable for display.
    expect(listRuntimeCostumeOptions(REGISTRY, 1, "head").some((o) => o.id === 500)).toBe(false)
    expect(names.get(500)?.name).toBe("曖昧")
    // Other characters are excluded.
    expect(names.has(9)).toBe(false)
  })
})

describe("resolveRoleDefaults", () => {
  const CATALOG = {
    masterVersion: "x",
    roles: [
      { roleId: 1, characterId: 1, unit: "light_sound", bodyCostume3dId: 2, headCostume3dId: 1, hairCostume3dId: 201 },
    ],
  }

  it("finds the role's stock parts", () => {
    expect(resolveRoleDefaults(CATALOG, 1, "light_sound")).toEqual({
      bodyCostume3dId: 2,
      headCostume3dId: 1,
      hairCostume3dId: 201,
    })
    expect(resolveRoleDefaults(CATALOG, 1, "idol")).toBeNull()
  })
})

describe("pickDefaultOptionId", () => {
  const options = listRuntimeCostumeOptions(REGISTRY, 1, "head")

  it("prefers the catalog default when present, else the first option", () => {
    expect(pickDefaultOptionId(options, 29001)).toBe(29001)
    expect(pickDefaultOptionId(options, 999)).toBe(1)
    expect(pickDefaultOptionId([], 999)).toBeNull()
  })
})
