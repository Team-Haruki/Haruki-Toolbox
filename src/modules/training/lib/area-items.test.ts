import { describe, expect, test } from "bun:test"
import {
  AREA_COIN_MATERIAL_ID,
  areaItemIconAssetPath,
  areaItemMatchesFilter,
  buildAreaItemShopItems,
  buildAreaItemViews,
  collectUserAreaItemLevels,
  collectUserMaterials,
  materialIconAssetPath,
  normalizeAreaShopItems,
  normalizeAreaShopResourceBoxDetails,
  releasedAreaItemLevelCap,
  type AreaItemLevelMaster,
  type AreaItemMaster,
  type AreaShopItem,
} from "./area-items"

function makeItem(id: number, areaId: number): AreaItemMaster {
  return { id, areaId, name: `item-${id}`, assetbundleName: `areaitem${id}` }
}

function makeLevel(areaItemId: number, level: number, extra: Partial<AreaItemLevelMaster> = {}): AreaItemLevelMaster {
  return {
    areaItemId,
    level,
    targetUnit: "any",
    targetCardAttr: "any",
    targetGameCharacterId: 0,
    power1BonusRate: level * 2,
    ...extra,
  }
}

function makeShopItem(id: number, extra: Partial<AreaShopItem> = {}): AreaShopItem {
  return { id, shopId: 0, seq: id, resourceBoxId: 0, startAt: 0, costs: [], ...extra }
}

describe("normalizeAreaShopItems", () => {
  test("unwraps nested cost records and keeps flat ones", () => {
    const items = normalizeAreaShopItems([
      {
        id: 1,
        shopId: 5,
        seq: 3,
        resourceBoxId: 9,
        startAt: 100,
        costs: [
          { cost: { resourceType: "material", resourceId: 2, quantity: 100 } },
          { resourceType: "coin", resourceId: 0, quantity: 20000 },
        ],
      },
    ])

    expect(items).toHaveLength(1)
    expect(items[0].costs).toEqual([
      { resourceType: "material", resourceId: 2, quantity: 100 },
      { resourceType: "coin", resourceId: 0, quantity: 20000 },
    ])
  })
})

describe("normalizeAreaShopResourceBoxDetails", () => {
  test("keeps only shop_item purpose area_item rows with positive level", () => {
    const details = normalizeAreaShopResourceBoxDetails([
      { resourceBoxId: 1, resourceBoxPurpose: "shop_item", resourceType: "area_item", resourceId: 3, resourceLevel: 2 },
      { resourceBoxId: 2, resourceBoxPurpose: "shop_item", resourceType: "material", resourceId: 3, resourceLevel: 2 },
      { resourceBoxId: 3, resourceBoxPurpose: "ad_reward", resourceType: "area_item", resourceId: 3, resourceLevel: 2 },
      { resourceBoxId: 4, resourceBoxPurpose: "shop_item", resourceType: "area_item", resourceId: 3, resourceLevel: null },
    ])

    expect(details).toEqual([{ resourceBoxId: 1, areaItemId: 3, level: 2 }])
  })
})

describe("collectUserAreaItemLevels", () => {
  test("keeps the max level across areas and skips invalid ids", () => {
    const levels = collectUserAreaItemLevels([
      { areaId: 1, areaItems: [{ areaItemId: 1, level: 3 }, { areaItemId: 0, level: 9 }] },
      { areaId: 2, areaItems: [{ areaItemId: 1, level: 5 }, { areaItemId: 2, level: 1 }] },
    ])

    expect(levels.get(1)).toBe(5)
    expect(levels.get(2)).toBe(1)
    expect(levels.size).toBe(2)
  })
})

describe("collectUserMaterials", () => {
  test("seeds coin under the pseudo material id", () => {
    const materials = collectUserMaterials(
      [{ materialId: 7, quantity: 42 }],
      { coin: 12345 },
    )

    expect(materials.get(AREA_COIN_MATERIAL_ID)).toBe(12345)
    expect(materials.get(7)).toBe(42)
  })

  test("defaults coin to 0 when gamedata is missing", () => {
    expect(collectUserMaterials([], null).get(AREA_COIN_MATERIAL_ID)).toBe(0)
  })
})

