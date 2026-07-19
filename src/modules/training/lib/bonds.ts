import {
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

/**
 * Ports `BuildBondsRequestFromSnapshot`. Intentional web deviations: no
 * 20-entry render cap and the character filter is a UI select instead of a
 * command argument.
 */
export function buildBondEntries(input: BuildBondEntriesInput): BondEntriesResult {
  const { levelTable, styleMap } = input
  const filterCid = input.filterCharacterId ?? 0

  const userBondByGroupId = new Map<number, UserBondState>()
  for (const bond of input.userBonds) {
    userBondByGroupId.set(bond.bondsGroupId, bond)
  }

  const groupToPair = new Map<number, BondMaster>()
  for (const master of input.bondMasters) {
    groupToPair.set(master.groupId, master)
  }

  const charRankMap = new Map<number, number>()
  for (const character of input.userCharacters) {
    charRankMap.set(character.characterId, character.characterRank)
  }

  const resolveBase = (gameId: number): number => resolveBondBaseCharacterId(gameId, styleMap)

  type SelectedPair = {
    groupId: number
    charaId1: number
    charaId2: number
    state: UserBondState | null
  }

  const selected: SelectedPair[] = []
  if (filterCid > 0) {
    for (const master of input.bondMasters) {
      let charaId1 = master.characterId1
      let charaId2 = master.characterId2
      const leftBaseId = resolveBase(charaId1)
      const rightBaseId = resolveBase(charaId2)
      if (leftBaseId !== filterCid && rightBaseId !== filterCid) {
        continue
      }
      if (leftBaseId !== filterCid) {
        const swapped = charaId1
        charaId1 = charaId2
        charaId2 = swapped
      }
      selected.push({
        groupId: master.groupId,
        charaId1,
        charaId2,
        state: userBondByGroupId.get(master.groupId) ?? null,
      })
    }
  } else {
    for (const bond of input.userBonds) {
      const master = groupToPair.get(bond.bondsGroupId)
      if (master == null) {
        continue
      }
      selected.push({
        groupId: master.groupId,
        charaId1: master.characterId1,
        charaId2: master.characterId2,
        state: bond,
      })
    }
  }

  let entries: BondEntry[] = []
  let userMaxLevel = 0
  for (const pair of selected) {
    const rank = pair.state?.rank ?? 0
    const exp = pair.state?.exp ?? 0
    if (rank > userMaxLevel) {
      userMaxLevel = rank
    }

    let needExp: number | null = null
    let levelExpSpan: number | null = null
    if (rank > 0 && rank < levelTable.maxLevel) {
      const currentTotalExp = levelTable.totalExpByLevel.get(rank)
      const nextTotalExp = levelTable.totalExpByLevel.get(rank + 1)
      if (currentTotalExp != null && nextTotalExp != null) {
        levelExpSpan = nextTotalExp - currentTotalExp
        needExp = Math.max(levelExpSpan - exp, 0)
      }
    }

    const style1 = styleMap.get(pair.charaId1) ?? null
    const style2 = styleMap.get(pair.charaId2) ?? null
    entries.push({
      groupId: pair.groupId,
      charaId1: pair.charaId1,
      charaId2: pair.charaId2,
      baseCharaId1: resolveBase(pair.charaId1),
      baseCharaId2: resolveBase(pair.charaId2),
      colorCode1: style1 != null && style1.colorCode !== "" ? style1.colorCode : null,
      colorCode2: style2 != null && style2.colorCode !== "" ? style2.colorCode : null,
      charaRank1: charRankMap.get(resolveBase(pair.charaId1)) ?? 0,
      charaRank2: charRankMap.get(resolveBase(pair.charaId2)) ?? 0,
      bondLevel: rank,
      exp,
      hasBond: pair.state != null,
      needExp,
      levelExpSpan,
    })
  }

  if (filterCid > 0) {
    // Dedup by displayed partner (base char), keeping the better entry:
    // higher bond level, then owned, then lower base/raw partner id.
    const better = (current: BondEntry, candidate: BondEntry): boolean => {
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

    const deduped: BondEntry[] = []
    const indexByPartner = new Map<number, number>()
    for (const entry of entries) {
      const partner = entry.baseCharaId2
      const existingIndex = indexByPartner.get(partner)
      if (existingIndex != null) {
        const existing = deduped[existingIndex]
        if (existing != null && better(existing, entry)) {
          deduped[existingIndex] = entry
        }
        continue
      }
      indexByPartner.set(partner, deduped.length)
      deduped.push(entry)
    }
    entries = deduped
  }

  let maxLevel = levelTable.maxLevel
  if (maxLevel === 0) {
    maxLevel = userMaxLevel
  }

  entries.sort((a, b) => {
    if (filterCid > 0) {
      if (a.bondLevel !== b.bondLevel) {
        return b.bondLevel - a.bondLevel
      }
      if (a.hasBond !== b.hasBond) {
        return a.hasBond ? -1 : 1
      }
      if (a.baseCharaId2 !== b.baseCharaId2) {
        return a.baseCharaId2 - b.baseCharaId2
      }
      if (a.charaId2 !== b.charaId2) {
        return a.charaId2 - b.charaId2
      }
      return a.charaId1 - b.charaId1
    }
    if (a.bondLevel !== b.bondLevel) {
      return b.bondLevel - a.bondLevel
    }
    if (a.charaId1 !== b.charaId1) {
      return a.charaId1 - b.charaId1
    }
    return a.charaId2 - b.charaId2
  })

  return { entries, maxLevel }
}

/** Progress toward the next bond level as a 0..100 percentage. */
export function bondLevelProgressPercent(entry: BondEntry): number | null {
  if (entry.levelExpSpan == null || entry.needExp == null || entry.levelExpSpan <= 0) {
    return null
  }

  const progress = ((entry.levelExpSpan - entry.needExp) / entry.levelExpSpan) * 100
  return Math.min(Math.max(progress, 0), 100)
}
