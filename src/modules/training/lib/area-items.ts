import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"

/**
 * Area item upgrade-material math, ported from Haruki-Cloud
 * internal/pjsk/render/education/snapshot_area.go (snapshot mode only —
 * the full-catalog "ShowFull" mode is intentionally not ported).
 */

/** Pseudo material id used for coin costs (Go: areaCoinMaterialID). */
export const AREA_COIN_MATERIAL_ID = -1

export const AREA_TREE_AREA_ID = 11
export const AREA_FLOWER_AREA_ID = 13

/** Go: areaFilterUnitAreaIDs. */
export const AREA_FILTER_UNIT_AREA_IDS: Record<string, number> = {
  light_sound: 5,
  idol: 7,
  street: 8,
  theme_park: 9,
  school_refusal: 10,
}

/** Go: areaItemShopIDByAreaID (hardcoded fallback shop mapping). */
export const AREA_ITEM_SHOP_ID_BY_AREA_ID: Record<number, number> = {
  5: 5,
  7: 6,
  8: 7,
  9: 8,
  10: 9,
  11: 10,
  13: 11,
}

const PIAPRO_CHARACTER_IDS = new Set([21, 22, 23, 24, 25, 26])

export type AreaItemMaster = {
  id: number
  areaId: number
  name: string
  assetbundleName: string
}

export type AreaItemLevelMaster = {
  areaItemId: number
  level: number
  targetUnit: string
  targetCardAttr: string
  targetGameCharacterId: number
  power1BonusRate: number
}

export type AreaShopItemCost = {
  resourceType: string
  resourceId: number
  quantity: number
}

export type AreaShopItem = {
  id: number
  shopId: number
  seq: number
  resourceBoxId: number
  startAt: number
  costs: AreaShopItemCost[]
}

/** Flat `resourceBoxDetails.json` row restricted to shop-item area-item grants. */
export type AreaShopResourceBoxDetail = {
  resourceBoxId: number
  areaItemId: number
  level: number
}

/** Go: normalizeUnit — unit alias normalization shared by filters. */
export function normalizeAreaUnit(unit: unknown): string {
  const value = typeof unit === "string" ? unit.trim().toLowerCase() : ""
  switch (value) {
    case "":
    case "any":
      return ""
    case "light_sound_club":
      return "light_sound"
    case "more_more_jump":
      return "idol"
    case "vivid_bad_squad":
      return "street"
    case "wonderlands_x_showtime":
      return "theme_park"
    case "25_ji_night_cord_de":
      return "school_refusal"
    default:
      return value
  }
}

/** Go: normalizeAttr. */
export function normalizeAreaAttr(attr: unknown): string {
  const value = typeof attr === "string" ? attr.trim().toLowerCase() : ""
  return value === "any" ? "" : value
}

export function normalizeAreaItems(raw: unknown): AreaItemMaster[] {
  const items: AreaItemMaster[] = []
  for (const record of normalizeCatalogRecords(raw)) {
    const id = normalizeCatalogNumber(record.id)
    if (id == null || id <= 0) {
      continue
    }

    items.push({
      id,
      areaId: normalizeCatalogNumber(record.areaId) ?? 0,
      name: normalizeCatalogString(record.name),
      assetbundleName: normalizeCatalogString(record.assetbundleName),
    })
  }

  return items
}

export function normalizeAreaItemLevels(raw: unknown): AreaItemLevelMaster[] {
  const levels: AreaItemLevelMaster[] = []
  for (const record of normalizeCatalogRecords(raw)) {
    const areaItemId = normalizeCatalogNumber(record.areaItemId)
    const level = normalizeCatalogNumber(record.level)
    if (areaItemId == null || areaItemId <= 0 || level == null || level <= 0) {
      continue
    }

    levels.push({
      areaItemId,
      level,
      targetUnit: normalizeCatalogString(record.targetUnit),
      targetCardAttr: normalizeCatalogString(record.targetCardAttr),
      targetGameCharacterId: normalizeCatalogNumber(record.targetGameCharacterId) ?? 0,
      power1BonusRate: normalizeCatalogNumber(record.power1BonusRate) ?? 0,
    })
  }

  return levels
}