describe("buildAreaItemShopItems", () => {
  test("maps resource box details to shop items and skips future startAt", () => {
    const items = [makeItem(1, 1), makeItem(2, 1)]
    const levelsByItem = new Map([
      [1, [makeLevel(1, 1), makeLevel(1, 2), makeLevel(1, 3)]],
      [2, [makeLevel(2, 1), makeLevel(2, 2)]],
    ])
    const shopItems = [
      makeShopItem(1, { resourceBoxId: 101 }),
      makeShopItem(2, { resourceBoxId: 102 }),
      makeShopItem(3, { resourceBoxId: 103, startAt: 2_000 }),
    ]
    const details = [
      { resourceBoxId: 101, areaItemId: 1, level: 2 },
      { resourceBoxId: 102, areaItemId: 1, level: 3 },
      { resourceBoxId: 103, areaItemId: 2, level: 2 },
      { resourceBoxId: 999, areaItemId: 1, level: 1 },
    ]

    const result = buildAreaItemShopItems({
      itemIds: [1, 2],
      areaItemById: new Map(items.map((item) => [item.id, item])),
      levelsByItem,
      shopItems,
      shopDetails: details,
      nowMs: 1_000,
    })

    expect(result.get(1)?.get(2)?.id).toBe(1)
    expect(result.get(1)?.get(3)?.id).toBe(2)
    // Future shop item skipped; item 2 has no mapping (areaId 1 has no fallback shop).
    expect(result.get(2)).toBeUndefined()
  })

  test("first mapping wins for a duplicated level", () => {
    const result = buildAreaItemShopItems({
      itemIds: [1],
      areaItemById: new Map([[1, makeItem(1, 1)]]),
      levelsByItem: new Map([[1, [makeLevel(1, 1)]]]),
      shopItems: [makeShopItem(1, { resourceBoxId: 101 }), makeShopItem(2, { resourceBoxId: 102 })],
      shopDetails: [
        { resourceBoxId: 101, areaItemId: 1, level: 1 },
        { resourceBoxId: 102, areaItemId: 1, level: 1 },
      ],
      nowMs: 1_000,
    })

    expect(result.get(1)?.get(1)?.id).toBe(1)
  })

  test("fills gaps via even seq-ordered distribution of the area's shop", () => {
    // areaId 7 -> shopId 6; two targets x two levels; 4 shop items -> block size 2.
    const items = [makeItem(11, 7), makeItem(10, 7)]
    const levelsByItem = new Map([
      [10, [makeLevel(10, 1), makeLevel(10, 2)]],
      [11, [makeLevel(11, 2), makeLevel(11, 1)]],
    ])
    const shopItems = [
      makeShopItem(4, { shopId: 6, seq: 4 }),
      makeShopItem(2, { shopId: 6, seq: 2 }),
      makeShopItem(1, { shopId: 6, seq: 1 }),
      makeShopItem(3, { shopId: 6, seq: 3 }),
    ]

    const result = buildAreaItemShopItems({
      itemIds: [10, 11],
      areaItemById: new Map(items.map((item) => [item.id, item])),
      levelsByItem,
      shopItems,
      shopDetails: [],
      nowMs: 1_000,
    })

    // Targets sorted by item id, shop items by seq: item 10 -> seq 1,2; item 11 -> seq 3,4.
    expect(result.get(10)?.get(1)?.id).toBe(1)
    expect(result.get(10)?.get(2)?.id).toBe(2)
    expect(result.get(11)?.get(1)?.id).toBe(3)
    expect(result.get(11)?.get(2)?.id).toBe(4)
  })

  test("fallback fill does not override existing mappings and skips uneven shops", () => {
    const withExisting = buildAreaItemShopItems({
      itemIds: [10],
      areaItemById: new Map([[10, makeItem(10, 7)]]),
      levelsByItem: new Map([[10, [makeLevel(10, 1), makeLevel(10, 2)]]]),
      shopItems: [
        makeShopItem(50, { resourceBoxId: 500, shopId: 6, seq: 9 }),
        makeShopItem(1, { shopId: 6, seq: 1 }),
      ],
      shopDetails: [{ resourceBoxId: 500, areaItemId: 10, level: 1 }],
      nowMs: 1_000,
    })
    // Detail mapping for level 1 kept; fallback only fills level 2.
    expect(withExisting.get(10)?.get(1)?.id).toBe(50)
    expect(withExisting.get(10)?.get(2)?.id).toBe(50)

    const uneven = buildAreaItemShopItems({
      itemIds: [10, 11],
      areaItemById: new Map([[10, makeItem(10, 7)], [11, makeItem(11, 7)]]),
      levelsByItem: new Map([
        [10, [makeLevel(10, 1)]],
        [11, [makeLevel(11, 1)]],
      ]),
      shopItems: [
        makeShopItem(1, { shopId: 6, seq: 1 }),
        makeShopItem(2, { shopId: 6, seq: 2 }),
        makeShopItem(3, { shopId: 6, seq: 3 }),
      ],
      shopDetails: [],
      nowMs: 1_000,
    })
    // 3 shop items for 2 targets is not an even multiple -> no fallback fill.
    expect(uneven.size).toBe(0)
  })
})

