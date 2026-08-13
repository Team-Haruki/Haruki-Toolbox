import { nextTick, watch, type ComputedRef, type Ref } from "vue"
import { useRoute } from "vue-router"
import type { SekaiRegion } from "@/types"
import {
  parseDeckCustomBonusCharacterIdsInput,
  parseDeckCustomBonusSupportUnitsInput,
  type DeckRecommendEventAttr,
  type DeckRecommendLiveType,
  type DeckRecommendMode,
  type DeckRecommendSupportUnitType,
  type DeckRecommendTarget,
} from "../lib/recommend-options"
import {
  isAllowedRecommendTarget,
  normalizeDeckRecommendLiveType,
  normalizeLegacyRecommendModeTarget,
  type NumericInputValue,
} from "../lib/recommend-form-utils"
import {
  DECK_RECOMMEND_CUSTOM_SIMULATED_UNIT,
  isDeckRecommendEventAttr,
  isDeckRecommendMode,
  isDeckRecommendSimulatedEventUnit,
  isDeckRecommendTarget,
  isSekaiRegionValue,
  type DeckRecommendSimulatedEventUnitValue,
} from "../lib/saved-config"

/**
 * Hydrates the DeckRecommend form from route query parameters. Registers the
 * `route.query` watcher (immediate) at call time, so call it at the same
 * position in setup order as the original inline watcher.
 */