function normalizeShopItemCost(record: Record<string, unknown>): AreaShopItemCost | null {
  // shopItems.json nests each entry as { cost: {...} }; accept flat rows too.
  const inner = record.cost != null && typeof record.cost === "object" && !Array.isArray(record.cost)
    ? (record.cost as Record<string, unknown>)
    : record
  const resourceType = normalizeCatalogString(inner.resourceType)
  if (!resourceType) {
    return null
  }

  return {
    resourceType,
    resourceId: normalizeCatalogNumber(inner.resourceId) ?? 0,
    quantity: normalizeCatalogNumber(inner.quantity) ?? 0,
  }
}

export function normalizeAreaShopItems(raw: unknown): AreaShopItem[] {
  const items: AreaShopItem[] = []
  for (const record of normalizeCatalogRecords(raw)) {
    const id = normalizeCatalogNumber(record.id)
    if (id == null || id <= 0) {
      continue
    }

    const costs: AreaShopItemCost[] = []
    for (const costRecord of normalizeCatalogRecords(record.costs)) {
      const cost = normalizeShopItemCost(costRecord)
      if (cost != null) {
        costs.push(cost)
      }
    }

    items.push({
      id,
      shopId: normalizeCatalogNumber(record.shopId) ?? 0,
      seq: normalizeCatalogNumber(record.seq) ?? 0,
      resourceBoxId: normalizeCatalogNumber(record.resourceBoxId) ?? 0,
      startAt: normalizeCatalogNumber(record.startAt) ?? 0,
      costs,
    })
  }

  return items
}

/**
 * Keeps only `resourceBoxPurpose == "shop_item"` rows granting an
 * `area_item` (Go reads resourceBoxes by purpose then filters details the
 * same way).
 */
export function normalizeAreaShopResourceBoxDetails(raw: unknown): AreaShopResourceBoxDetail[] {
  const details: AreaShopResourceBoxDetail[] = []
  for (const record of normalizeCatalogRecords(raw)) {
    if (normalizeCatalogString(record.resourceBoxPurpose).toLowerCase() !== "shop_item") {
      continue
    }
    if (normalizeCatalogString(record.resourceType).toLowerCase() !== "area_item") {
      continue
    }

    const resourceBoxId = normalizeCatalogNumber(record.resourceBoxId)
    const areaItemId = normalizeCatalogNumber(record.resourceId)
    const level = normalizeCatalogNumber(record.resourceLevel)
    if (resourceBoxId == null || resourceBoxId <= 0 || areaItemId == null || areaItemId <= 0 || level == null || level <= 0) {
      continue
    }

    details.push({ resourceBoxId, areaItemId, level })
  }

  return details
}

/** Go: collectUserAreaItemLevels — max level per area item over all areas. */
export function collectUserAreaItemLevels(rawUserAreas: unknown): Map<number, number> {
  const levels = new Map<number, number>()
  for (const area of normalizeCatalogRecords(rawUserAreas)) {
    for (const item of normalizeCatalogRecords(area.areaItems)) {
      const areaItemId = normalizeCatalogNumber(item.areaItemId)
      const level = normalizeCatalogNumber(item.level)
      if (areaItemId == null || areaItemId <= 0 || level == null) {
        continue
      }
      if (level > (levels.get(areaItemId) ?? 0)) {
        levels.set(areaItemId, level)
      }
    }
  }

  return levels
}

/** Material quantities keyed by material id, with coin under {@link AREA_COIN_MATERIAL_ID}. */
export function collectUserMaterials(rawUserMaterials: unknown, rawUserGamedata: unknown): Map<number, number> {
  const materials = new Map<number, number>()
  if (rawUserGamedata != null && typeof rawUserGamedata === "object" && !Array.isArray(rawUserGamedata)) {
    const coin = normalizeCatalogNumber((rawUserGamedata as Record<string, unknown>).coin)
    materials.set(AREA_COIN_MATERIAL_ID, coin ?? 0)
  } else {
    materials.set(AREA_COIN_MATERIAL_ID, 0)
  }

  for (const record of normalizeCatalogRecords(rawUserMaterials)) {
    const materialId = normalizeCatalogNumber(record.materialId)
    if (materialId == null || materialId <= 0) {
      continue
    }
    materials.set(materialId, normalizeCatalogNumber(record.quantity) ?? 0)
  }

  return materials
}

