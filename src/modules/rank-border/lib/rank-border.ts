export type RankBorderMode = "normal" | "world_bloom"

export type RankBorderLine = {
  rank: number
  score: number
  timestamp: number | null
}

export type RankBorderGrowth = {
  rank: number
  scoreLatest: number
  scoreEarlier: number | null
  timestampLatest: number | null
  timestampEarlier: number | null
  timeDiff: number | null
  growth: number | null
}

export type RankBorderTopPlayerGrowth = RankBorderGrowth & {
  userId: string
  characterId: number | null
}

export type RankBorderLatest = {
  rank: number
  score: number
  timestamp: number | null
  userId: string | null
  name: string | null
  cheerfulTeamId: number | null
  characterId: number | null
  cardId: number | null
  cardLevel: number | null
  cardMasterRank: number | null
  cardSpecialTrainingStatus: string | null
  cardDefaultImage: string | null
  profileWord: string | null
  profileHonors: RankBorderProfileHonor[]
  userPlayerFrames: RankBorderPlayerFrame[]
}

export type RankBorderUserProfile = Pick<
  RankBorderLatest,
  | "userId"
  | "name"
  | "cheerfulTeamId"
  | "cardId"
  | "cardLevel"
  | "cardMasterRank"
  | "cardSpecialTrainingStatus"
  | "cardDefaultImage"
  | "profileWord"
  | "profileHonors"
  | "userPlayerFrames"
>

export type RankBorderTracePoint = {
  rank: number
  score: number
  timestamp: number
  userId: string | null
  characterId: number | null
}

export type RankBorderStatus = {
  timestamp: number | null
  status: number | null
  statusDesc: string | null
  timeAgo: number | null
}

export type RankBorderWebRankingPage = {
  items: RankBorderLatest[]
  nextCursor: string | null
}

export type RankBorderDetailTraceSource = "rank" | "user" | "line"

export type RankBorderDetailTraceTarget = {
  source: RankBorderDetailTraceSource
  query: string
  result: RankBorderLatest | RankBorderLine
}

export type RankBorderOverview = {
  topRankings: RankBorderLatest[]
  topPlayerGrowths: RankBorderTopPlayerGrowth[]
  topRankGrowths: RankBorderGrowth[]
  borderLines: RankBorderLine[]
  borderGrowths: RankBorderGrowth[]
  status: RankBorderStatus | null
  intervalSeconds: number | null
}

export type RankBorderProfileHonor = {
  seq: number | null
  profileHonorType: string | null
  honorId: number | null
  honorId2: number | null
  honorLevel: number | null
  honorCount: number | null
  bondsHonorViewType: string | null
  bondsHonorWordId: number | null
}

export type RankBorderPlayerFrame = {
  playerFrameId: number | null
  playerFrameAttachStatus: string | null
}

export function normalizeRankBorderLines(value: unknown): RankBorderLine[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null
      }

      const rank = normalizePositiveInteger(item.rank)
      const score = normalizeNonNegativeInteger(item.score)
      if (!rank || score == null) {
        return null
      }

      return {
        rank,
        score,
        timestamp: normalizeNullableTimestamp(item.timestamp),
      }
    })
    .filter((item): item is RankBorderLine => item != null)
    .sort((a, b) => a.rank - b.rank)
}

export function normalizeRankBorderGrowths(value: unknown): RankBorderGrowth[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null
      }

      const rank = normalizePositiveInteger(item.rank)
      const scoreLatest = normalizeNonNegativeInteger(item.scoreLatest)
      if (!rank || scoreLatest == null) {
        return null
      }

      return {
        rank,
        scoreLatest,
        scoreEarlier: normalizeNonNegativeInteger(item.scoreEarlier),
        timestampLatest: normalizeNullableTimestamp(item.timestampLatest),
        timestampEarlier: normalizeNullableTimestamp(item.timestampEarlier),
        timeDiff: normalizeNonNegativeInteger(item.timeDiff),
        growth: normalizeInteger(item.growth),
      }
    })
    .filter((item): item is RankBorderGrowth => item != null)
    .sort((a, b) => a.rank - b.rank)
}

