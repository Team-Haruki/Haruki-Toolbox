import { describe, expect, it } from "bun:test"
import { buildHonorView, resolveProfileHonorViews, type HonorVisualContext } from "./honor-visuals"
import { normalizeProfileHonors } from "./rank-border"

const ctx = { region: "jp" as const, assetEndpoint: "china" }

describe("buildHonorView", () => {
  it("composes an event rank honor the way the badge is drawn: background, frame, rank plate", () => {
    const view = buildHonorView({
      key: "r1",
      label: "1位",
      honor: { id: 8631, groupId: 674, honorRarity: "highest", assetbundleName: "honor_top_000001", levels: [] },
      group: { id: 674, honorType: "event", backgroundAssetbundleName: "honor_bg_event_partytime" },
      honorId: 8631,
      level: 1,
    }, ctx)
    expect(view.type).toBe("normal")
    expect(view.groupType).toBe("event")
    // Base art is the group background, in the `sub` size the lists use.
    expect(view.baseUrl).toContain("startapp/honor/honor_bg_event_partytime/degree_sub.png")
    // The `TOP n` plate is a separate layer at the sub offset, never stretched over the base.
    expect(view.rankUrl).toContain("startapp/honor/honor_top_000001/rank_sub.png")
    expect(view.rankPlacement).toBe("event")
    // Without a `frameName` on the group the stock rarity frame is used.
    expect(view.frameUrl).toBe("/rank-border/honor/frame_degree_s_4.png")
    expect(view.framePlacement).toBe("full")
  })

  it("takes the group's own frame when master names one", () => {
    const view = buildHonorView({
      key: "r3",
      label: "1位",
      honor: { id: 8631, groupId: 674, honorRarity: "highest", assetbundleName: "honor_top_000001", levels: [] },
      group: { id: 674, honorType: "event", backgroundAssetbundleName: "honor_bg_event_partytime", frameName: "event_partytime" },
      honorId: 8631,
      level: 1,
    }, ctx)
    expect(view.frameUrl).toContain("startapp/honor_frame/event_partytime/frame_degree_s_4.png")
  })

  it("falls back to the honor's own art and the stock frame without a group", () => {
    const view = buildHonorView({
      key: "r2",
      label: "x",
      honor: { id: 657, honorRarity: "high", assetbundleName: "honor_0657", levels: [] },
      group: null,
      honorId: 657,
      level: null,
    }, ctx)
    expect(view.baseUrl).toContain("startapp/honor/honor_0657/degree_sub.png")
    expect(view.rankUrl).toBeNull()
    expect(view.frameUrl).toBe("/rank-border/honor/frame_degree_s_3.png")
  })
})

describe("resolveProfileHonorViews", () => {
  const honor = { id: 657, groupId: 9, name: "ハロー、セカイ", honorRarity: "high", assetbundleName: "honor_0657", levels: [] }
  const group = { id: 9, honorType: "character", backgroundAssetbundleName: "honor_bg_character" }
  const visualCtx: HonorVisualContext = {
    cardById: new Map(),
    honorById: new Map([[657, honor]]),
    honorGroupById: new Map([[9, group]]),
    bondsHonorById: new Map(),
    bondsHonorWordById: new Map(),
    gameCharacterUnitById: new Map(),
    region: "jp",
    assetEndpoint: "china",
    localMockAssets: false,
  }

  it("draws the profile's honors in seq order, capped at the profile's three slots", () => {
    const honors = normalizeProfileHonors([
      { seq: 2, honorId: 657, honorLevel: 2, profileHonorType: "normal" },
      { seq: 1, honorId: 657, honorLevel: 5, profileHonorType: "normal" },
      { seq: 3, honorId: 999, honorLevel: 1, profileHonorType: "normal" },
      { seq: 4, honorId: 657, honorLevel: 1, profileHonorType: "normal" },
    ])
    const views = resolveProfileHonorViews(honors, visualCtx, 3, "test")
    expect(views.map((view) => view.level)).toEqual([5, 2, 1])
    expect(views[0]?.label).toBe("ハロー、セカイ")
    expect(views[0]?.baseUrl).toContain("startapp/honor/honor_bg_character/degree_sub.png")
    // Unknown ids still render a placeholder slot rather than shifting the row.
    expect(views[2]?.label).toBe("#999")
  })

  it("returns nothing for an empty or malformed honor list", () => {
    expect(resolveProfileHonorViews(normalizeProfileHonors(null), visualCtx)).toEqual([])
    expect(resolveProfileHonorViews(normalizeProfileHonors(["junk", 3]), visualCtx)).toEqual([])
  })
})