export type AreaItemFilter = {
  unit?: string
  attr?: string
  characterId?: number
  tree?: boolean
  flower?: boolean
}

/** Go: hasAreaItemFilter. */
export function hasAreaItemFilter(filter: AreaItemFilter | null | undefined): boolean {
  if (filter == null) {
    return false
  }

  return normalizeAreaUnit(filter.unit) !== ""
    || normalizeAreaAttr(filter.attr) !== ""
    || (filter.characterId ?? 0) > 0
    || filter.tree === true
    || filter.flower === true
}

/** Go: areaItemMatchesFilter — exact port including VS-item exclusion. */
export function areaItemMatchesFilter(
  item: AreaItemMaster,
  levels: readonly AreaItemLevelMaster[],
  filter: AreaItemFilter,
): boolean {
  let filterUnit = normalizeAreaUnit(filter.unit)
  const filterAttr = normalizeAreaAttr(filter.attr)
  const filterPiapro = filterUnit === "piapro"
  if (filterPiapro) {
    filterUnit = ""
  }
  const filterCid = filter.characterId ?? 0

  let matched = false
  let isVSItem = false

  for (const level of levels) {
    if (normalizeAreaUnit(level.targetUnit) === "piapro") {
      isVSItem = true
      if (filterPiapro) {
        matched = true
      }
    }

    if (level.targetGameCharacterId > 0) {
      if (PIAPRO_CHARACTER_IDS.has(level.targetGameCharacterId)) {
        isVSItem = true
        if (filterPiapro) {
          matched = true
        }
      }
      if (filterCid > 0 && level.targetGameCharacterId === filterCid) {
        matched = true
      }
    }

    if (filterAttr !== "" && normalizeAreaAttr(level.targetCardAttr) === filterAttr) {
      matched = true
    }
  }

  if (filter.tree === true && item.areaId === AREA_TREE_AREA_ID) {
    matched = true
  }
  if (filter.flower === true && item.areaId === AREA_FLOWER_AREA_ID) {
    matched = true
  }
  if (filterUnit !== "") {
    const areaId = AREA_FILTER_UNIT_AREA_IDS[filterUnit]
    if (areaId != null && item.areaId === areaId && !isVSItem) {
      matched = true
    }
  }

  return matched
}

/** Go: sortedAreaItemLevels — unique positive level numbers ascending. */
export function sortedAreaItemLevelNumbers(levels: readonly AreaItemLevelMaster[]): number[] {
  const seen = new Set<number>()
  for (const level of levels) {
    if (level.level > 0) {
      seen.add(level.level)
    }
  }

  return [...seen].sort((a, b) => a - b)
}

/**
 * Go: resolveAreaItemShopItems + fillAreaItemShopItemsByShopSequence.
 * Returns areaItemId -> level -> shop item.
 */
export function buildAreaItemShopItems(args: {
  itemIds: readonly number[]
  areaItemById: Map<number, AreaItemMaster>
  levelsByItem: Map<number, AreaItemLevelMaster[]>
  shopItems: readonly AreaShopItem[]
  shopDetails: readonly AreaShopResourceBoxDetail[]
  nowMs: number
}): Map<number, Map<number, AreaShopItem>> {
  const { itemIds, areaItemById, levelsByItem, shopItems, shopDetails } = args
  const nowMs = args.nowMs > 0 ? args.nowMs : Date.now()

  const itemSet = new Set(itemIds)
  const shopItemByBoxId = new Map<number, AreaShopItem>()
  for (const shopItem of shopItems) {
    if (shopItem.resourceBoxId > 0) {
      shopItemByBoxId.set(shopItem.resourceBoxId, shopItem)
    }
  }

  const result = new Map<number, Map<number, AreaShopItem>>()
  for (const detail of shopDetails) {
    if (!itemSet.has(detail.areaItemId)) {
      continue
    }

    const shopItem = shopItemByBoxId.get(detail.resourceBoxId)
    if (shopItem == null) {
      continue
    }
    if (shopItem.startAt > 0 && shopItem.startAt > nowMs) {
      continue
    }

    let levelMap = result.get(detail.areaItemId)
    if (levelMap == null) {
      levelMap = new Map()
      result.set(detail.areaItemId, levelMap)
    }
    if (!levelMap.has(detail.level)) {
      levelMap.set(detail.level, shopItem)
    }
  }

  fillAreaItemShopItemsByShopSequence({ itemIds, areaItemById, levelsByItem, shopItems, result, nowMs })
  return result
}