export function useDeckRecommendRouteQuery(input: {
  dataRegion: Ref<SekaiRegion>
  recommendMode: Ref<DeckRecommendMode>
  recommendTarget: Ref<DeckRecommendTarget>
  liveType: Ref<DeckRecommendLiveType>
  isLiveTypeLocked: ComputedRef<boolean>
  selectedMusicId: Ref<string | null>
  selectedDifficulty: Ref<string | null>
  bonusTargetsInput: Ref<string>
  simulatedEventAttr: Ref<DeckRecommendEventAttr | null>
  simulatedEventUnit: Ref<DeckRecommendSimulatedEventUnitValue | null>
  eventSimulationEnabled: Ref<boolean>
  customBonusCharacterIds: Ref<number[]>
  customBonusSupportUnits: Ref<Record<string, DeckRecommendSupportUnitType>>
  filterOtherUnit: Ref<boolean>
  boostInput: Ref<NumericInputValue>
  routeHydrationInProgress: Ref<boolean>
  lockRegion: () => void
}) {
  const route = useRoute()
  let routeQueryHydrationSignature = ""

  function applyDeckRecommendRouteQuery() {
    const signature = createDeckRecommendRouteQuerySignature()
    if (!signature || signature === routeQueryHydrationSignature) {
      return
    }

    routeQueryHydrationSignature = signature
    input.routeHydrationInProgress.value = true

    const queryRegion = readRouteQueryString("dataRegion") ?? readRouteQueryString("region")
    if (queryRegion && isSekaiRegionValue(queryRegion)) {
      input.lockRegion()
      input.dataRegion.value = queryRegion
    }

    const queryMode = readRouteQueryString("mode")
    const legacyModeTarget = normalizeLegacyRecommendModeTarget(queryMode)
    if (legacyModeTarget) {
      input.recommendMode.value = legacyModeTarget.mode
      input.recommendTarget.value = legacyModeTarget.target
    } else if (queryMode && isDeckRecommendMode(queryMode)) {
      input.recommendMode.value = queryMode
    }

    const queryTarget = readRouteQueryString("target") ?? readRouteQueryString("recommendTarget")
    if (queryTarget && isDeckRecommendTarget(queryTarget) && isAllowedRecommendTarget(queryTarget, input.recommendMode.value)) {
      input.recommendTarget.value = queryTarget
    }

    const queryLiveType = readRouteQueryString("liveType")
    if (input.isLiveTypeLocked.value) {
      input.liveType.value = "solo"
    } else {
      const normalizedLiveType = normalizeDeckRecommendLiveType(queryLiveType)
      if (normalizedLiveType) {
        input.liveType.value = normalizedLiveType
      }
    }

    const queryMusicId = readPositiveIntegerRouteQuery("musicId")
    if (queryMusicId) {
      input.selectedMusicId.value = String(queryMusicId)
    }

    const queryMusicDifficulty = normalizeRouteMusicDifficulty(readRouteQueryString("musicDifficulty"))
      ?? normalizeRouteMusicDifficulty(readRouteQueryString("difficulty"))
    if (queryMusicDifficulty) {
      input.selectedDifficulty.value = queryMusicDifficulty
    }

    const queryBonusTargets = readRouteQueryString("bonusTargets")
      ?? readRouteQueryString("targetBonuses")
      ?? readRouteQueryString("target_bonus_list")
    if (queryBonusTargets) {
      input.bonusTargetsInput.value = queryBonusTargets
    }

    const queryCustomBonusAttr = readRouteQueryString("customBonusAttr")
    if (queryCustomBonusAttr && isDeckRecommendEventAttr(queryCustomBonusAttr)) {
      input.simulatedEventAttr.value = queryCustomBonusAttr
    }

    const queryCustomBonusCharacters = readRouteQueryString("customBonusCharacters")
      ?? readRouteQueryString("customBonusCharacterIds")
    if (queryCustomBonusCharacters) {
      input.customBonusCharacterIds.value = parseDeckCustomBonusCharacterIdsInput(queryCustomBonusCharacters).values
    }

    const queryCustomBonusSupportUnits = readRouteQueryString("customBonusSupportUnits")
    if (queryCustomBonusSupportUnits) {
      input.customBonusSupportUnits.value = parseDeckCustomBonusSupportUnitsInput(queryCustomBonusSupportUnits).values
    }

    const queryFilterOtherUnit = readRouteQueryBoolean("filterOtherUnit")
    if (queryFilterOtherUnit != null) {
      input.filterOtherUnit.value = queryFilterOtherUnit
    }

    const querySimulatedEventUnit = readRouteQueryString("simulatedEventUnit")
    const hasCustomBonusQuery = Boolean(queryCustomBonusCharacters || queryCustomBonusSupportUnits)
    if (querySimulatedEventUnit && isDeckRecommendSimulatedEventUnit(querySimulatedEventUnit)) {
      input.simulatedEventUnit.value = querySimulatedEventUnit
      input.eventSimulationEnabled.value = true
    } else if (hasCustomBonusQuery) {
      input.simulatedEventUnit.value = DECK_RECOMMEND_CUSTOM_SIMULATED_UNIT
      input.eventSimulationEnabled.value = true
    }

    const queryBoost = readIntegerRouteQuery("boost")
    if (queryBoost != null && queryBoost >= 0 && queryBoost <= 10) {
      input.boostInput.value = String(queryBoost)
    }

    void nextTick(() => {
      input.routeHydrationInProgress.value = false
    })
  }

  function createDeckRecommendRouteQuerySignature() {
    const keys = [
      "source",
      "mode",
      "target",
      "recommendTarget",
      "dataRegion",
      "region",
      "liveType",
      "musicId",
      "musicDifficulty",
      "difficulty",
      "bonusTargets",
      "targetBonuses",
      "target_bonus_list",
      "customBonusAttr",
      "customBonusCharacters",
      "customBonusCharacterIds",
      "customBonusSupportUnits",
      "filterOtherUnit",
      "simulatedEventUnit",
      "boost",
    ]
    const values = keys.map((key) => `${key}=${readRouteQueryString(key) ?? ""}`)
    return values.some((value) => !value.endsWith("=")) ? values.join("&") : ""
  }

  function readRouteQueryString(key: string): string | null {
    const value = route.query[key]
    const raw = Array.isArray(value) ? value[0] : value
    if (typeof raw !== "string") {
      return null
    }

    const trimmed = raw.trim()
    return trimmed ? trimmed : null
  }

  function readPositiveIntegerRouteQuery(key: string): number | null {
    const value = readIntegerRouteQuery(key)
    return value != null && value > 0 ? value : null
  }

  function readIntegerRouteQuery(key: string): number | null {
    const value = readRouteQueryString(key)
    if (!value) {
      return null
    }

    const parsed = Number(value)
    return Number.isInteger(parsed) ? parsed : null
  }

  function readRouteQueryBoolean(key: string): boolean | null {
    const value = readRouteQueryString(key)
    if (!value) {
      return null
    }

    const normalized = value.toLowerCase()
    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true
    }
    if (["0", "false", "no", "off"].includes(normalized)) {
      return false
    }
    return null
  }

  function normalizeRouteMusicDifficulty(value: string | null): string | null {
    if (!value) {
      return null
    }

    const normalized = value.trim().toLowerCase()
    return /^[a-z_]+$/.test(normalized) ? normalized : null
  }

  watch(
    () => route.query,
    () => {
      applyDeckRecommendRouteQuery()
    },
    { immediate: true },
  )
}