export function normalizeRankBorderTopPlayerGrowths(value: unknown): RankBorderTopPlayerGrowth[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null
      }

      const rank = normalizePositiveInteger(item.rank)
      const userId = normalizeText(item.userId)
      const scoreLatest = normalizeNonNegativeInteger(item.scoreLatest)
      const scoreEarlier = normalizeNonNegativeInteger(item.scoreEarlier)
      const timestampLatest = normalizeNullableTimestamp(item.timestampLatest)
      const timestampEarlier = normalizeNullableTimestamp(item.timestampEarlier)
      const timeDiff = normalizeNonNegativeInteger(item.timeDiff)
      const growth = normalizeInteger(item.growth)
      if (!rank || !userId || scoreLatest == null || scoreEarlier == null || timestampLatest == null || timestampEarlier == null || timeDiff == null || growth == null) {
        return null
      }

      return {
        rank,
        userId,
        scoreLatest,
        scoreEarlier,
        timestampLatest,
        timestampEarlier,
        timeDiff,
        growth,
        characterId: normalizePositiveInteger(item.characterId),
      }
    })
    .filter((item): item is RankBorderTopPlayerGrowth => item != null)
    .sort((a, b) => a.rank - b.rank)
}

export function normalizeRankBorderLatest(value: unknown): RankBorderLatest | null {
  const response = normalizeLatestResponseRecord(value)
  if (!response) {
    return null
  }

  const rankData = isRecord(response.rankData) ? response.rankData : null
  const userData = isRecord(response.userData) ? response.userData : null
  if (!rankData) {
    return null
  }

  const rank = normalizePositiveInteger(rankData.rank)
  const score = normalizeNonNegativeInteger(rankData.score)
  const userId = normalizeText(rankData.userId) ?? normalizeText(userData?.userId)
  if (!rank || score == null) {
    return null
  }

  return {
    rank,
    score,
    timestamp: normalizeNullableTimestamp(rankData.timestamp),
    userId,
    name: normalizeText(userData?.name),
    cheerfulTeamId: normalizePositiveInteger(userData?.cheerfulTeamId),
    characterId: normalizePositiveInteger(rankData.characterId),
    cardId: normalizePositiveInteger(userData?.cardId),
    cardLevel: normalizePositiveInteger(userData?.cardLevel),
    cardMasterRank: normalizeNonNegativeInteger(userData?.cardMasterRank),
    cardSpecialTrainingStatus: normalizeText(userData?.cardSpecialTrainingStatus),
    cardDefaultImage: normalizeText(userData?.cardDefaultImage),
    profileWord: normalizeText(userData?.profileWord),
    profileHonors: normalizeProfileHonors(userData?.profileHonors),
    userPlayerFrames: normalizePlayerFrames(userData?.userPlayerFrames),
  }
}

export function normalizeRankBorderUserProfiles(value: unknown): RankBorderUserProfile[] {
  const items = isRecord(value) && Array.isArray(value.items)
    ? value.items
    : Array.isArray(value)
      ? value
      : isRecord(value)
        ? [value]
        : []

  return items
    .map(normalizeRankBorderUserProfile)
    .filter((item): item is RankBorderUserProfile => item != null)
}

export function normalizeRankBorderWebRankings(value: unknown): RankBorderWebRankingPage {
  const items = isRecord(value) && Array.isArray(value.items)
    ? value.items
    : Array.isArray(value)
      ? value
      : []

  return {
    items: items
      .map((item) => normalizeRankBorderLatest(normalizeWebRankingItem(item)))
      .filter((item): item is RankBorderLatest => item != null)
      .sort((a, b) => a.rank - b.rank),
    nextCursor: isRecord(value) ? normalizeText(value.nextCursor) : null,
  }
}

export function normalizeRankBorderOverview(value: unknown): RankBorderOverview {
  const record = isRecord(value) ? value : {}
  return {
    topRankings: normalizeRankBorderWebRankings({
      items: Array.isArray(record.topRankings) ? record.topRankings : [],
    }).items,
    topPlayerGrowths: normalizeRankBorderTopPlayerGrowths(record.topPlayerGrowths),
    topRankGrowths: normalizeRankBorderGrowths(record.topRankGrowths),
    borderLines: normalizeRankBorderLines(record.borderLines),
    borderGrowths: normalizeRankBorderGrowths(record.borderGrowths),
    status: normalizeRankBorderStatus(record.status),
    intervalSeconds: normalizePositiveInteger(record.intervalSeconds),
  }
}