/**
 * Go: fillAreaItemShopItemsByShopSequence — evenly distributes seq-ordered
 * shop items of the area's hardcoded shop across its items' levels to fill
 * mapping gaps.
 */
export function fillAreaItemShopItemsByShopSequence(args: {
  itemIds: readonly number[]
  areaItemById: Map<number, AreaItemMaster>
  levelsByItem: Map<number, AreaItemLevelMaster[]>
  shopItems: readonly AreaShopItem[]
  result: Map<number, Map<number, AreaShopItem>>
  nowMs: number
}): void {
  const { itemIds, areaItemById, levelsByItem, shopItems, result, nowMs } = args
  if (itemIds.length === 0) {
    return
  }

  type ShopTarget = { itemId: number; sortedLevels: number[] }
  const targetsByShopId = new Map<number, ShopTarget[]>()
  for (const itemId of itemIds) {
    const item = areaItemById.get(itemId)
    if (item == null) {
      continue
    }

    const shopId = AREA_ITEM_SHOP_ID_BY_AREA_ID[item.areaId] ?? 0
    if (shopId <= 0) {
      continue
    }

    const sortedLevels = sortedAreaItemLevelNumbers(levelsByItem.get(itemId) ?? [])
    if (sortedLevels.length === 0) {
      continue
    }

    const targets = targetsByShopId.get(shopId) ?? []
    targets.push({ itemId, sortedLevels })
    targetsByShopId.set(shopId, targets)
  }
  if (targetsByShopId.size === 0) {
    return
  }

  const shopItemsByShopId = new Map<number, AreaShopItem[]>()
  for (const shopItem of shopItems) {
    if (shopItem.shopId <= 0) {
      continue
    }
    if (shopItem.startAt > 0 && shopItem.startAt > nowMs) {
      continue
    }
    const group = shopItemsByShopId.get(shopItem.shopId) ?? []
    group.push(shopItem)
    shopItemsByShopId.set(shopItem.shopId, group)
  }
  if (shopItemsByShopId.size === 0) {
    return
  }

  for (const [shopId, targets] of targetsByShopId) {
    const group = shopItemsByShopId.get(shopId) ?? []
    if (group.length === 0 || targets.length === 0) {
      continue
    }
    if (group.length < targets.length || group.length % targets.length !== 0) {
      continue
    }

    targets.sort((a, b) => a.itemId - b.itemId)
    const orderedShopItems = [...group].sort((a, b) => (a.seq !== b.seq ? a.seq - b.seq : a.id - b.id))

    const blockSize = orderedShopItems.length / targets.length
    let offset = 0
    for (const target of targets) {
      let levelMap = result.get(target.itemId)
      if (levelMap == null) {
        levelMap = new Map()
        result.set(target.itemId, levelMap)
      }

      const levelsToMap = Math.min(blockSize, target.sortedLevels.length)
      for (let idx = 0; idx < levelsToMap; idx++) {
        const level = target.sortedLevels[idx]
        if (!levelMap.has(level)) {
          levelMap.set(level, orderedShopItems[offset + idx])
        }
      }
      offset += blockSize
    }
  }
}

/** Go: releasedAreaItemLevelCap — highest contiguous level from 1 with masterdata and a shop item. */
export function releasedAreaItemLevelCap(
  levels: readonly AreaItemLevelMaster[],
  shopLevels: Map<number, AreaShopItem> | undefined,
): number {
  if (levels.length === 0 || shopLevels == null || shopLevels.size === 0) {
    return 0
  }

  const levelSet = new Set<number>()
  for (const level of levels) {
    if (level.level > 0) {
      levelSet.add(level.level)
    }
  }
  if (!levelSet.has(1)) {
    return 0
  }

  let releasedMaxLevel = 1
  for (let level = 2; ; level++) {
    if (!levelSet.has(level)) {
      break
    }
    if (shopLevels.get(level) == null) {
      break
    }
    releasedMaxLevel = level
  }

  return releasedMaxLevel
}

