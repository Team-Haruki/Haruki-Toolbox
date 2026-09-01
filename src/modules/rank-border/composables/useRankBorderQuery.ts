import { computed, ref, watch } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useI18n } from "vue-i18n"
import type { ComboboxOption } from "@/components/ui/combobox"
import { formatGameAccountLabel } from "@/lib/game-account-display"
import { resolveSekaiRegionLabel, SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import { useSettingsStore } from "@/shared/stores/settings"
import { useUserStore } from "@/shared/stores/user"
import type { SekaiRegion } from "@/types"
import { useRankBorderMasterData } from "./useRankBorderMasterData"
import {
  buildMasterRecordMap,
  type RankBorderMasterBondsHonor,
  type RankBorderMasterBondsHonorWord,
  type RankBorderMasterCard,
  type RankBorderMasterGameCharacterUnit,
  type RankBorderMasterHonor,
  type RankBorderMasterHonorGroup,
} from "../lib/master-data-types"
import {
  normalizeTrackerEndpoint,
  type RankBorderMode,
} from "../lib/rank-border"
import {
  DEFAULT_INTERVAL_SECONDS,
  DEFAULT_TRACKER_ENDPOINT,
  LEGACY_DIRECT_TRACKER_ENDPOINTS,
  STORAGE_KEY,
} from "../lib/rank-border-constants"
import type { AccountOption, PersistedState } from "../lib/rank-border-types"

/**
 * QUERY / FILTER state cluster for the rank-border view.
 *
 * Owns the region/event/mode/interval/account selectors, the master-options
 * lookups derived from the current region + event, and the persistence + auto
 * selection wiring that keeps those selectors coherent. The view destructures
 * everything returned here; the names deliberately match the originals so the
 * `<template>` and the remaining view code keep referencing them unchanged.
 */
export function useRankBorderQuery() {
  const { t } = useI18n()
  const userStore = useUserStore()
  const settingsStore = useSettingsStore()

  const persistedState = readPersistedState()

  const trackerEndpoint = ref(resolveInitialTrackerEndpoint(persistedState.endpoint))
  const selectedRegion = ref<SekaiRegion>(persistedState.region ?? "cn")
  const selectedEventId = ref<string | null>(persistedState.eventId ?? null)
  const mode = ref<RankBorderMode>(persistedState.mode ?? "normal")
  const selectedWorldBloomCharacterId = ref<string | null>(persistedState.worldBloomCharacterId ?? null)
  const intervalSeconds = ref(persistedState.intervalSeconds ?? DEFAULT_INTERVAL_SECONDS)
  const selectedAccountKey = ref(persistedState.accountKey ?? "")
  const hideProfileAssets = ref(persistedState.hideProfileAssets ?? false)

  const masterOptions = useRankBorderMasterData(selectedRegion, selectedEventId)

  const eventComboboxOptions = computed<ComboboxOption[]>(() =>
    masterOptions.eventOptions.value.map((event) => ({
      value: event.value,
      label: event.label,
      description: event.startAt ? formatTimestamp(event.startAt) : null,
      tags: [
        {
          label: `#${event.id}`,
          class: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-200",
        },
        ...(event.isWorldBloom
          ? [{
              label: t("rankBorder.badges.worldBloom"),
              class: "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100",
            }]
          : []),
      ],
      keywords: [
        String(event.id),
        `#${event.id}`,
        event.eventType ?? "",
        event.assetbundleName ?? "",
      ],
    })),
  )

  const accountOptions = computed<AccountOption[]>(() =>
    (userStore.gameAccountBindings ?? []).map((account, index) => {
      const regionLabel = resolveSekaiRegionLabel(account.server, t)
      const userId = String(account.userId)
      return {
        key: `${account.server}:${userId}:${index}`,
        label: formatGameAccountLabel({
          regionLabel,
          uid: userId,
          hideUid: settingsStore.hideGameUserId,
        }),
        server: account.server,
        userId,
        verified: account.verified === true,
        isDefault: account.isDefault === true,
      }
    }),
  )

  const selectedAccount = computed(() =>
    accountOptions.value.find((account) => account.key === selectedAccountKey.value) ?? null,
  )

  const selectedEvent = computed(() => masterOptions.selectedEvent.value)
  const selectedWorldBloomCharacter = computed(() =>
    masterOptions.worldBloomCharacterOptions.value.find((option) => option.value === selectedWorldBloomCharacterId.value) ?? null,
  )
  const selectedActivityStartAt = computed(() =>
    (mode.value === "world_bloom" ? selectedWorldBloomCharacter.value?.chapterStartAt : null)
    ?? selectedEvent.value?.startAt
    ?? null,
  )
  const selectedActivityEndAt = computed(() =>
    (mode.value === "world_bloom" ? selectedWorldBloomCharacter.value?.aggregateAt : null)
    ?? selectedEvent.value?.aggregateAt
    ?? selectedEvent.value?.closedAt
    ?? null,
  )
  const cardById = computed<Map<number, RankBorderMasterCard>>(() => buildMasterRecordMap(masterOptions.cards.value))
  const honorById = computed<Map<number, RankBorderMasterHonor>>(() => buildMasterRecordMap(masterOptions.honors.value))
  const honorGroupById = computed<Map<number, RankBorderMasterHonorGroup>>(() =>
    buildMasterRecordMap(masterOptions.honorGroups.value),
  )
  const bondsHonorById = computed<Map<number, RankBorderMasterBondsHonor>>(() =>
    buildMasterRecordMap(masterOptions.bondsHonors.value),
  )
  const bondsHonorWordById = computed<Map<number, RankBorderMasterBondsHonorWord>>(() =>
    buildMasterRecordMap(masterOptions.bondsHonorWords.value),
  )
  const gameCharacterUnitById = computed<Map<number, RankBorderMasterGameCharacterUnit>>(() =>
    buildMasterRecordMap(masterOptions.gameCharacterUnits.value),
  )
  const selectedIntervalSeconds = computed(() => normalizePositiveInteger(intervalSeconds.value, Number(DEFAULT_INTERVAL_SECONDS)))
  const selectedEventIdNumber = computed(() => normalizePositiveInteger(selectedEventId.value, 0))
  const selectedWorldBloomCharacterIdNumber = computed(() =>
    normalizePositiveInteger(selectedWorldBloomCharacterId.value, 0),
  )
  const trackerEndpointReady = computed(() => normalizeTrackerEndpoint(trackerEndpoint.value) !== "")

  const isSelectedWorldBloomEvent = computed(() => selectedEvent.value?.isWorldBloom === true)

  const modeOptions = computed(() => {
    const options = [{ value: "normal" as const, label: t("rankBorder.modes.normal") }]
    if (isSelectedWorldBloomEvent.value) {
      options.push({ value: "world_bloom" as const, label: t("rankBorder.modes.worldBloom") })
    }
    return options
  })

  const intervalOptions = computed(() => [
    { value: "900", label: t("rankBorder.intervals.minutes", { value: 15 }) },
    { value: "3600", label: t("rankBorder.intervals.hours", { value: 1 }) },
    { value: "21600", label: t("rankBorder.intervals.hours", { value: 6 }) },
    { value: "86400", label: t("rankBorder.intervals.hours", { value: 24 }) },
  ])

  watch(
    () => masterOptions.eventOptions.value,
    (options) => {
      if (options.length === 0) {
        selectedEventId.value = null
        return
      }

      if (!selectedEventId.value || !options.some((option) => option.value === selectedEventId.value)) {
        selectedEventId.value = resolveDefaultEventId(options)
      }
    },
    { immediate: true },
  )

  watch(
    () => masterOptions.worldBloomCharacterOptions.value,
    (options) => {
      if (mode.value !== "world_bloom") {
        return
      }

      if (options.length === 0) {
        selectedWorldBloomCharacterId.value = null
        return
      }

      if (!selectedWorldBloomCharacterId.value || !options.some((option) => option.value === selectedWorldBloomCharacterId.value)) {
        selectedWorldBloomCharacterId.value = resolveDefaultWorldBloomCharacterId(options)
      }
    },
    { immediate: true },
  )

  watch(mode, () => {
    if (mode.value === "world_bloom" && !selectedWorldBloomCharacterId.value) {
      selectedWorldBloomCharacterId.value = resolveDefaultWorldBloomCharacterId(masterOptions.worldBloomCharacterOptions.value)
    }
  })

  watch(isSelectedWorldBloomEvent, (isWorldBloom) => {
    if (!isWorldBloom && mode.value === "world_bloom") {
      mode.value = "normal"
      selectedWorldBloomCharacterId.value = null
    }
  })

  watch(
    [
      trackerEndpoint,
      selectedRegion,
      selectedEventId,
      mode,
      selectedWorldBloomCharacterId,
      intervalSeconds,
      selectedAccountKey,
      hideProfileAssets,
    ],
    persistState,
  )

  watch(
    accountOptions,
    (options) => {
      if (options.length === 0) {
        selectedAccountKey.value = ""
        return
      }

      if (!selectedAccount.value) {
        const sameRegionAccount = options.find((account) => account.server === selectedRegion.value)
        selectedAccountKey.value = (sameRegionAccount ?? options[0]).key
      }
    },
    { immediate: true },
  )

  function updateRegion(value: AcceptableValue) {
    if (typeof value === "string" && isSekaiRegionValue(value)) {
      switchRegion(value)
    }
  }

  function updateMode(value: AcceptableValue) {
    if (value === "normal" || value === "world_bloom") {
      mode.value = value
    }
  }

  function updateInterval(value: AcceptableValue) {
    if (typeof value === "string" && normalizePositiveInteger(value, 0) > 0) {
      intervalSeconds.value = value
    }
  }

  function updateEvent(value: string | null) {
    if (selectedEventId.value !== value) {
      selectedWorldBloomCharacterId.value = null
    }
    selectedEventId.value = value
  }

  function updateWorldBloomCharacter(value: AcceptableValue) {
    selectedWorldBloomCharacterId.value = typeof value === "string" ? value : null
  }

  function updateAccount(value: AcceptableValue) {
    selectedAccountKey.value = typeof value === "string" ? value : ""
    const account = selectedAccount.value
    if (!account) {
      return
    }

    switchRegion(account.server)
  }

  function switchRegion(region: SekaiRegion) {
    if (region === selectedRegion.value) {
      return
    }

    selectedRegion.value = region
    selectedEventId.value = null
    selectedWorldBloomCharacterId.value = null
    mode.value = "normal"
  }

  function persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        endpoint: trackerEndpoint.value,
        region: selectedRegion.value,
        eventId: selectedEventId.value,
        mode: mode.value,
        worldBloomCharacterId: selectedWorldBloomCharacterId.value,
        intervalSeconds: intervalSeconds.value,
        accountKey: selectedAccountKey.value,
        hideProfileAssets: hideProfileAssets.value,
      } satisfies PersistedState))
    } catch {
    }
  }

  function readPersistedState(): PersistedState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        return {}
      }

      const parsed = JSON.parse(raw) as PersistedState
      return typeof parsed === "object" && parsed ? parsed : {}
    } catch {
      return {}
    }
  }

  function resolveInitialTrackerEndpoint(endpoint: string | undefined) {
    const normalized = normalizeTrackerEndpoint(endpoint)
    if (!normalized || LEGACY_DIRECT_TRACKER_ENDPOINTS.has(normalized)) {
      return DEFAULT_TRACKER_ENDPOINT
    }

    return normalized
  }

  function resolveDefaultEventId(options: Array<{ value: string; startAt: number | null; aggregateAt: number | null }>): string | null {
    const now = Math.floor(Date.now() / 1000)
    const active = options.find((option) =>
      option.startAt != null
      && option.aggregateAt != null
      && option.startAt <= now
      && option.aggregateAt >= now,
    )

    return active?.value ?? options[0]?.value ?? null
  }

  function resolveDefaultWorldBloomCharacterId(
    options: Array<{ value: string; active?: boolean; chapterStartAt: number | null; aggregateAt: number | null }>,
  ): string | null {
    const active = options.find((option) => option.active)
    if (active) {
      return active.value
    }

    const now = Math.floor(Date.now() / 1000)
    const started = options
      .filter((option) => option.chapterStartAt != null && option.chapterStartAt <= now)
      .sort((a, b) => (b.chapterStartAt ?? 0) - (a.chapterStartAt ?? 0))

    return started[0]?.value ?? options[0]?.value ?? null
  }

  function isSekaiRegionValue(value: string): value is SekaiRegion {
    return SEKAI_REGION_OPTIONS.some((option) => option.value === value)
  }

  function normalizePositiveInteger(value: unknown, fallback: number): number {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
  }

  function formatTimestamp(timestamp: number | null | undefined) {
    if (!timestamp) {
      return "-"
    }

    return new Date(timestamp * 1000).toLocaleString()
  }

  return {
    trackerEndpoint,
    selectedRegion,
    selectedEventId,
    mode,
    selectedWorldBloomCharacterId,
    intervalSeconds,
    selectedAccountKey,
    hideProfileAssets,
    masterOptions,
    eventComboboxOptions,
    accountOptions,
    selectedAccount,
    selectedEvent,
    selectedWorldBloomCharacter,
    selectedActivityStartAt,
    selectedActivityEndAt,
    cardById,
    honorById,
    honorGroupById,
    bondsHonorById,
    bondsHonorWordById,
    gameCharacterUnitById,
    selectedIntervalSeconds,
    selectedEventIdNumber,
    selectedWorldBloomCharacterIdNumber,
    isSelectedWorldBloomEvent,
    modeOptions,
    intervalOptions,
    trackerEndpointReady,
    updateRegion,
    updateMode,
    updateInterval,
    updateEvent,
    updateWorldBloomCharacter,
    updateAccount,
    switchRegion,
  }
}