export function normalizeRankBorderTrace(value: unknown): RankBorderTracePoint[] {
  const rankData = isRecord(value) && Array.isArray(value.rankData)
    ? value.rankData
    : isRecord(value) && Array.isArray(value.items)
      ? value.items
    : Array.isArray(value)
      ? value
      : []

  return rankData
    .map((item) => {
      if (!isRecord(item)) {
        return null
      }

      const rank = normalizePositiveInteger(item.rank)
      const score = normalizeNonNegativeInteger(item.score)
      const timestamp = normalizeNullableTimestamp(item.timestamp)
      if (!rank || score == null || !timestamp) {
        return null
      }

      return {
        rank,
        score,
        timestamp,
        userId: normalizeText(item.userId),
        characterId: normalizePositiveInteger(item.characterId),
      }
    })
    .filter((item): item is RankBorderTracePoint => item != null)
    .sort((a, b) => a.timestamp - b.timestamp)
}

export function normalizeRankBorderTraceTimeline(records: RankBorderTracePoint[]): RankBorderTracePoint[] {
  const byTimestamp = new Map<number, RankBorderTracePoint>()
  for (const record of records) {
    const previous = byTimestamp.get(record.timestamp)
    if (!previous || record.score >= previous.score) {
      byTimestamp.set(record.timestamp, record)
    }
  }

  return Array.from(byTimestamp.values()).sort((a, b) => a.timestamp - b.timestamp)
}

export function isRankBorderLatestResult(result: RankBorderLatest | RankBorderLine | null | undefined): result is RankBorderLatest {
  return Array.isArray((result as RankBorderLatest | null | undefined)?.profileHonors)
}

export function resolveRankBorderDetailTraceKey(target: RankBorderDetailTraceTarget): string {
  const userId = isRankBorderLatestResult(target.result)
    ? normalizeText(target.result.userId)
    : null
  const identity = target.source === "line" || !userId
    ? `rank:${target.result.rank}`
    : `user:${userId}`
  return `${target.source}:${identity}:${target.query}`
}

export function shouldCacheRankBorderDetailTraceByRank(target: RankBorderDetailTraceTarget): boolean {
  return target.source === "line"
    || (
      target.source === "rank"
      && (!isRankBorderLatestResult(target.result) || !normalizeText(target.result.userId))
    )
}

export function isSameRankBorderTraceTimeline(previous: RankBorderTracePoint[], next: RankBorderTracePoint[]): boolean {
  if (previous.length !== next.length) {
    return false
  }

  return previous.every((record, index) => {
    const nextRecord = next[index]
    return record.timestamp === nextRecord.timestamp
      && record.score === nextRecord.score
      && record.rank === nextRecord.rank
      && record.userId === nextRecord.userId
      && record.characterId === nextRecord.characterId
  })
}

export function resolveRankBorderTraceGrowth(records: RankBorderTracePoint[], startTime: number): RankBorderGrowth | null {
  if (records.length < 2) {
    return null
  }

  const latest = records[records.length - 1]
  if (latest.timestamp <= startTime) {
    return null
  }

  let earlier: RankBorderTracePoint | null = null
  for (const record of records) {
    if (record.timestamp <= startTime) {
      earlier = record
      continue
    }
    break
  }
  earlier ??= records[0]
  if (earlier.timestamp === latest.timestamp) {
    return null
  }

  return {
    rank: latest.rank,
    scoreLatest: latest.score,
    scoreEarlier: earlier.score,
    timestampLatest: latest.timestamp,
    timestampEarlier: earlier.timestamp,
    timeDiff: latest.timestamp - earlier.timestamp,
    growth: latest.score - earlier.score,
  }
}

export function normalizeRankBorderStatus(value: unknown): RankBorderStatus | null {
  if (!isRecord(value)) {
    return null
  }

  return {
    timestamp: normalizeNullableTimestamp(value.timestamp),
    status: normalizeInteger(value.status),
    statusDesc: normalizeText(value.statusDesc),
    timeAgo: normalizeNonNegativeInteger(value.timeAgo),
  }
}

export function normalizeTrackerEndpoint(value: unknown): string {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim().replace(/\/+$/, "")
}