export type AreaItemTarget =
  | { type: "character"; characterId: number }
  | { type: "unit"; unit: string }
  | { type: "attr"; attr: string }

/** Go: areaItemTargetIcon — first target found across the item's levels. */
export function resolveAreaItemTarget(levels: readonly AreaItemLevelMaster[]): AreaItemTarget | null {
  for (const level of levels) {
    if (level.targetGameCharacterId > 0) {
      return { type: "character", characterId: level.targetGameCharacterId }
    }
    const unit = normalizeAreaUnit(level.targetUnit)
    if (unit !== "") {
      return { type: "unit", unit }
    }
    const attr = normalizeAreaAttr(level.targetCardAttr)
    if (attr !== "") {
      return { type: "attr", attr }
    }
  }

  return null
}

export type AreaItemMaterialView = {
  materialId: number
  resourceType: string
  quantity: number
  haveQuantity: number
  sumQuantity: number
  isEnough: boolean
}

export type AreaItemLevelView = {
  level: number
  bonus: number
  canUpgrade: boolean
  materials: AreaItemMaterialView[]
}

export type AreaItemView = {
  itemId: number
  areaId: number
  name: string
  assetbundleName: string
  currentLevel: number
  maxVisibleLevel: number
  target: AreaItemTarget | null
  levels: AreaItemLevelView[]
}

/**
 * Go: buildAreaItemUpgradeMaterialsRequest (snapshot mode, hasProfile=true).
 * Without a filter the candidate set is the owned items; with a filter the
 * whole matched catalog is shown (unowned items render from level 0).
 */
