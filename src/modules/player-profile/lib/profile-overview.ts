/**
 * The profile page's condensed views: one cell per character carrying its
 * level, card collection and challenge live score (grouped by unit), and the
 * song clear totals across every difficulty.
 */

export type ProfileCharacterCell = {
  characterId: number
  /** Character rank; null when the upload has none for this character. */
  rank: number | null
  /** Cards owned / released for this character; null without collection data. */
  collection: { owned: number; total: number; percent: number } | null
  /** Best challenge live score; null when the character has never played one. */
  challengeScore: number | null
}

export type ProfileCharacterGroup = {
  /** Unit key ("light_sound", …); null for characters whose unit is unknown. */
  unit: string | null
  cells: ProfileCharacterCell[]
}

export type ProfileCharacterSources = {
  ranks: readonly { characterId: number; characterRank: number }[]
  collection: readonly { characterId: number; owned: number; total: number; percent: number }[]
  challenge: readonly { characterId: number; highScore: number; hasData: boolean }[]
}

/**
 * One cell per character that appears in any of the three sources, grouped
 * by unit in `unitOrder` (unknown units last), characters by id inside a
 * group.
 */
export function buildProfileCharacterGroups(
  sources: ProfileCharacterSources,
  unitOf: (characterId: number) => string | null,
  unitOrder: readonly string[],
): ProfileCharacterGroup[] {
  const cells = new Map<number, ProfileCharacterCell>()
  const cellOf = (characterId: number): ProfileCharacterCell => {
    let cell = cells.get(characterId)
    if (!cell) {
      cell = { characterId, rank: null, collection: null, challengeScore: null }
      cells.set(characterId, cell)
    }
    return cell
  }

  for (const entry of sources.ranks) {
    cellOf(entry.characterId).rank = entry.characterRank
  }
  for (const entry of sources.collection) {
    cellOf(entry.characterId).collection = { owned: entry.owned, total: entry.total, percent: entry.percent }
  }
  for (const entry of sources.challenge) {
    // A roster-wide grid lists every character; one without a score (no
    // data, or a stage reached without a recorded result) adds nothing.
    if (entry.hasData && entry.highScore > 0) {
      cellOf(entry.characterId).challengeScore = entry.highScore
    }
  }

  const groups = new Map<string | null, ProfileCharacterCell[]>()
  for (const cell of [...cells.values()].sort((left, right) => left.characterId - right.characterId)) {
    const unit = unitOf(cell.characterId)
    const list = groups.get(unit)
    if (list) {
      list.push(cell)
    } else {
      groups.set(unit, [cell])
    }
  }

  const rank = (unit: string | null) => {
    const index = unit == null ? -1 : unitOrder.indexOf(unit)
    return index === -1 ? unitOrder.length : index
  }
  return [...groups.entries()]
    .sort(([left], [right]) => rank(left) - rank(right))
    .map(([unit, list]) => ({ unit, cells: list }))
}

export type MusicClearTotals = { allPerfect: number; fullCombo: number; cleared: number; total: number }

/** AP / FC / clear counts summed over every difficulty (a chart counts once per difficulty). */
export function summarizeMusicClears(
  rows: readonly { summary: { allPerfect: number; fullCombo: number; cleared: number; total: number } }[],
): MusicClearTotals {
  return rows.reduce<MusicClearTotals>((totals, row) => ({
    allPerfect: totals.allPerfect + row.summary.allPerfect,
    fullCombo: totals.fullCombo + row.summary.fullCombo,
    cleared: totals.cleared + row.summary.cleared,
    total: totals.total + row.summary.total,
  }), { allPerfect: 0, fullCombo: 0, cleared: 0, total: 0 })
}