describe("releasedAreaItemLevelCap", () => {
  const levels = [makeLevel(1, 1), makeLevel(1, 2), makeLevel(1, 3)]

  test("caps at the highest contiguous level with a shop item", () => {
    const shopLevels = new Map([[1, makeShopItem(1)], [2, makeShopItem(2)]])
    expect(releasedAreaItemLevelCap(levels, shopLevels)).toBe(2)
  })

  test("full coverage releases the max level", () => {
    const shopLevels = new Map([[1, makeShopItem(1)], [2, makeShopItem(2)], [3, makeShopItem(3)]])
    expect(releasedAreaItemLevelCap(levels, shopLevels)).toBe(3)
  })

  test("a gap in the shop mapping stops the cap", () => {
    const shopLevels = new Map([[1, makeShopItem(1)], [3, makeShopItem(3)]])
    expect(releasedAreaItemLevelCap(levels, shopLevels)).toBe(1)
  })

  test("returns 0 without masterdata level 1 or without shop items", () => {
    expect(releasedAreaItemLevelCap([makeLevel(1, 2)], new Map([[2, makeShopItem(1)]]))).toBe(0)
    expect(releasedAreaItemLevelCap(levels, new Map())).toBe(0)
    expect(releasedAreaItemLevelCap(levels, undefined)).toBe(0)
  })
})

