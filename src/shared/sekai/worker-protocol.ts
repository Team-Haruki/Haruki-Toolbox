import type { SekaiRegion } from "@/types"

export const SEKAI_DATA_DEFAULT_MASTER_FILES = [
  "events",
  "gameCharacters",
  "musics",
  "musicDifficulties",
  "worldBlooms",
] as const

export const SEKAI_DATA_RECOMMEND_MASTER_FILES = [
  "areaItemLevels",
  "areaItems",
  "areas",
  "cardEpisodes",
  "cards",
  "cardRarities",
  "characterRanks",
  "eventCards",
  "eventDeckBonuses",
  "eventExchangeSummaries",
  "events",
  "eventItems",
  "eventRarityBonusRates",
  "gameCharacters",
  "gameCharacterUnits",
  "honors",
  "masterLessons",
  "musicDifficulties",
  "musics",
  "musicVocals",
  "shopItems",
  "skills",
  "worldBloomDifferentAttributeBonuses",
  "worldBlooms",
  "worldBloomSupportDeckBonuses",
  "worldBloomSupportDeckUnitEventLimitedBonuses",
  "cardMysekaiCanvasBonuses",
  "mysekaiFixtureGameCharacterGroups",
  "mysekaiFixtureGameCharacterGroupPerformanceBonuses",
  "mysekaiGates",
  "mysekaiGateLevels",
] as const

export type SekaiDataUpdatePhase =
  | "queued"
  | "checking"
  | "fetching-master"
  | "fetching-music-metas"
  | "writing-cache"
  | "ready"
  | "clearing"

export type SekaiDataWorkerRequest =
  | {
    type: "ensure-region"
    requestId: string
    region: SekaiRegion
    force?: boolean
    files?: string[]
  }
  | {
    type: "clear-region"
    requestId: string
    region: SekaiRegion
  }

export type SekaiDataWorkerEvent =
  | {
    type: "progress"
    requestId: string
    region: SekaiRegion
    phase: SekaiDataUpdatePhase
    progress: number
    fileName?: string
    current?: number
    total?: number
  }
  | {
    type: "done"
    requestId: string
    region: SekaiRegion
    cacheHit: boolean
    displayVersion: string | null
    fetchVersion: string | null
    files: string[]
    musicMetasUpdatedAt: number | null
    updatedAt: number | null
  }
  | {
    type: "cleared"
    requestId: string
    region: SekaiRegion
  }
  | {
    type: "error"
    requestId: string
    region: SekaiRegion
    message: string
  }
