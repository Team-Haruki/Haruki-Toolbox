import {
  appendCatalogRecords,
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"
import type { UserCharacterRank } from "./power-bonus"

/** Row from the `bonds` masterdata file. */
export type BondMaster = {
  groupId: number
  characterId1: number
  characterId2: number
}

/** Total-exp table for bond levels (rows of `levels` with levelType "bonds"). */
export type BondLevelTable = {
  totalExpByLevel: Map<number, number>
  maxLevel: number
}

/**
 * Character-style entry from `gameCharacterUnits`: maps a style/game id
 * (VS per-unit styles use ids above 26) to its base character and color.
 */
export type BondCharacterStyle = {
  characterId: number
  colorCode: string
}

/** Normalized entry from the suite `userBonds` list. */
export type UserBondState = {
  bondsGroupId: number
  rank: number
  exp: number
}

export type BondEntry = {
  groupId: number
  /** Raw pair ids from bond masterdata (may be style ids above 26). */
  charaId1: number
  charaId2: number
  /** Base character ids (style ids collapsed via `gameCharacterUnits`). */
  baseCharaId1: number
  baseCharaId2: number
  colorCode1: string | null
  colorCode2: string | null
  charaRank1: number
  charaRank2: number
  bondLevel: number
  exp: number
  hasBond: boolean
  /** Exp still needed for the next bond level; null at max/zero level. */
  needExp: number | null
  /** Total exp span of the current level; null at max/zero level. */
  levelExpSpan: number | null
}

export type BondEntriesResult = {
  entries: BondEntry[]
  maxLevel: number
}

/** Tolerantly parses the `bonds` masterdata list. */
export function normalizeBondMasters(raw: unknown): BondMaster[] {
  const masters: BondMaster[] = []
  for (const record of normalizeCatalogRecords(raw)) {
    const groupId = normalizeCatalogNumber(record.groupId)
    const characterId1 = normalizeCatalogNumber(record.characterId1)
    const characterId2 = normalizeCatalogNumber(record.characterId2)
    if (groupId == null || groupId <= 0 || characterId1 == null || characterId2 == null) {
      continue
    }

    masters.push({ groupId, characterId1, characterId2 })
  }

  return masters
}

/** Builds the bond-level total-exp table from the `levels` masterdata list. */
export function normalizeBondLevelTable(rawLevels: unknown): BondLevelTable {
  const totalExpByLevel = new Map<number, number>()
  let maxLevel = 0
  for (const record of normalizeCatalogRecords(rawLevels)) {
    if (normalizeCatalogString(record.levelType).toLowerCase() !== "bonds") {
      continue
    }
    const level = normalizeCatalogNumber(record.level)
    if (level == null || level <= 0) {
      continue
    }

    totalExpByLevel.set(level, normalizeCatalogNumber(record.totalExp) ?? 0)
    if (level > maxLevel) {
      maxLevel = level
    }
  }

  return { totalExpByLevel, maxLevel }
}

/** Builds the style map (`gameCharacterUnits` id → base character + color). */
export function buildBondCharacterStyleMap(rawGameCharacterUnits: unknown): Map<number, BondCharacterStyle> {
  const map = new Map<number, BondCharacterStyle>()
  for (const record of normalizeCatalogRecords(rawGameCharacterUnits)) {
    const id = normalizeCatalogNumber(record.id)
    if (id == null) {
      continue
    }

    map.set(id, {
      characterId: normalizeCatalogNumber(record.gameCharacterId) ?? 0,
      colorCode: normalizeCatalogString(record.colorCode),
    })
  }

  return map
}

/** Tolerantly parses the suite `userBonds` list. */
export function normalizeUserBonds(raw: unknown): UserBondState[] {
  const bonds: UserBondState[] = []
  for (const record of normalizeCatalogRecords(raw)) {
    const bondsGroupId = normalizeCatalogNumber(record.bondsGroupId)
    if (bondsGroupId == null) {
      continue
    }

    bonds.push({
      bondsGroupId,
      rank: normalizeCatalogNumber(record.rank) ?? 0,
      exp: normalizeCatalogNumber(record.exp) ?? 0,
    })
  }

  return bonds
}

/** Collapses a style id to its base character id (ports `resolveBondBaseCharacterID`). */
export function resolveBondBaseCharacterId(
  gameId: number,
  styleMap: ReadonlyMap<number, BondCharacterStyle>,
): number {
  const style = styleMap.get(gameId)
  return style != null && style.characterId > 0 ? style.characterId : gameId
}

export type BuildBondEntriesInput = {
  userBonds: readonly UserBondState[]
  bondMasters: readonly BondMaster[]
  levelTable: BondLevelTable
  styleMap: ReadonlyMap<number, BondCharacterStyle>
  userCharacters: readonly UserCharacterRank[]
  /**
   * When set, mirrors the Go `cid` mode: every masterdata pair involving the
   * character (owned or not), oriented with the character on the left and
   * deduplicated by partner keeping the highest bond.
   */
  filterCharacterId?: number | null
}

type SelectedBondPair = {
  groupId: number
  charaId1: number
  charaId2: number
  state: UserBondState | null
}

function indexUserBonds(bonds: readonly UserBondState[]): Map<number, UserBondState> {
  return new Map(bonds.map((bond) => [bond.bondsGroupId, bond]))
}

function selectFilteredBondPairs(
  input: BuildBondEntriesInput,
  filterCharacterId: number,
  userBondByGroupId: ReadonlyMap<number, UserBondState>,
): SelectedBondPair[] {
  const selected: SelectedBondPair[] = []
  for (const master of input.bondMasters) {
    const leftBaseId = resolveBondBaseCharacterId(master.characterId1, input.styleMap)
    const rightBaseId = resolveBondBaseCharacterId(master.characterId2, input.styleMap)
    if (leftBaseId !== filterCharacterId && rightBaseId !== filterCharacterId) {
      continue
    }
    const shouldSwap = leftBaseId !== filterCharacterId
    selected.push({
      groupId: master.groupId,
      charaId1: shouldSwap ? master.characterId2 : master.characterId1,
      charaId2: shouldSwap ? master.characterId1 : master.characterId2,
      state: userBondByGroupId.get(master.groupId) ?? null,
    })
  }
  return selected
}

function selectOwnedBondPairs(
  input: BuildBondEntriesInput,
  userBondByGroupId: ReadonlyMap<number, UserBondState>,
): SelectedBondPair[] {
  const masterByGroupId = new Map(input.bondMasters.map((master) => [master.groupId, master]))
  return [...userBondByGroupId.values()].flatMap((bond) => {
    const master = masterByGroupId.get(bond.bondsGroupId)
    return master
      ? [{
          groupId: master.groupId,
          charaId1: master.characterId1,
          charaId2: master.characterId2,
          state: bond,
        }]
      : []
  })
}

function resolveBondLevelProgress(
  rank: number,
  exp: number,
  levelTable: BondLevelTable,
): { needExp: number | null; levelExpSpan: number | null } {
  if (rank <= 0 || rank >= levelTable.maxLevel) {
    return { needExp: null, levelExpSpan: null }
  }
  const currentTotalExp = levelTable.totalExpByLevel.get(rank)
  const nextTotalExp = levelTable.totalExpByLevel.get(rank + 1)
  if (currentTotalExp == null || nextTotalExp == null) {
    return { needExp: null, levelExpSpan: null }
  }
  const levelExpSpan = nextTotalExp - currentTotalExp
  return { needExp: Math.max(levelExpSpan - exp, 0), levelExpSpan }
}

function buildBondEntry(
  pair: SelectedBondPair,
  input: BuildBondEntriesInput,
  charRankMap: ReadonlyMap<number, number>,
): BondEntry {
  const rank = pair.state?.rank ?? 0
  const exp = pair.state?.exp ?? 0
  const style1 = input.styleMap.get(pair.charaId1) ?? null
  const style2 = input.styleMap.get(pair.charaId2) ?? null
  const baseCharaId1 = resolveBondBaseCharacterId(pair.charaId1, input.styleMap)
  const baseCharaId2 = resolveBondBaseCharacterId(pair.charaId2, input.styleMap)
  const progress = resolveBondLevelProgress(rank, exp, input.levelTable)
  return {
    groupId: pair.groupId,
    charaId1: pair.charaId1,
    charaId2: pair.charaId2,
    baseCharaId1,
    baseCharaId2,
    colorCode1: style1?.colorCode || null,
    colorCode2: style2?.colorCode || null,
    charaRank1: charRankMap.get(baseCharaId1) ?? 0,
    charaRank2: charRankMap.get(baseCharaId2) ?? 0,
    bondLevel: rank,
    exp,
    hasBond: pair.state != null,
    ...progress,
  }
}

function isBetterFilteredBondEntry(current: BondEntry, candidate: BondEntry): boolean {
  if (candidate.bondLevel !== current.bondLevel) {
    return candidate.bondLevel > current.bondLevel
  }
  if (candidate.hasBond !== current.hasBond) {
    return candidate.hasBond
  }
  if (candidate.baseCharaId2 !== current.baseCharaId2) {
    return candidate.baseCharaId2 < current.baseCharaId2
  }
  return candidate.charaId2 < current.charaId2
}

function dedupeFilteredBondEntries(entries: readonly BondEntry[]): BondEntry[] {
  const byPartner = new Map<number, BondEntry>()
  for (const entry of entries) {
    const existing = byPartner.get(entry.baseCharaId2)
    if (!existing || isBetterFilteredBondEntry(existing, entry)) {
      byPartner.set(entry.baseCharaId2, entry)
    }
  }
  return [...byPartner.values()]
}

function compareFilteredBondEntries(a: BondEntry, b: BondEntry): number {
  if (a.bondLevel !== b.bondLevel) return b.bondLevel - a.bondLevel
  if (a.hasBond !== b.hasBond) return a.hasBond ? -1 : 1
  if (a.baseCharaId2 !== b.baseCharaId2) return a.baseCharaId2 - b.baseCharaId2
  if (a.charaId2 !== b.charaId2) return a.charaId2 - b.charaId2
  return a.charaId1 - b.charaId1
}

function compareOwnedBondEntries(a: BondEntry, b: BondEntry): number {
  if (a.bondLevel !== b.bondLevel) return b.bondLevel - a.bondLevel
  if (a.charaId1 !== b.charaId1) return a.charaId1 - b.charaId1
  return a.charaId2 - b.charaId2
}

/**
 * Ports `BuildBondsRequestFromSnapshot`. Intentional web deviations: no
 * 20-entry render cap and the character filter is a UI select instead of a
 * command argument.
 */
export function buildBondEntries(input: BuildBondEntriesInput): BondEntriesResult {
  const filterCid = input.filterCharacterId ?? 0
  const userBondByGroupId = indexUserBonds(input.userBonds)
  const selected = filterCid > 0
    ? selectFilteredBondPairs(input, filterCid, userBondByGroupId)
    : selectOwnedBondPairs(input, userBondByGroupId)
  const charRankMap = new Map(input.userCharacters.map((character) => [character.characterId, character.characterRank]))
  const builtEntries = selected.map((pair) => buildBondEntry(pair, input, charRankMap))
  const entries = filterCid > 0 ? dedupeFilteredBondEntries(builtEntries) : builtEntries
  entries.sort(filterCid > 0 ? compareFilteredBondEntries : compareOwnedBondEntries)
  const userMaxLevel = entries.reduce((maximum, entry) => Math.max(maximum, entry.bondLevel), 0)
  return { entries, maxLevel: input.levelTable.maxLevel || userMaxLevel }
}

/** One reward granted at a bond rank. */
export type BondRewardItem = {
  /** resourceType from the resource box, or "cut_in_voice" for voice rewards. */
  type: string
  resourceId: number | null
  quantity: number
  level: number | null
}

export type BondRankRewards = {
  rank: number
  items: BondRewardItem[]
}

function collectBondRewardDetails(
  rawResourceBoxes: unknown,
  rawResourceBoxDetails: unknown,
): Record<string, unknown>[] {
  const details: Record<string, unknown>[] = []
  for (const record of normalizeCatalogRecords(rawResourceBoxes)) {
    appendCatalogRecords(details, record.details)
  }
  appendCatalogRecords(details, rawResourceBoxDetails)
  return details
}

function normalizeBoxReward(
  record: Record<string, unknown>,
): { boxId: number; item: BondRewardItem } | null {
  if (normalizeCatalogString(record.resourceBoxPurpose) !== "bonds_reward") {
    return null
  }
  const boxId = normalizeCatalogNumber(record.resourceBoxId)
  const resourceType = normalizeCatalogString(record.resourceType)
  if (boxId == null || boxId <= 0 || resourceType === "") {
    return null
  }
  return {
    boxId,
    item: {
      type: resourceType,
      resourceId: normalizeCatalogNumber(record.resourceId),
      quantity: normalizeCatalogNumber(record.resourceQuantity) ?? 1,
      level: normalizeCatalogNumber(record.resourceLevel),
    },
  }
}

function buildBondRewardItemsByBox(
  rawResourceBoxes: unknown,
  rawResourceBoxDetails: unknown,
): Map<number, BondRewardItem[]> {
  const itemsByBox = new Map<number, BondRewardItem[]>()
  for (const record of collectBondRewardDetails(rawResourceBoxes, rawResourceBoxDetails)) {
    const reward = normalizeBoxReward(record)
    if (!reward) {
      continue
    }
    const items = itemsByBox.get(reward.boxId) ?? []
    items.push(reward.item)
    itemsByBox.set(reward.boxId, items)
  }
  return itemsByBox
}

function normalizeBondRewardRank(
  record: Record<string, unknown>,
): { groupId: number; rank: number } | null {
  const groupId = normalizeCatalogNumber(record.bondsGroupId)
  const rank = normalizeCatalogNumber(record.rank)
  if (groupId == null || groupId <= 0 || rank == null || rank <= 0) {
    return null
  }
  return { groupId, rank }
}

function resolveBondRewardItems(
  record: Record<string, unknown>,
  itemsByBox: ReadonlyMap<number, BondRewardItem[]>,
): BondRewardItem[] {
  if (normalizeCatalogString(record.bondsRewardType) === "cut_in_voice") {
    return [{ type: "cut_in_voice", resourceId: null, quantity: 1, level: null }]
  }
  const boxId = normalizeCatalogNumber(record.resourceBoxId)
  return boxId == null ? [] : [...(itemsByBox.get(boxId) ?? [])]
}

function buildBondRankItemsByGroup(
  rawBondsRewards: unknown,
  itemsByBox: ReadonlyMap<number, BondRewardItem[]>,
): Map<number, Map<number, BondRewardItem[]>> {
  const rankMapByGroup = new Map<number, Map<number, BondRewardItem[]>>()
  for (const record of normalizeCatalogRecords(rawBondsRewards)) {
    const rewardRank = normalizeBondRewardRank(record)
    if (!rewardRank) {
      continue
    }
    const rankMap = rankMapByGroup.get(rewardRank.groupId) ?? new Map<number, BondRewardItem[]>()
    const items = rankMap.get(rewardRank.rank) ?? []
    items.push(...resolveBondRewardItems(record, itemsByBox))
    rankMap.set(rewardRank.rank, items)
    rankMapByGroup.set(rewardRank.groupId, rankMap)
  }
  return rankMapByGroup
}

/**
 * bondsGroupId -> per-rank rewards, resolved through the `bonds_reward`
 * resource boxes. Accepts the nested `resourceBoxes` dump (jp/en) and merges
 * the flat `resourceBoxDetails` rows shipped by tw/kr/cn.
 */
export function buildBondsRewardsByGroup(
  rawBondsRewards: unknown,
  rawResourceBoxes: unknown,
  rawResourceBoxDetails?: unknown,
): Map<number, BondRankRewards[]> {
  const itemsByBox = buildBondRewardItemsByBox(rawResourceBoxes, rawResourceBoxDetails)
  const rankMapByGroup = buildBondRankItemsByGroup(rawBondsRewards, itemsByBox)

  const result = new Map<number, BondRankRewards[]>()
  for (const [groupId, rankMap] of rankMapByGroup) {
    const ranks = [...rankMap.entries()]
      .map(([rank, items]) => ({ rank, items }))
      .sort((a, b) => a.rank - b.rank)
    result.set(groupId, ranks)
  }

  return result
}

/** Progress toward the next bond level as a 0..100 percentage. */
export function bondLevelProgressPercent(entry: BondEntry): number | null {
  if (entry.levelExpSpan == null || entry.needExp == null || entry.levelExpSpan <= 0) {
    return null
  }

  const progress = ((entry.levelExpSpan - entry.needExp) / entry.levelExpSpan) * 100
  return Math.min(Math.max(progress, 0), 100)
}