describe("buildAreaItemViews", () => {
  // Item 1 in area 1 (no fallback shop) fully mapped through details.
  const areaItems = [makeItem(1, 1)]
  const areaItemLevels = [
    makeLevel(1, 1, { targetGameCharacterId: 1 }),
    makeLevel(1, 2, { targetGameCharacterId: 1 }),
    makeLevel(1, 3, { targetGameCharacterId: 1 }),
  ]
  const shopItems = [
    makeShopItem(1, {
      resourceBoxId: 101,
      costs: [{ resourceType: "coin", resourceId: 0, quantity: 100 }],
    }),
    makeShopItem(2, {
      resourceBoxId: 102,
      costs: [
        { resourceType: "coin", resourceId: 0, quantity: 200 },
        { resourceType: "material", resourceId: 7, quantity: 10 },
      ],
    }),
    makeShopItem(3, {
      resourceBoxId: 103,
      costs: [
        { resourceType: "coin", resourceId: 0, quantity: 300 },
        { resourceType: "material", resourceId: 7, quantity: 20 },
      ],
    }),
  ]
  const shopDetails = [
    { resourceBoxId: 101, areaItemId: 1, level: 1 },
    { resourceBoxId: 102, areaItemId: 1, level: 2 },
    { resourceBoxId: 103, areaItemId: 1, level: 3 },
  ]

  test("accumulates running material sums with enough/insufficient flags", () => {
    const views = buildAreaItemViews({
      areaItems,
      areaItemLevels,
      shopItems,
      shopDetails,
      userAreaLevels: new Map([[1, 1]]),
      userMaterials: new Map([
        [AREA_COIN_MATERIAL_ID, 250],
        [7, 15],
      ]),
      nowMs: 1_000,
    })

    expect(views).toHaveLength(1)
    const view = views[0]
    expect(view.currentLevel).toBe(1)
    expect(view.maxVisibleLevel).toBe(3)
    expect(view.target).toEqual({ type: "character", characterId: 1 })
    // minCurrentLevel is 1 -> rows start at level 2.
    expect(view.levels.map((row) => row.level)).toEqual([2, 3])

    const [level2, level3] = view.levels
    expect(level2.bonus).toBe(4)
    expect(level2.canUpgrade).toBe(true)
    expect(level2.materials).toEqual([
      {
        materialId: AREA_COIN_MATERIAL_ID,
        resourceType: "coin",
        quantity: 200,
        haveQuantity: 250,
        sumQuantity: 200,
        isEnough: true,
      },
      { materialId: 7, resourceType: "material", quantity: 10, haveQuantity: 15, sumQuantity: 10, isEnough: true },
    ])

    expect(level3.canUpgrade).toBe(false)
    expect(level3.materials).toEqual([
      {
        materialId: AREA_COIN_MATERIAL_ID,
        resourceType: "coin",
        quantity: 300,
        haveQuantity: 250,
        sumQuantity: 500,
        isEnough: false,
      },
      { materialId: 7, resourceType: "material", quantity: 20, haveQuantity: 15, sumQuantity: 30, isEnough: false },
    ])
  })

  test("clamps the current level to the released cap", () => {
    const views = buildAreaItemViews({
      areaItems,
      areaItemLevels,
      shopItems: shopItems.slice(0, 2),
      shopDetails: shopDetails.slice(0, 2),
      userAreaLevels: new Map([[1, 3]]),
      userMaterials: new Map(),
      nowMs: 1_000,
    })

    // Only levels 1-2 have shop items -> released cap 2 clamps level 3 down.
    expect(views[0].currentLevel).toBe(2)
    expect(views[0].maxVisibleLevel).toBe(2)
    expect(views[0].levels).toHaveLength(0)
  })

  test("rows start after the minimum current level across items", () => {
    const twoItems = [makeItem(1, 1), makeItem(2, 1)]
    const levels = [
      ...areaItemLevels,
      makeLevel(2, 1),
      makeLevel(2, 2),
    ]
    const details = [
      ...shopDetails,
      { resourceBoxId: 101, areaItemId: 2, level: 1 },
      { resourceBoxId: 102, areaItemId: 2, level: 2 },
    ]

    const views = buildAreaItemViews({
      areaItems: twoItems,
      areaItemLevels: levels,
      shopItems,
      shopDetails: details,
      userAreaLevels: new Map([
        [1, 2],
        [2, 0],
      ]),
      userMaterials: new Map(),
      nowMs: 1_000,
    })

    // minCurrentLevel is 0 (item 2) -> item 1 lists levels from 1.
    expect(views[0].itemId).toBe(1)
    expect(views[0].levels.map((row) => row.level)).toEqual([1, 2, 3])
    // Levels at or below the item's own current level carry no costs.
    expect(views[0].levels[0].materials).toHaveLength(0)
    expect(views[0].levels[0].canUpgrade).toBe(true)
  })

  test("marks rows without a shop item as not upgradable", () => {
    const views = buildAreaItemViews({
      areaItems,
      areaItemLevels,
      shopItems: shopItems.slice(0, 2),
      shopDetails: shopDetails.slice(0, 2),
      userAreaLevels: new Map([[1, 1]]),
      userMaterials: new Map(),
      nowMs: 1_000,
    })

    // Released cap is 2, so level 3 never renders; level 2 has no affordable coin.
    const view = views[0]
    expect(view.levels.map((row) => row.level)).toEqual([2])
    expect(view.levels[0].canUpgrade).toBe(false)
    expect(view.levels[0].materials[0].isEnough).toBe(false)
  })

  test("a filter switches the candidate set to the matched catalog", () => {
    const catalog = [makeItem(1, 5), makeItem(2, 7)]
    const levels = [
      makeLevel(1, 1),
      makeLevel(2, 1),
    ]

    const views = buildAreaItemViews({
      areaItems: catalog,
      areaItemLevels: levels,
      shopItems: [makeShopItem(1, { resourceBoxId: 101 })],
      shopDetails: [
        { resourceBoxId: 101, areaItemId: 1, level: 1 },
        { resourceBoxId: 101, areaItemId: 2, level: 1 },
      ],
      userAreaLevels: new Map(),
      userMaterials: new Map(),
      filter: { unit: "light_sound" },
      nowMs: 1_000,
    })

    expect(views.map((view) => view.itemId)).toEqual([1])
    expect(views[0].currentLevel).toBe(0)
  })
})