export function formatRankBorderPathSegment(value: string | number): string {
  return encodeURIComponent(String(value).trim())
}

export function parseRankBorderRankQuery(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") {
    return null
  }

  const normalized = String(value)
    .trim()
    .replace(/^[#tT]\s*/, "")
    .replace(/[,\s_]/g, "")
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeLatestResponseRecord(value: unknown): Record<string, unknown> | null {
  if (isRecord(value)) {
    return value
  }

  if (Array.isArray(value)) {
    const [rankData, userData] = value
    if (isRecord(rankData) || isRecord(userData)) {
      return { rankData, userData }
    }
  }

  return null
}

function normalizeWebRankingItem(value: unknown): unknown {
  if (!isRecord(value)) {
    return value
  }

  if (isRecord(value.rankData)) {
    return {
      rankData: value.rankData,
      userData: isRecord(value.userData) ? value.userData : value,
    }
  }

  if (isRecord(value.userData)) {
    return {
      rankData: value,
      userData: value.userData,
    }
  }

  return { rankData: value, userData: value }
}

function normalizeRankBorderUserProfile(value: unknown): RankBorderUserProfile | null {
  if (!isRecord(value)) {
    return null
  }

  const userId = normalizeText(value.userId)
  if (!userId) {
    return null
  }

  return {
    userId,
    name: normalizeText(value.name),
    cheerfulTeamId: normalizePositiveInteger(value.cheerfulTeamId),
    cardId: normalizePositiveInteger(value.cardId),
    cardLevel: normalizePositiveInteger(value.cardLevel),
    cardMasterRank: normalizeNonNegativeInteger(value.cardMasterRank),
    cardSpecialTrainingStatus: normalizeText(value.cardSpecialTrainingStatus),
    cardDefaultImage: normalizeText(value.cardDefaultImage),
    profileWord: normalizeText(value.profileWord),
    profileHonors: normalizeProfileHonors(value.profileHonors),
    userPlayerFrames: normalizePlayerFrames(value.userPlayerFrames),
  }
}

function normalizeProfileHonors(value: unknown): RankBorderProfileHonor[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null
      }

      return {
        seq: normalizePositiveInteger(item.seq),
        profileHonorType: normalizeText(item.profileHonorType),
        honorId: normalizePositiveInteger(item.honorId),
        honorId2: normalizePositiveInteger(item.honorId2),
        honorLevel: normalizeNonNegativeInteger(item.honorLevel),
        honorCount: normalizeHonorCount(item),
        bondsHonorViewType: normalizeText(item.bondsHonorViewType),
        bondsHonorWordId: normalizeNonNegativeInteger(item.bondsHonorWordId),
      }
    })
    .filter((item): item is RankBorderProfileHonor => item != null)
    .sort((a, b) => (a.seq ?? 999) - (b.seq ?? 999))
}

function normalizeHonorCount(item: Record<string, unknown>): number | null {
  for (const key of [
    "honorCount",
    "count",
    "achievementCount",
    "progressCount",
    "musicCount",
    "fullComboCount",
    "allPerfectCount",
    "fcCount",
    "apCount",
  ]) {
    const value = normalizeNonNegativeInteger(item[key])
    if (value != null) {
      return value
    }
  }

  return null
}

function normalizePlayerFrames(value: unknown): RankBorderPlayerFrame[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null
      }

      return {
        playerFrameId: normalizePositiveInteger(item.playerFrameId),
        playerFrameAttachStatus: normalizeText(item.playerFrameAttachStatus),
      }
    })
    .filter((item): item is RankBorderPlayerFrame => item != null)
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function normalizePositiveInteger(value: unknown): number | null {
  const parsed = normalizeInteger(value)
  return parsed != null && parsed > 0 ? parsed : null
}

function normalizeNonNegativeInteger(value: unknown): number | null {
  const parsed = normalizeInteger(value)
  return parsed != null && parsed >= 0 ? parsed : null
}

function normalizeInteger(value: unknown): number | null {
  if (value == null || value === "") {
    return null
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) && Number.isFinite(parsed) ? parsed : null
}

function normalizeNullableTimestamp(value: unknown): number | null {
  const parsed = normalizeInteger(value)
  return parsed != null && parsed > 0 ? parsed : null
}
