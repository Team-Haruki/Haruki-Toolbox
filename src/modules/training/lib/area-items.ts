import {
  appendCatalogRecords,
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"
import { formatCompactNumber } from "@/lib/number-format"

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
 * same way). Region dumps differ: jp/en nest the detail rows inside
 * `resourceBoxes.json` (`details` arrays), while tw/kr/cn keep the boxes
 * flat and ship the rows in a separate `resourceBoxDetails.json` — so both
 * sources are merged here. Flat box rows carry no `resourceType` and fall
 * out of the filter, which keeps the merge duplicate-free.
 */
export function normalizeAreaShopResourceBoxDetails(rawBoxes: unknown, rawDetails?: unknown): AreaShopResourceBoxDetail[] {
  const rows: Record<string, unknown>[] = []
  for (const record of normalizeCatalogRecords(rawBoxes)) {
    if (Array.isArray(record.details)) {
      appendCatalogRecords(rows, record.details)
    } else {
      rows.push(record)
    }
  }
  appendCatalogRecords(rows, rawDetails)

  const details: AreaShopResourceBoxDetail[] = []
  for (const record of rows) {
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

/**
 * Master bonus rates carry float32 noise (e.g. `0.20000000298023224` for VS
 * items); round to one decimal for display and trim a trailing `.0`.
 */
export function formatAreaBonusRate(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

/** Compact material quantities; see the shared {@link formatCompactNumber}. */
export function formatCompactQuantity(value: number, locale: string): string {
  return formatCompactNumber(value, locale)
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
function isVirtualSingerAreaLevel(level: AreaItemLevelMaster): boolean {
  return normalizeAreaUnit(level.targetUnit) === "piapro"
    || PIAPRO_CHARACTER_IDS.has(level.targetGameCharacterId)
}

function areaLevelMatchesFilter(
  level: AreaItemLevelMaster,
  filterPiapro: boolean,
  filterCharacterId: number,
  filterAttr: string,
): boolean {
  if (filterPiapro && isVirtualSingerAreaLevel(level)) {
    return true
  }
  if (filterCharacterId > 0 && level.targetGameCharacterId === filterCharacterId) {
    return true
  }
  return filterAttr !== "" && normalizeAreaAttr(level.targetCardAttr) === filterAttr
}

function matchesSpecialArea(item: AreaItemMaster, filter: AreaItemFilter): boolean {
  return (filter.tree === true && item.areaId === AREA_TREE_AREA_ID)
    || (filter.flower === true && item.areaId === AREA_FLOWER_AREA_ID)
}

function matchesUnitArea(item: AreaItemMaster, filterUnit: string, isVSItem: boolean): boolean {
  if (filterUnit === "" || isVSItem) {
    return false
  }
  const areaId = AREA_FILTER_UNIT_AREA_IDS[filterUnit]
  return areaId != null && item.areaId === areaId
}

export function areaItemMatchesFilter(
  item: AreaItemMaster,
  levels: readonly AreaItemLevelMaster[],
  filter: AreaItemFilter,
): boolean {
  const normalizedUnit = normalizeAreaUnit(filter.unit)
  const filterAttr = normalizeAreaAttr(filter.attr)
  const filterPiapro = normalizedUnit === "piapro"
  const filterUnit = filterPiapro ? "" : normalizedUnit
  const filterCid = filter.characterId ?? 0
  const matchesLevel = levels.some((level) => areaLevelMatchesFilter(level, filterPiapro, filterCid, filterAttr))
  const isVSItem = levels.some(isVirtualSingerAreaLevel)
  return matchesLevel || matchesSpecialArea(item, filter) || matchesUnitArea(item, filterUnit, isVSItem)
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

function indexAreaShopItemsByBox(shopItems: readonly AreaShopItem[]): Map<number, AreaShopItem> {
  const byBoxId = new Map<number, AreaShopItem>()
  for (const shopItem of shopItems) {
    if (shopItem.resourceBoxId > 0) {
      byBoxId.set(shopItem.resourceBoxId, shopItem)
    }
  }
  return byBoxId
}

function mapAreaShopDetails(
  itemIds: readonly number[],
  shopDetails: readonly AreaShopResourceBoxDetail[],
  shopItemByBoxId: ReadonlyMap<number, AreaShopItem>,
  nowMs: number,
): Map<number, Map<number, AreaShopItem>> {
  const itemSet = new Set(itemIds)
  const result = new Map<number, Map<number, AreaShopItem>>()
  for (const detail of shopDetails) {
    const shopItem = shopItemByBoxId.get(detail.resourceBoxId)
    if (!itemSet.has(detail.areaItemId) || !shopItem || (shopItem.startAt > 0 && shopItem.startAt > nowMs)) {
      continue
    }
    const levelMap = result.get(detail.areaItemId) ?? new Map<number, AreaShopItem>()
    if (!levelMap.has(detail.level)) {
      levelMap.set(detail.level, shopItem)
    }
    result.set(detail.areaItemId, levelMap)
  }
  return result
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
  const shopItemByBoxId = indexAreaShopItemsByBox(shopItems)
  const result = mapAreaShopDetails(itemIds, shopDetails, shopItemByBoxId, nowMs)

  fillAreaItemShopItemsByShopSequence({ itemIds, areaItemById, levelsByItem, shopItems, result, nowMs })
  return result
}

type ShopTarget = { itemId: number; sortedLevels: number[] }

function groupAreaTargetsByShop(args: {
  itemIds: readonly number[]
  areaItemById: Map<number, AreaItemMaster>
  levelsByItem: Map<number, AreaItemLevelMaster[]>
}): Map<number, ShopTarget[]> {
  const targetsByShopId = new Map<number, ShopTarget[]>()
  for (const itemId of args.itemIds) {
    const item = args.areaItemById.get(itemId)
    const shopId = item ? AREA_ITEM_SHOP_ID_BY_AREA_ID[item.areaId] ?? 0 : 0
    const sortedLevels = sortedAreaItemLevelNumbers(args.levelsByItem.get(itemId) ?? [])
    if (shopId <= 0 || sortedLevels.length === 0) {
      continue
    }
    const targets = targetsByShopId.get(shopId) ?? []
    targets.push({ itemId, sortedLevels })
    targetsByShopId.set(shopId, targets)
  }
  return targetsByShopId
}

function groupAvailableShopItems(
  shopItems: readonly AreaShopItem[],
  nowMs: number,
): Map<number, AreaShopItem[]> {
  const shopItemsByShopId = new Map<number, AreaShopItem[]>()
  for (const shopItem of shopItems) {
    if (shopItem.shopId <= 0 || (shopItem.startAt > 0 && shopItem.startAt > nowMs)) {
      continue
    }
    const group = shopItemsByShopId.get(shopItem.shopId) ?? []
    group.push(shopItem)
    shopItemsByShopId.set(shopItem.shopId, group)
  }
  return shopItemsByShopId
}

function fillShopTargetGroup(
  targets: ShopTarget[],
  group: readonly AreaShopItem[],
  result: Map<number, Map<number, AreaShopItem>>,
) {
  if (group.length === 0 || targets.length === 0 || group.length < targets.length || group.length % targets.length !== 0) {
    return
  }
  targets.sort((a, b) => a.itemId - b.itemId)
  const orderedShopItems = [...group].sort((a, b) => (a.seq !== b.seq ? a.seq - b.seq : a.id - b.id))
  const blockSize = orderedShopItems.length / targets.length
  targets.forEach((target, targetIndex) => {
    const levelMap = result.get(target.itemId) ?? new Map<number, AreaShopItem>()
    const levelsToMap = Math.min(blockSize, target.sortedLevels.length)
    for (let index = 0; index < levelsToMap; index++) {
      const level = target.sortedLevels[index]
      if (!levelMap.has(level)) {
        levelMap.set(level, orderedShopItems[(targetIndex * blockSize) + index])
      }
    }
    result.set(target.itemId, levelMap)
  })
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

  const targetsByShopId = groupAreaTargetsByShop({ itemIds, areaItemById, levelsByItem })
  if (targetsByShopId.size === 0) {
    return
  }
  const shopItemsByShopId = groupAvailableShopItems(shopItems, nowMs)
  if (shopItemsByShopId.size === 0) {
    return
  }
  for (const [shopId, targets] of targetsByShopId) {
    fillShopTargetGroup(targets, shopItemsByShopId.get(shopId) ?? [], result)
  }
}

/**
 * Highest contiguous level from 1 with masterdata, ignoring shop
 * availability. Fallback cap for dumps without resource box data (currently
 * cn), where no shop mapping can be built at all.
 */
export function masterAreaItemLevelCap(levels: readonly AreaItemLevelMaster[]): number {
  const levelSet = new Set<number>()
  for (const level of levels) {
    if (level.level > 0) {
      levelSet.add(level.level)
    }
  }
  if (!levelSet.has(1)) {
    return 0
  }

  let cap = 1
  while (levelSet.has(cap + 1)) {
    cap++
  }

  return cap
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
  /** Bonus rate at the current level; 0 when the item is not owned yet. */
  currentBonus: number
  maxVisibleLevel: number
  target: AreaItemTarget | null
  levels: AreaItemLevelView[]
}

type BuildAreaItemViewsArgs = {
  areaItems: readonly AreaItemMaster[]
  areaItemLevels: readonly AreaItemLevelMaster[]
  shopItems: readonly AreaShopItem[]
  shopDetails: readonly AreaShopResourceBoxDetail[]
  userAreaLevels: Map<number, number>
  userMaterials: Map<number, number>
  filter?: AreaItemFilter | null
  nowMs?: number
}

type AreaItemRenderState = {
  item: AreaItemMaster
  levels: AreaItemLevelMaster[]
  levelMap: Map<number, AreaItemLevelMaster>
  shopLevels: Map<number, AreaShopItem> | undefined
  currentLevel: number
  maxVisibleLevel: number
}

function indexAreaItemMasters(areaItems: readonly AreaItemMaster[]): Map<number, AreaItemMaster> {
  return new Map(areaItems.map((item) => [item.id, item]))
}

function groupAreaItemLevels(
  areaItemLevels: readonly AreaItemLevelMaster[],
): Map<number, AreaItemLevelMaster[]> {
  const levelsByItem = new Map<number, AreaItemLevelMaster[]>()
  for (const level of areaItemLevels) {
    const levels = levelsByItem.get(level.areaItemId) ?? []
    levels.push(level)
    levelsByItem.set(level.areaItemId, levels)
  }
  return levelsByItem
}

function resolveAreaItemIds(
  args: BuildAreaItemViewsArgs,
  levelsByItem: ReadonlyMap<number, AreaItemLevelMaster[]>,
): number[] {
  const filter = args.filter ?? null
  if (!hasAreaItemFilter(filter)) {
    return [...args.userAreaLevels.keys()]
      .filter((itemId) => (levelsByItem.get(itemId)?.length ?? 0) > 0)
      .sort((a, b) => a - b)
  }
  return args.areaItems
    .filter((item) => {
      const levels = levelsByItem.get(item.id) ?? []
      return levels.length > 0 && areaItemMatchesFilter(item, levels, filter as AreaItemFilter)
    })
    .map((item) => item.id)
    .sort((a, b) => a - b)
}

function buildAreaItemRenderStates(args: {
  itemIds: readonly number[]
  areaItemById: ReadonlyMap<number, AreaItemMaster>
  levelsByItem: ReadonlyMap<number, AreaItemLevelMaster[]>
  levelShopItems: ReadonlyMap<number, Map<number, AreaShopItem>>
  userAreaLevels: ReadonlyMap<number, number>
}): { states: AreaItemRenderState[]; minCurrentLevel: number } {
  const shopDataAvailable = [...args.levelShopItems.values()].some((map) => map.size > 0)
  const states: AreaItemRenderState[] = []
  let minCurrentLevel = -1
  for (const itemId of args.itemIds) {
    const item = args.areaItemById.get(itemId)
    const levels = args.levelsByItem.get(itemId) ?? []
    if (!item || levels.length === 0) {
      continue
    }
    const levelMap = new Map(levels.map((level) => [level.level, level]))
    const shopLevels = args.levelShopItems.get(itemId)
    const releasedCap = shopDataAvailable
      ? releasedAreaItemLevelCap(levels, shopLevels)
      : masterAreaItemLevelCap(levels)
    const ownedLevel = args.userAreaLevels.get(itemId) ?? 0
    const currentLevel = releasedCap > 0 ? Math.min(ownedLevel, releasedCap) : ownedLevel
    const maxVisibleLevel = Math.max(currentLevel, releasedCap)
    if (maxVisibleLevel <= 0) {
      continue
    }
    minCurrentLevel = minCurrentLevel < 0 ? currentLevel : Math.min(minCurrentLevel, currentLevel)
    states.push({ item, levels, levelMap, shopLevels, currentLevel, maxVisibleLevel })
  }
  return { states, minCurrentLevel: Math.max(minCurrentLevel, 0) }
}

function buildAreaItemMaterialViews(
  shopItem: AreaShopItem,
  sumMaterials: Map<number, number>,
  userMaterials: ReadonlyMap<number, number>,
): AreaItemMaterialView[] {
  return shopItem.costs.map((cost) => {
    const resourceType = cost.resourceType.trim().toLowerCase()
    const materialId = resourceType === "coin" ? AREA_COIN_MATERIAL_ID : cost.resourceId
    const sumQuantity = (sumMaterials.get(materialId) ?? 0) + cost.quantity
    sumMaterials.set(materialId, sumQuantity)
    const haveQuantity = userMaterials.get(materialId) ?? 0
    return {
      materialId,
      resourceType,
      quantity: cost.quantity,
      haveQuantity,
      sumQuantity,
      isEnough: haveQuantity >= sumQuantity,
    }
  })
}

function buildAreaItemLevelViews(
  state: AreaItemRenderState,
  minCurrentLevel: number,
  userMaterials: ReadonlyMap<number, number>,
): AreaItemLevelView[] {
  const sumMaterials = new Map<number, number>()
  const levelViews: AreaItemLevelView[] = []
  for (let level = minCurrentLevel + 1; level <= state.maxVisibleLevel; level++) {
    const levelMaster = state.levelMap.get(level)
    if (!levelMaster) {
      levelViews.push({ level, bonus: 0, canUpgrade: false, materials: [] })
      continue
    }
    const shopItem = level > state.currentLevel ? state.shopLevels?.get(level) : null
    const materials = shopItem ? buildAreaItemMaterialViews(shopItem, sumMaterials, userMaterials) : []
    levelViews.push({
      level,
      bonus: levelMaster.power1BonusRate,
      canUpgrade: level <= state.currentLevel || (shopItem != null && materials.every((material) => material.isEnough)),
      materials,
    })
  }
  return levelViews
}

function buildAreaItemView(
  state: AreaItemRenderState,
  minCurrentLevel: number,
  userMaterials: ReadonlyMap<number, number>,
): AreaItemView {
  return {
    itemId: state.item.id,
    areaId: state.item.areaId,
    name: state.item.name,
    assetbundleName: state.item.assetbundleName,
    currentLevel: state.currentLevel,
    currentBonus: state.levelMap.get(state.currentLevel)?.power1BonusRate ?? 0,
    maxVisibleLevel: state.maxVisibleLevel,
    target: resolveAreaItemTarget(state.levels),
    levels: buildAreaItemLevelViews(state, minCurrentLevel, userMaterials),
  }
}

/**
 * Go: buildAreaItemUpgradeMaterialsRequest (snapshot mode, hasProfile=true).
 * Without a filter the candidate set is the owned items; with a filter the
 * whole matched catalog is shown (unowned items render from level 0).
 */
export function buildAreaItemViews(args: BuildAreaItemViewsArgs): AreaItemView[] {
  const nowMs = args.nowMs != null && args.nowMs > 0 ? args.nowMs : Date.now()
  const areaItemById = indexAreaItemMasters(args.areaItems)
  const levelsByItem = groupAreaItemLevels(args.areaItemLevels)
  const itemIds = resolveAreaItemIds(args, levelsByItem)
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
  const { states, minCurrentLevel } = buildAreaItemRenderStates({
    itemIds,
    areaItemById,
    levelsByItem,
    levelShopItems,
    userAreaLevels: args.userAreaLevels,
  })
  return states.map((state) => buildAreaItemView(state, minCurrentLevel, args.userMaterials))
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