export function buildAreaItemViews(args: {
  areaItems: readonly AreaItemMaster[]
  areaItemLevels: readonly AreaItemLevelMaster[]
  shopItems: readonly AreaShopItem[]
  shopDetails: readonly AreaShopResourceBoxDetail[]
  userAreaLevels: Map<number, number>
  userMaterials: Map<number, number>
  filter?: AreaItemFilter | null
  nowMs?: number
}): AreaItemView[] {
  const nowMs = args.nowMs != null && args.nowMs > 0 ? args.nowMs : Date.now()

  const areaItemById = new Map<number, AreaItemMaster>()
  for (const item of args.areaItems) {
    areaItemById.set(item.id, item)
  }

  const levelsByItem = new Map<number, AreaItemLevelMaster[]>()
  for (const level of args.areaItemLevels) {
    const levels = levelsByItem.get(level.areaItemId) ?? []
    levels.push(level)
    levelsByItem.set(level.areaItemId, levels)
  }

  // Go: resolveAreaItemIDs.
  const filter = args.filter ?? null
  let itemIds: number[]
  if (!hasAreaItemFilter(filter)) {
    itemIds = [...args.userAreaLevels.keys()]
      .filter((itemId) => (levelsByItem.get(itemId)?.length ?? 0) > 0)
      .sort((a, b) => a - b)
  } else {
    itemIds = args.areaItems
      .filter((item) => {
        const levels = levelsByItem.get(item.id) ?? []
        return levels.length > 0 && areaItemMatchesFilter(item, levels, filter as AreaItemFilter)
      })
      .map((item) => item.id)
      .sort((a, b) => a - b)
  }
  if (itemIds.length === 0) {
    return []
  }

  const levelShopItems = buildAreaItemShopItems({
    itemIds,
    areaItemById,
    levelsByItem,
    shopItems: args.shopItems,
    shopDetails: args.shopDetails,
    nowMs,
  })

  type AreaItemRenderState = {
    item: AreaItemMaster
    levels: AreaItemLevelMaster[]
    levelMap: Map<number, AreaItemLevelMaster>
    shopLevels: Map<number, AreaShopItem> | undefined
    currentLevel: number
    maxVisibleLevel: number
  }

  const states: AreaItemRenderState[] = []
  let minCurrentLevel = -1
  for (const itemId of itemIds) {
    const item = areaItemById.get(itemId)
    const levels = levelsByItem.get(itemId) ?? []
    if (item == null || levels.length === 0) {
      continue
    }

    const levelMap = new Map<number, AreaItemLevelMaster>()
    for (const level of levels) {
      levelMap.set(level.level, level)
    }

    const shopLevels = levelShopItems.get(itemId)
    const releasedCap = releasedAreaItemLevelCap(levels, shopLevels)

    let currentLevel = args.userAreaLevels.get(itemId) ?? 0
    if (releasedCap > 0 && currentLevel > releasedCap) {
      currentLevel = releasedCap
    }
    let maxVisibleLevel = currentLevel
    if (releasedCap > maxVisibleLevel) {
      maxVisibleLevel = releasedCap
    }
    if (maxVisibleLevel <= 0) {
      continue
    }
    if (minCurrentLevel === -1 || currentLevel < minCurrentLevel) {
      minCurrentLevel = currentLevel
    }

    states.push({ item, levels, levelMap, shopLevels, currentLevel, maxVisibleLevel })
  }
  if (minCurrentLevel < 0) {
    minCurrentLevel = 0
  }

  const views: AreaItemView[] = []
  for (const state of states) {
    const sumMaterials = new Map<number, number>()
    const levelViews: AreaItemLevelView[] = []
    for (let level = minCurrentLevel + 1; level <= state.maxVisibleLevel; level++) {
      const levelMaster = state.levelMap.get(level)
      if (levelMaster == null) {
        levelViews.push({ level, bonus: 0, canUpgrade: false, materials: [] })
        continue
      }

      const row: AreaItemLevelView = {
        level,
        bonus: levelMaster.power1BonusRate,
        canUpgrade: true,
        materials: [],
      }

      if (level > state.currentLevel) {
        const shopItem = state.shopLevels?.get(level)
        if (shopItem == null) {
          row.canUpgrade = false
        } else {
          for (const cost of shopItem.costs) {
            const resourceType = cost.resourceType.trim().toLowerCase()
            const materialId = resourceType === "coin" ? AREA_COIN_MATERIAL_ID : cost.resourceId
            const sumQuantity = (sumMaterials.get(materialId) ?? 0) + cost.quantity
            sumMaterials.set(materialId, sumQuantity)
            const haveQuantity = args.userMaterials.get(materialId) ?? 0
            const isEnough = haveQuantity >= sumQuantity
            if (!isEnough) {
              row.canUpgrade = false
            }
            row.materials.push({
              materialId,
              resourceType,
              quantity: cost.quantity,
              haveQuantity,
              sumQuantity,
              isEnough,
            })
          }
        }
      }

      levelViews.push(row)
    }

    views.push({
      itemId: state.item.id,
      areaId: state.item.areaId,
      name: state.item.name,
      assetbundleName: state.item.assetbundleName,
      currentLevel: state.currentLevel,
      maxVisibleLevel: state.maxVisibleLevel,
      target: resolveAreaItemTarget(state.levels),
      levels: levelViews,
    })
  }

  return views
}

/** Relative game asset path for an area item's icon. */
export function areaItemIconAssetPath(assetbundleName: string): string {
  const name = assetbundleName.trim()
  return `startapp/areaitem/${name}/${name}.png`
}

/**
 * Go: materialIconPath. Note the deviation: Go hardcodes the jp asset tree
 * for material thumbnails; the SPA resolves the path against the selected
 * account's region instead.
 */
export function materialIconAssetPath(resourceType: string, materialId: number): string | null {
  let type = resourceType.trim().toLowerCase()
  if (type === "paid_jewel") {
    type = "jewel"
  }
  switch (type) {
    case "coin":
    case "virtual_coin":
    case "jewel":
      return `startapp/thumbnail/common_material/${type}.png`
    case "material":
      if (materialId <= 0) {
        return null
      }
      return `startapp/thumbnail/material/material${materialId}.png`
    default:
      return null
  }
}