describe("areaItemMatchesFilter", () => {
  const vsItem = makeItem(1, 5)
  const vsLevels = [makeLevel(1, 1, { targetGameCharacterId: 21 })]
  const unitItem = makeItem(2, 5)
  const unitLevels = [makeLevel(2, 1, { targetUnit: "light_sound" })]

  test("piapro matches targetUnit piapro or character ids 21-26", () => {
    expect(areaItemMatchesFilter(vsItem, vsLevels, { unit: "piapro" })).toBe(true)
    const piaproUnitLevels = [makeLevel(3, 1, { targetUnit: "piapro" })]
    expect(areaItemMatchesFilter(makeItem(3, 1), piaproUnitLevels, { unit: "piapro" })).toBe(true)
    expect(areaItemMatchesFilter(unitItem, unitLevels, { unit: "piapro" })).toBe(false)
  })

  test("unit filter maps to the area id and excludes VS items", () => {
    expect(areaItemMatchesFilter(unitItem, unitLevels, { unit: "light_sound" })).toBe(true)
    // Same area but a VS item -> excluded from the unit filter.
    expect(areaItemMatchesFilter(vsItem, vsLevels, { unit: "light_sound" })).toBe(false)
    // Other unit areas do not match.
    expect(areaItemMatchesFilter(makeItem(4, 8), [makeLevel(4, 1)], { unit: "light_sound" })).toBe(false)
  })

  test("unit aliases normalize to canonical unit names", () => {
    expect(areaItemMatchesFilter(unitItem, unitLevels, { unit: "light_sound_club" })).toBe(true)
    expect(areaItemMatchesFilter(makeItem(5, 7), [makeLevel(5, 1)], { unit: "more_more_jump" })).toBe(true)
    expect(areaItemMatchesFilter(makeItem(6, 8), [makeLevel(6, 1)], { unit: "vivid_bad_squad" })).toBe(true)
    expect(areaItemMatchesFilter(makeItem(7, 9), [makeLevel(7, 1)], { unit: "wonderlands_x_showtime" })).toBe(true)
    expect(areaItemMatchesFilter(makeItem(8, 10), [makeLevel(8, 1)], { unit: "25_ji_night_cord_de" })).toBe(true)
  })

  test("tree and flower toggles match their fixed area ids", () => {
    expect(areaItemMatchesFilter(makeItem(9, 11), [makeLevel(9, 1)], { tree: true })).toBe(true)
    expect(areaItemMatchesFilter(makeItem(10, 13), [makeLevel(10, 1)], { flower: true })).toBe(true)
    expect(areaItemMatchesFilter(makeItem(11, 13), [makeLevel(11, 1)], { tree: true })).toBe(false)
  })

  test("attribute and character filters match level targets", () => {
    const attrLevels = [makeLevel(12, 1, { targetCardAttr: "cool" })]
    expect(areaItemMatchesFilter(makeItem(12, 1), attrLevels, { attr: "cool" })).toBe(true)
    expect(areaItemMatchesFilter(makeItem(12, 1), attrLevels, { attr: "cute" })).toBe(false)

    const charLevels = [makeLevel(13, 1, { targetGameCharacterId: 5 })]
    expect(areaItemMatchesFilter(makeItem(13, 1), charLevels, { characterId: 5 })).toBe(true)
    expect(areaItemMatchesFilter(makeItem(13, 1), charLevels, { characterId: 6 })).toBe(false)
  })
})

describe("asset paths", () => {
  test("area item icon path", () => {
    expect(areaItemIconAssetPath("areaitem0501")).toBe("startapp/areaitem/areaitem0501/areaitem0501.png")
  })

  test("material icon paths", () => {
    expect(materialIconAssetPath("coin", AREA_COIN_MATERIAL_ID)).toBe("startapp/thumbnail/common_material/coin.png")
    expect(materialIconAssetPath("paid_jewel", 0)).toBe("startapp/thumbnail/common_material/jewel.png")
    expect(materialIconAssetPath("material", 17)).toBe("startapp/thumbnail/material/material17.png")
    expect(materialIconAssetPath("material", 0)).toBeNull()
    expect(materialIconAssetPath("boost_item", 1)).toBeNull()
  })
})
