import { SEKAI_LIVE_BOOST_MULTIPLIERS } from "@/shared/sekai/live-boost"

export const SCORE_CONTROL_DEFAULT_MUSIC_ID = 74
export const SCORE_CONTROL_MAX_SCORE = 2_840_000
export const SCORE_CONTROL_MAX_EVENT_BONUS = 435
export const SCORE_CONTROL_MAX_WORLD_LINK_EVENT_BONUS = 600
export const SCORE_CONTROL_DEFAULT_RESULT_LIMIT = 150

export const SCORE_CONTROL_BOOST_MULTIPLIERS = SEKAI_LIVE_BOOST_MULTIPLIERS

export type ScoreControlMusicMeta = {
  music_id?: number
  musicId?: number
  difficulty?: string
  musicDifficulty?: string
  event_rate?: number
  eventRate?: number
}

export type ScoreControlBasicPoint = {
  musicId: number
  difficulty: string
  basicPoint: number
}

export type ScoreControlRange = {
  eventBonus: number
  boost: number
  boostMultiplier: number
  scoreMin: number
  scoreMax: number
}

export type FindScoreControlRangesInput = {
  targetPoint: number
  basicPoint: number
  worldLink?: boolean
  boost?: number | null
  limit?: number
  minEventBonus?: number | null
  maxEventBonus?: number | null
}

export function calculateScoreControlPoints(
  score: number,
  eventBonus: number,
  basicPoint: number,
  boost: number,
): number {
  const boostMultiplier = SCORE_CONTROL_BOOST_MULTIPLIERS[boost]
  if (!Number.isInteger(boostMultiplier) || boostMultiplier <= 0) {
    return 0
  }

  const scoreBonus = Math.floor(score / 20_000)
  const base = Math.floor((100 + scoreBonus) * (100 + eventBonus) * basicPoint / 10_000)
  return base * boostMultiplier
}

export function findScoreControlRanges(input: FindScoreControlRangesInput): ScoreControlRange[] {
  const targetPoint = normalizePositiveInteger(input.targetPoint)
  const basicPoint = normalizePositiveInteger(input.basicPoint)
  if (!targetPoint || !basicPoint) {
    return []
  }

  const limit = normalizeNonNegativeInteger(input.limit) ?? SCORE_CONTROL_DEFAULT_RESULT_LIMIT
  const defaultMaxEventBonus = input.worldLink === true
    ? SCORE_CONTROL_MAX_WORLD_LINK_EVENT_BONUS
    : SCORE_CONTROL_MAX_EVENT_BONUS
  const maxEventBonus = normalizeNonNegativeInteger(input.maxEventBonus) ?? defaultMaxEventBonus
  const minEventBonus = Math.min(normalizeNonNegativeInteger(input.minEventBonus) ?? 0, maxEventBonus)
  const boostValues = normalizeBoostValues(input.boost)
  const result: ScoreControlRange[] = []

  for (let eventBonus = minEventBonus; eventBonus <= maxEventBonus; eventBonus += 1) {
    for (const boost of boostValues) {
      const boostMultiplier = SCORE_CONTROL_BOOST_MULTIPLIERS[boost]
      if (!boostMultiplier || targetPoint % boostMultiplier !== 0) {
        continue
      }

      const scoreMax = findMaxMatchingScore(targetPoint, eventBonus, basicPoint, boost)
      if (scoreMax == null) {
        continue
      }

      result.push({
        eventBonus,
        boost,
        boostMultiplier,
        scoreMin: findMinMatchingScore(targetPoint, eventBonus, basicPoint, boost),
        scoreMax,
      })
    }
  }

  result.sort(compareScoreControlRange)

  return limit > 0 ? result.slice(0, limit) : result
}

function compareScoreControlRange(a: ScoreControlRange, b: ScoreControlRange): number {
  return b.eventBonus - a.eventBonus
    || a.boost - b.boost
    || a.scoreMin - b.scoreMin
}

export function selectScoreControlBasicPoint(
  musicId: string | number | null | undefined,
  metas: readonly ScoreControlMusicMeta[] | null | undefined,
): ScoreControlBasicPoint | null {
  const targetMusicId = normalizePositiveInteger(musicId)
  if (!targetMusicId) {
    return null
  }

  const candidates = (metas ?? [])
    .map((item) => normalizeMusicMeta(targetMusicId, item))
    .filter((item): item is ScoreControlBasicPoint => item != null)
  if (candidates.length === 0) {
    return null
  }

  let best = candidates[0]
  for (const item of candidates.slice(1)) {
    if (item.difficulty === "master" && best.difficulty !== "master") {
      best = item
      continue
    }
    if (best.difficulty !== "master" && item.basicPoint > best.basicPoint) {
      best = item
    }
  }

  return best
}

function findMaxMatchingScore(
  targetPoint: number,
  eventBonus: number,
  basicPoint: number,
  boost: number,
): number | null {
  let left = 0
  let right = SCORE_CONTROL_MAX_SCORE
  let found = false
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const points = calculateScoreControlPoints(mid, eventBonus, basicPoint, boost)
    if (points <= targetPoint) {
      left = mid + 1
      if (points === targetPoint) {
        found = true
      }
      continue
    }
    right = mid - 1
  }

  return found ? right : null
}

function findMinMatchingScore(
  targetPoint: number,
  eventBonus: number,
  basicPoint: number,
  boost: number,
): number {
  let left = 0
  let right = SCORE_CONTROL_MAX_SCORE
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const points = calculateScoreControlPoints(mid, eventBonus, basicPoint, boost)
    if (points >= targetPoint) {
      right = mid - 1
      continue
    }
    left = mid + 1
  }

  return left
}

function normalizeMusicMeta(targetMusicId: number, item: ScoreControlMusicMeta): ScoreControlBasicPoint | null {
  const musicId = normalizePositiveInteger(item.music_id ?? item.musicId)
  const difficulty = normalizeText(item.difficulty ?? item.musicDifficulty)?.toLowerCase()
  const basicPoint = normalizePositiveInteger(item.event_rate ?? item.eventRate)
  if (musicId !== targetMusicId || !difficulty || !basicPoint) {
    return null
  }

  return {
    musicId,
    difficulty,
    basicPoint,
  }
}

function normalizeBoostValues(boost: number | null | undefined): number[] {
  if (boost == null) {
    return Object.keys(SCORE_CONTROL_BOOST_MULTIPLIERS).map(Number)
  }

  const normalized = normalizeNonNegativeInteger(boost)
  if (normalized == null || !(normalized in SCORE_CONTROL_BOOST_MULTIPLIERS)) {
    return []
  }

  return [normalized]
}

function normalizePositiveInteger(value: unknown): number | null {
  const parsed = typeof value === "string" && value.trim() !== "" ? Number(value) : value
  return typeof parsed === "number" && Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function normalizeNonNegativeInteger(value: unknown): number | null {
  const parsed = typeof value === "string" && value.trim() !== "" ? Number(value) : value
  return typeof parsed === "number" && Number.isInteger(parsed) && parsed >= 0 ? parsed : null
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}
