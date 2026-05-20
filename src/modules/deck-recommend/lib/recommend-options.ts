import type { CardConfig, MusicDifficulty, RecommendOptions, RecommendTarget } from "haruki-sekai-deck-recommend-cpp"
import type { SekaiRegion } from "@/types"
import type { CardTrainingConfig } from "./training-config"

export type DeckRecommendMode =
  | "event"
  | "challenge"
  | "bonus"
  | "mysekai"
  | "max-power"
  | "max-skill"

export type DeckRecommendLiveType = "solo" | "multi" | "auto" | "carnival"

export type DeckRecommendAlgorithm = "dfs_ga" | "ga" | "rl"

export type WasmRecommendLiveType =
  | "solo"
  | "multi"
  | "challenge"
  | "auto"
  | "challenge_auto"
  | "cheerful"
  | "mysekai"

export type BuildDeckRecommendOptionsInput = {
  region: SekaiRegion
  mode: DeckRecommendMode
  liveType: DeckRecommendLiveType
  algorithm: DeckRecommendAlgorithm
  musicId: string | number | null
  musicDifficulty: string | null
  eventId: string | number | null
  characterId: string | number | null
  trainingConfig: CardTrainingConfig[]
  userData: unknown
  limit?: number
  timeoutMs?: number
}

export function resolveWasmLiveType(
  mode: DeckRecommendMode,
  liveType: DeckRecommendLiveType,
): WasmRecommendLiveType {
  if (mode === "mysekai") {
    return "mysekai"
  }

  if (mode === "challenge") {
    return liveType === "auto" ? "challenge_auto" : "challenge"
  }

  if (liveType === "carnival") {
    return "cheerful"
  }

  return liveType
}

export function buildDeckRecommendOptions(input: BuildDeckRecommendOptionsInput): RecommendOptions {
  const musicId = normalizePositiveInteger(input.musicId)
  const musicDiff = normalizeMusicDifficulty(input.musicDifficulty)
  if (!musicId) {
    throw new Error("music_id is required")
  }
  if (!musicDiff) {
    throw new Error("music_diff is required")
  }

  const liveType = resolveWasmLiveType(input.mode, input.liveType)
  const target = resolveRecommendTarget(input.mode)
  const options: RecommendOptions = {
    region: input.region,
    live_type: liveType,
    music_id: musicId,
    music_diff: musicDiff,
    user_data: input.userData,
    target,
    algorithm: input.algorithm,
    limit: input.limit ?? 6,
    timeout_ms: input.timeoutMs ?? 15_000,
    member: 5,
    best_skill_as_leader: true,
    keep_after_training_state: false,
    skill_order_choose_strategy: defaultSkillStrategy(input.mode, liveType),
    skill_reference_choose_strategy: defaultSkillStrategy(input.mode, liveType),
    ...buildRarityConfigs(input.trainingConfig),
  }

  if (input.mode === "event" || input.mode === "bonus" || input.mode === "mysekai") {
    const eventId = normalizePositiveInteger(input.eventId)
    if (eventId) {
      options.event_id = eventId
    }
  }

  if (input.mode === "challenge") {
    const characterId = normalizePositiveInteger(input.characterId)
    if (characterId) {
      options.challenge_live_character_id = characterId
    }
  }

  if (liveType === "multi") {
    options.multi_live_teammate_power = 250_000
    options.multi_live_teammate_score_up = 200
  }

  return options
}

export function resolveRecommendDataMode(mode: DeckRecommendMode): "suite" | "mysekai" {
  return mode === "mysekai" ? "mysekai" : "suite"
}

function resolveRecommendTarget(mode: DeckRecommendMode): RecommendTarget {
  switch (mode) {
    case "bonus":
      return "bonus"
    case "max-power":
      return "power"
    case "max-skill":
      return "skill"
    default:
      return "score"
  }
}

function defaultSkillStrategy(mode: DeckRecommendMode, liveType: WasmRecommendLiveType) {
  if (mode === "challenge" && liveType !== "challenge_auto" && liveType !== "auto") {
    return "max"
  }

  return "average"
}

function buildRarityConfigs(trainingConfig: CardTrainingConfig[]) {
  const byRarity = Object.fromEntries(
    trainingConfig.map((row) => [row.rarity, toWasmCardConfig(row)]),
  )

  return {
    rarity_1_config: byRarity.rarity_1,
    rarity_2_config: byRarity.rarity_2,
    rarity_3_config: byRarity.rarity_3,
    rarity_4_config: byRarity.rarity_4,
    rarity_birthday_config: byRarity.rarity_birthday,
  }
}

function toWasmCardConfig(row: CardTrainingConfig): CardConfig {
  return {
    disable: row.disabled,
    level_max: row.maxLevel,
    episode_read: row.episodesRead,
    master_max: row.maxMasterRank,
    skill_max: row.maxSkillLevel,
    canvas: row.mySekaiCanvas,
  }
}

function normalizePositiveInteger(value: string | number | null): number | null {
  const raw = typeof value === "string" ? Number(value) : value
  if (!Number.isInteger(raw) || raw <= 0) {
    return null
  }

  return raw
}

function normalizeMusicDifficulty(value: string | null): MusicDifficulty | null {
  switch (value) {
    case "easy":
    case "normal":
    case "hard":
    case "expert":
    case "master":
    case "append":
      return value
    default:
      return null
  }
}
