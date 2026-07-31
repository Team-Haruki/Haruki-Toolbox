import { describe, expect, it } from "bun:test"
import {
  buildCostumeRoleId,
  listCostumeOptions,
  pickDefaultCostumeId,
  resolveDefaultCostumePartIds,
} from "./costume-options"

const RAW_COSTUMES = [
  { id: 1, seq: 10, costume3dGroupId: 1, costume3dType: "default", name: "未設定", partType: "head", colorId: 1, colorName: "ノーマル", characterId: 1, assetbundleName: "head_default_01" },
  { id: 2, seq: 20, costume3dGroupId: 2, costume3dType: "default", name: "デフォルト", partType: "hair", colorId: 1, colorName: "ノーマル", characterId: 1, assetbundleName: "hair_default_01" },
  { id: 3, seq: 40, costume3dGroupId: 3, costume3dType: "normal", name: "制服", partType: "body", colorId: 2, colorName: "青", characterId: 1, assetbundleName: "body_seifuku_b" },
  { id: 4, seq: 30, costume3dGroupId: 3, costume3dType: "default", name: "制服", partType: "body", colorId: 1, colorName: "赤", characterId: 1, assetbundleName: "body_seifuku_a" },
  { id: 5, seq: 5, costume3dGroupId: 4, costume3dType: "normal", name: "别人的", partType: "body", colorId: 1, colorName: "", characterId: 2, assetbundleName: "body_other" },
]

describe("listCostumeOptions", () => {
  it("filters by character and part, sorted by seq", () => {
    const options = listCostumeOptions(RAW_COSTUMES, 1, "body")
    expect(options.map((option) => option.id)).toEqual([4, 3])
    expect(options[0]).toMatchObject({ name: "制服", colorName: "赤", isDefault: true })
  })

  it("returns empty for characters without parts", () => {
    expect(listCostumeOptions(RAW_COSTUMES, 3, "body")).toEqual([])
  })
})

describe("defaults", () => {
  it("prefers the default-typed entry", () => {
    expect(pickDefaultCostumeId(listCostumeOptions(RAW_COSTUMES, 1, "body"))).toBe(4)
  })

  it("resolves stock head and hair ids per character", () => {
    expect(resolveDefaultCostumePartIds(RAW_COSTUMES, 1)).toEqual({
      headCostume3dId: 1,
      hairCostume3dId: 2,
    })
    expect(resolveDefaultCostumePartIds(RAW_COSTUMES, 3)).toEqual({
      headCostume3dId: null,
      hairCostume3dId: null,
    })
  })
})

describe("buildCostumeRoleId", () => {
  it("joins character and unit", () => {
    expect(buildCostumeRoleId(14, "theme_park")).toBe("14:theme_park")
    expect(buildCostumeRoleId(14, null)).toBeNull()
  })
})
