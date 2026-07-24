import type { RecommendCard } from "haruki-sekai-deck-recommend-cpp"
import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"

/** Fixed render order for the music clear-count section. */
export const PROFILE_MUSIC_DIFFICULTIES = [
  "easy",
  "normal",
  "hard",
  "expert",
  "master",
  "append",
] as const

export type ProfileMusicDifficulty = (typeof PROFILE_MUSIC_DIFFICULTIES)[number]

/** Challenge live always renders the full character roster (IDs 1..26). */
export const CHALLENGE_LIVE_CHARACTER_COUNT = 26

export const CHALLENGE_LIVE_SORT_MODES = ["character", "score"] as const

export type ChallengeLiveSortMode = (typeof CHALLENGE_LIVE_SORT_MODES)[number]

export type PlayerGamedataInfo = {
  userId: string | null
  name: string
  rank: number
  deck: number | null
}

export type PlayerProfileInfo = {
  word: string
  twitterId: string
}

/** Normalized entry from the suite `userCards` record. */
export type PlayerCardRecord = {
  cardId: number
  level: number
  masterRank: number
  skillLevel: number
  specialTrainingStatus: string
  defaultImage: string
}

export type MusicClearCountRow = {
  difficulty: ProfileMusicDifficulty
  clear: number
  fullCombo: number
  allPerfect: number
}

export type CharacterRankEntry = {
  characterId: number
  characterRank: number
}

export type ChallengeLiveCell = {
  characterId: number
  highScore: number
  /** Highest stage reached; 0 when the character has no challenge data. */
  stage: number
  hasData: boolean
}

/** Strips in-game `<#...>` color tags from a profile bio and trims it. */
export function cleanProfileWord(value: unknown): string {
  if (typeof value !== "string") {
    return ""
  }

  return value.replace(/<#.*?>/g, "").trim()
}

/** Tolerantly parses the suite `userGamedata` record. */
export function normalizePlayerGamedata(raw: unknown): PlayerGamedataInfo | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return null
  }

  const record = raw as Record<string, unknown>
  const rawUserId = record.userId
  const userId = typeof rawUserId === "string" && rawUserId.trim() !== ""
    ? rawUserId.trim()
    : normalizeCatalogNumber(rawUserId) != null
      ? String(record.userId)
      : null

  return {
    userId,
    name: normalizeCatalogString(record.name),
    rank: normalizeCatalogNumber(record.rank) ?? 0,
    deck: normalizeCatalogNumber(record.deck),
  }
}

/** Tolerantly parses the suite `userProfile` record. */
export function normalizePlayerProfile(raw: unknown): PlayerProfileInfo {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return { word: "", twitterId: "" }
  }

  const record = raw as Record<string, unknown>
  return {
    word: cleanProfileWord(record.word),
    twitterId: normalizeCatalogString(record.twitterId),
  }
}

/** Tolerantly parses the raw suite `userCards` list into typed records. */
export function normalizePlayerCards(raw: unknown): PlayerCardRecord[] {
  const records: PlayerCardRecord[] = []
  for (const record of normalizeCatalogRecords(raw)) {
    const cardId = normalizeCatalogNumber(record.cardId)
    if (!cardId) {
      continue
    }

    records.push({
      cardId,
      level: normalizeCatalogNumber(record.level) ?? 0,
      masterRank: normalizeCatalogNumber(record.masterRank) ?? 0,
      skillLevel: normalizeCatalogNumber(record.skillLevel) ?? 0,
      specialTrainingStatus: normalizeCatalogString(record.specialTrainingStatus),
      defaultImage: normalizeCatalogString(record.defaultImage),
    })
  }

  return records
}

export function buildPlayerCardMap(records: readonly PlayerCardRecord[]): Map<number, PlayerCardRecord> {
  const map = new Map<number, PlayerCardRecord>()
  for (const record of records) {
    map.set(record.cardId, record)
  }

  return map
}

/** The game renders after-training art when the card's default image is set to it. */
export function shouldUseTrainedImage(record: Pick<PlayerCardRecord, "defaultImage">): boolean {
  return record.defaultImage === "special_training"
}

/**
 * Adapts a suite card record into the deck-recommend card shape so the deck
 * section can reuse the deck-recommend thumbnail pipeline. Score-related
 * fields are irrelevant for rendering and stay zeroed.
 */
export function buildDeckThumbnailCard(cardId: number, record: PlayerCardRecord | null): RecommendCard {
  return {
    card_id: cardId,
    total_power: 0,
    base_power: 0,
    event_bonus_rate: 0,
    master_rank: record?.masterRank ?? 0,
    level: record?.level ?? 0,
    skill_level: record?.skillLevel ?? 0,
    skill_score_up: 0,
    skill_life_recovery: 0,
    episode1_read: false,
    episode2_read: false,
    after_training: record?.specialTrainingStatus === "done",
    default_image: record?.defaultImage ?? "",
    has_canvas_bonus: false,
  }
}

/**
 * Resolves the active deck's card ids: leader first, then member1..member5 in
 * slot order, skipping empty slots and duplicates of the leader.
 */
export function resolveActiveDeckCardIds(rawDecks: unknown, activeDeckId: number | null): number[] {
  if (activeDeckId == null) {
    return []
  }

  const deck = normalizeCatalogRecords(rawDecks)
    .find((record) => normalizeCatalogNumber(record.deckId) === activeDeckId)
  if (!deck) {
    return []
  }

  const leader = normalizeCatalogNumber(deck.leader)
  const cardIds: number[] = []
  if (leader != null && leader > 0) {
    cardIds.push(leader)
  }

  for (const slot of ["member1", "member2", "member3", "member4", "member5"] as const) {
    const cardId = normalizeCatalogNumber(deck[slot])
    if (cardId != null && cardId > 0 && cardId !== leader) {
      cardIds.push(cardId)
    }
  }

  return cardIds
}

