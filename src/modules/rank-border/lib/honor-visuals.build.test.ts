import { describe, expect, it } from "bun:test"
import { buildHonorView, honorLevelStars, resolveProfileHonorViews, type HonorVisualContext } from "./honor-visuals"
import { normalizeProfileHonors } from "./rank-border"

const ctx = { region: "jp" as const, assetEndpoint: "china" as const }

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

  const levelledHonor = {
    id: 4,
    groupId: 1,
    honorRarity: "highest",
    assetbundleName: "honor_0004",
    levels: Array.from({ length: 100 }, (_, index) => ({ level: index + 1 })),
  }
  const medalGroup = { id: 1, honorType: "character", isMedalDisplayed: true }

  it.each([
    [10, null, 10],
    [11, 1, 1],
    [20, 1, 10],
    [21, 2, 1],
    [91, 9, 1],
    [100, 9, 10],
  ])("uses the medal tier and remaining stars for level %i", (level, tier, starCount) => {
    const view = buildHonorView({
      key: "medal",
      label: "一歌ファン",
      honor: levelledHonor,
      group: medalGroup,
      honorId: 4,
      level,
    }, ctx)
    if (tier == null) {
      expect(view.medalUrl).toBeNull()
    } else {
      expect(view.medalUrl).toContain(`jp-assets/startapp/honor_medal/medal/icon_degree_medal${tier}.png`)
    }
    const stars = honorLevelStars(view)
    expect(stars).toHaveLength(starCount!)
    expect(stars.every((star) => star.slot >= 0 && star.slot < 5)).toBe(true)
  })

  it("keeps medal-less regions and honors without levels on the legacy display", () => {
    const base = { key: "legacy", label: "一歌ファン", honorId: 4, level: 11 }
    const oldRegion = buildHonorView({
      ...base,
      honor: levelledHonor,
      group: { id: 1, honorType: "character" },
    }, { ...ctx, region: "en" })
    expect(oldRegion.medalUrl).toBeNull()
    expect(honorLevelStars(oldRegion)).toHaveLength(1)
    const nonLevelled = buildHonorView({
      ...base,
      honor: { ...levelledHonor, levels: [] },
      group: medalGroup,
    }, ctx)
    expect(nonLevelled.medalUrl).toBeNull()
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

  it("preserves optional profile customization IDs without accepting invalid IDs", () => {
    const honors = normalizeProfileHonors([
      { seq: 1, honorId: 657, honorBackgroundId: "10102", honorWordId: "10101" },
      { seq: 2, honorId: 657, honorBackgroundId: 0, honorWordId: -1 },
      { seq: 3, honorId: 657 },
    ])
    expect(honors[0]).toMatchObject({ honorBackgroundId: 10102, honorWordId: 10101 })
    expect(honors[1]).toMatchObject({ honorBackgroundId: null, honorWordId: null })
    expect(honors[2]).toMatchObject({ honorBackgroundId: null, honorWordId: null })
  })

  const customCtx: HonorVisualContext = {
    ...visualCtx,
    // Capabilities follow each region's data, not a hardcoded JP check.
    region: "en",
    honorBackgroundById: new Map([
      [10902, { id: 10902, seq: 2, honorGroupId: 9, assetbundleName: "honor_bg_style_02_09" }],
      [10901, { id: 10901, seq: 1, honorGroupId: 9, assetbundleName: "honor_bg_style_01_09" }],
      [10101, { id: 10101, seq: 1, honorGroupId: 1, assetbundleName: "honor_bg_style_01_01" }],
    ]),
    honorWordById: new Map([
      [10902, { id: 10902, seq: 2, honorGroupId: 9, assetbundleName: "honor_word_09_02", name: "こはね推し" }],
      [10901, { id: 10901, seq: 1, honorGroupId: 9, assetbundleName: "honor_word_09_01", name: "こはねファン" }],
    ]),
  }

  it("uses the selected character background and word with classic art as fallback", () => {
    const [view] = resolveProfileHonorViews(normalizeProfileHonors([
      { seq: 1, honorId: 657, honorLevel: 5, honorBackgroundId: 10902, honorWordId: 10902 },
    ]), customCtx)
    expect(view?.customBackgroundUrl).toContain("en-assets/startapp/honor_background/honor_bg_style_02_09/degree_sub.png")
    expect(view?.baseUrl).toContain("startapp/honor/honor_bg_character/degree_sub.png")
    expect(view?.frameUrl).toBe("/rank-border/honor/frame_degree_s_3.png")
    expect(view?.label).toBe("こはね推し")
  })

  it("uses the first customization by seq when IDs are unset, missing, or belong to another group", () => {
    for (const honorBackgroundId of [undefined, 999999, 10101]) {
      const [view] = resolveProfileHonorViews(normalizeProfileHonors([
        { seq: 1, honorId: 657, honorBackgroundId },
      ]), customCtx)
      expect(view?.customBackgroundUrl).toContain("honor_bg_style_01_09/degree_sub.png")
      expect(view?.label).toBe("こはねファン")
    }
  })

  it("keeps old regions and other honor groups on the classic rendering", () => {
    const honors = normalizeProfileHonors([
      { seq: 1, honorId: 657, honorBackgroundId: 10902, honorWordId: 10902 },
    ])
    const [oldRegionView] = resolveProfileHonorViews(honors, visualCtx)
    expect(oldRegionView?.customBackgroundUrl).toBeNull()
    expect(oldRegionView?.label).toBe(honor.name)
    const [eventView] = resolveProfileHonorViews(honors, {
      ...customCtx,
      honorGroupById: new Map([[9, { ...group, honorType: "event" }]]),
    })
    expect(eventView?.customBackgroundUrl).toBeNull()
    expect(eventView?.label).toBe(honor.name)
  })
})