/**
 * Per-difficulty clear counts from `userMusicResults`, deduped by musicId:
 * a music counts as cleared when it has any result row for that difficulty,
 * FC / AP when any of its rows carries the corresponding flag. Difficulties
 * without any rows are omitted (e.g. append on servers without it).
 */
export function buildMusicClearCounts(rawResults: unknown): MusicClearCountRow[] {
  const perDifficulty = new Map<ProfileMusicDifficulty, Map<number, { fullCombo: boolean, allPerfect: boolean }>>()

  for (const record of normalizeCatalogRecords(rawResults)) {
    const musicId = normalizeCatalogNumber(record.musicId)
    const difficulty = normalizeCatalogString(record.musicDifficultyType)
    if (!musicId || !isProfileMusicDifficulty(difficulty)) {
      continue
    }

    let musics = perDifficulty.get(difficulty)
    if (!musics) {
      musics = new Map()
      perDifficulty.set(difficulty, musics)
    }

    let flags = musics.get(musicId)
    if (!flags) {
      flags = { fullCombo: false, allPerfect: false }
      musics.set(musicId, flags)
    }

    flags.fullCombo ||= record.fullComboFlg === true
    flags.allPerfect ||= record.fullPerfectFlg === true
  }

  const rows: MusicClearCountRow[] = []
  for (const difficulty of PROFILE_MUSIC_DIFFICULTIES) {
    const musics = perDifficulty.get(difficulty)
    if (!musics || musics.size === 0) {
      continue
    }

    let fullCombo = 0
    let allPerfect = 0
    for (const flags of musics.values()) {
      if (flags.fullCombo) {
        fullCombo += 1
      }

      if (flags.allPerfect) {
        allPerfect += 1
      }
    }

    rows.push({ difficulty, clear: musics.size, fullCombo, allPerfect })
  }

  return rows
}

/**
 * Character rank entries sorted by characterId ascending. Duplicate ids keep
 * the highest rank.
 */
export function buildCharacterRanks(rawCharacters: unknown): CharacterRankEntry[] {
  const ranks = new Map<number, number>()
  for (const record of normalizeCatalogRecords(rawCharacters)) {
    const characterId = normalizeCatalogNumber(record.characterId)
    if (!characterId) {
      continue
    }

    const characterRank = normalizeCatalogNumber(record.characterRank) ?? 0
    ranks.set(characterId, Math.max(ranks.get(characterId) ?? 0, characterRank))
  }

  return [...ranks.entries()]
    .map(([characterId, characterRank]) => ({ characterId, characterRank }))
    .sort((a, b) => a.characterId - b.characterId)
}

/**
 * Challenge live grid over the full roster (IDs 1..26): high score from the
 * per-character best results, stage = max `rank` among the character's stage
 * rows (floored at 1 when the character has any challenge data, 0 otherwise).
 */
export function buildChallengeLiveGrid(rawResults: unknown, rawStages: unknown): ChallengeLiveCell[] {
  const highScores = new Map<number, number>()
  for (const record of normalizeCatalogRecords(rawResults)) {
    const characterId = normalizeCatalogNumber(record.characterId)
    if (!characterId) {
      continue
    }

    const highScore = normalizeCatalogNumber(record.highScore) ?? 0
    highScores.set(characterId, Math.max(highScores.get(characterId) ?? 0, highScore))
  }

  const stageRanks = new Map<number, number>()
  for (const record of normalizeCatalogRecords(rawStages)) {
    const characterId = normalizeCatalogNumber(record.characterId)
    if (!characterId) {
      continue
    }

    const rank = normalizeCatalogNumber(record.rank) ?? 0
    stageRanks.set(characterId, Math.max(stageRanks.get(characterId) ?? 0, rank))
  }

  const cells: ChallengeLiveCell[] = []
  for (let characterId = 1; characterId <= CHALLENGE_LIVE_CHARACTER_COUNT; characterId += 1) {
    const hasData = highScores.has(characterId) || stageRanks.has(characterId)
    cells.push({
      characterId,
      highScore: highScores.get(characterId) ?? 0,
      stage: hasData ? Math.max(1, stageRanks.get(characterId) ?? 0) : 0,
      hasData,
    })
  }

  return cells
}

/** Best challenge live character (highest score); null when nothing was played. */
export function summarizeChallengeLiveTop(cells: readonly ChallengeLiveCell[]): ChallengeLiveCell | null {
  let top: ChallengeLiveCell | null = null
  for (const cell of cells) {
    if (cell.highScore > 0 && (top == null || cell.highScore > top.highScore)) {
      top = cell
    }
  }

  return top
}

/** Sorted copy: by characterId ascending, or by high score descending (id as tiebreaker). */
export function sortChallengeLiveCells(
  cells: readonly ChallengeLiveCell[],
  mode: ChallengeLiveSortMode,
): ChallengeLiveCell[] {
  const sorted = [...cells]
  if (mode === "score") {
    sorted.sort((a, b) => b.highScore - a.highScore || a.characterId - b.characterId)
  } else {
    sorted.sort((a, b) => a.characterId - b.characterId)
  }

  return sorted
}

export function isProfileMusicDifficulty(value: string): value is ProfileMusicDifficulty {
  return (PROFILE_MUSIC_DIFFICULTIES as readonly string[]).includes(value)
}
