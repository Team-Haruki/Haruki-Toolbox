<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useI18n } from "vue-i18n"
import {
  LucideCalendarRange,
  LucideListMusic,
  LucidePlay,
  LucidePlus,
  LucideTrash2,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { resolveSekaiRegionLabel, SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import { formatGameAccountLabel } from "@/lib/game-account-display"
import { SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES } from "@/shared/sekai/worker-protocol"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { useSettingsStore } from "@/shared/stores/settings"
import { useUserStore } from "@/shared/stores/user"
import type { GameAccountBinding, SekaiRegion } from "@/types"
import CardThumbnail from "@/shared/components/SekaiCardThumbnail.vue"
import CharacterSelect from "../components/CharacterSelect.vue"
import EventSelect from "../components/EventSelect.vue"
import MusicSelect from "../components/MusicSelect.vue"
import { buildDeckResultViews, type DeckResultDeckView } from "../lib/card-thumbnail"
import {
  buildEventPlannerBoostRows,
  parseEventPlannerPointInput,
  resolveEventPlannerDailyPoint,
  resolveEventPlannerRemainingPoint,
} from "../lib/event-planner"
import type { DeckRecommendAlgorithm } from "../lib/recommend-options"
import type { DeckRecommendLiveBoostFields } from "../lib/recommend-results"
import { createDefaultCardTrainingConfig } from "../lib/training-config"
import { useDeckRecommendRunner } from "../composables/useDeckRecommendRunner"
import { useEventOptions } from "../composables/useEventOptions"
import { useMusicOptions } from "../composables/useMusicOptions"
import { useWorldBloomCharacterOptions } from "../composables/useWorldBloomCharacterOptions"

type BoundAccountOption = {
  key: string
  server: SekaiRegion
  uid: string
  label: string
  isDefault?: boolean
}

type EventPlannerSongRow = {
  id: number
  musicId: string | null
  difficulty: string | null
}

type EventPlannerRowResult = {
  status: "running" | "done" | "error"
  error: string | null
  basePoint: number | null
  deckView: DeckResultDeckView | null
}

const EVENT_PLANNER_DEFAULT_MUSIC_ID = "226"
const EVENT_PLANNER_DEFAULT_DIFFICULTY = "hard"
const EVENT_PLANNER_MAX_SONG_ROWS = 3

const { t, locale } = useI18n()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const sekaiDataStore = useSekaiDataStore()
const runner = useDeckRecommendRunner()

const selectedAccountKey = ref("")
const dataRegion = ref<SekaiRegion>("jp")
const selectedEventId = ref<string | null>(null)
const selectedEventType = ref<string | null>(null)
const selectedCharacterId = ref<string | null>(null)
const targetPointInput = ref("")
const currentPointInput = ref("")
let songRowIdSeed = 0
const songRows = ref<EventPlannerSongRow[]>([
  createSongRow(EVENT_PLANNER_DEFAULT_MUSIC_ID, EVENT_PLANNER_DEFAULT_DIFFICULTY),
])
const rowResults = ref<Record<number, EventPlannerRowResult>>({})
const planning = ref(false)

const eventOptions = useEventOptions(dataRegion)
const worldBloomCharacters = useWorldBloomCharacterOptions(dataRegion, selectedEventId)
const musicOptions = useMusicOptions(dataRegion, ref<string | null>(null))

const accountOptions = computed<BoundAccountOption[]>(() => {
  const accounts = Array.isArray(userStore.gameAccountBindings) ? userStore.gameAccountBindings : []
  return accounts.map((account) => createAccountOption(account))
})
const selectedAccount = computed(() =>
  accountOptions.value.find((account) => account.key === selectedAccountKey.value) ?? null,
)
const selectedAccountLabel = computed(() => selectedAccount.value?.label ?? "")

const currentRegionState = computed(() => sekaiDataStore.regionStates[dataRegion.value])
const dataReady = computed(() => currentRegionState.value.status === "ready")
const recommendDataReady = computed(() =>
  dataReady.value
  && currentRegionState.value.musicMetasUpdatedAt != null
  && SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES.every((fileName) => currentRegionState.value.files.includes(fileName)),
)

const selectedEventOption = computed(() =>
  eventOptions.options.value.find((option) => option.value === selectedEventId.value) ?? null,
)

const showWorldBloomCharacterSelect = computed(() => selectedEventType.value === "world_bloom")
const worldBloomCharacterSelectAllowNone = computed(() =>
  showWorldBloomCharacterSelect.value && !worldBloomCharacters.hasCharacters.value,
)
const worldBloomCharacterFallbackId = computed(() =>
  worldBloomCharacterSelectAllowNone.value
    ? null
    : selectedCharacterId.value != null
      ? Number(selectedCharacterId.value)
      : worldBloomCharacters.defaultCharacterId.value
        ?? worldBloomCharacters.characterIds.value[0]
        ?? null,
)
const activeCharacterId = computed(() => {
  if (!showWorldBloomCharacterSelect.value) {
    return null
  }

  if (worldBloomCharacterSelectAllowNone.value) {
    return selectedCharacterId.value
  }

  return worldBloomCharacterFallbackId.value == null ? null : String(worldBloomCharacterFallbackId.value)
})
const forcedLeaderCharacterId = computed(() =>
  showWorldBloomCharacterSelect.value && !worldBloomCharacters.hasCharacters.value ? activeCharacterId.value : null,
)
const characterSelectAllowedIds = computed<readonly number[] | null>(() =>
  worldBloomCharacters.characterIds.value.length > 0 ? worldBloomCharacters.characterIds.value : null,
)

const targetPoint = computed(() => parseEventPlannerPointInput(targetPointInput.value))
const currentPoint = computed(() => parseEventPlannerPointInput(currentPointInput.value))
const currentPointKnown = computed(() => currentPoint.value.value != null)
const remainingPoint = computed(() => {
  if (targetPoint.value.value == null) {
    return null
  }

  return resolveEventPlannerRemainingPoint(targetPoint.value.value, currentPoint.value.value ?? 0)
})
const hasEventSchedule = computed(() =>
  selectedEventOption.value?.startAt != null && selectedEventOption.value?.aggregateAt != null,
)
const dailyPoint = computed(() => {
  const option = selectedEventOption.value
  if (targetPoint.value.value == null || option?.startAt == null || option?.aggregateAt == null) {
    return null
  }

  return resolveEventPlannerDailyPoint({
    targetPoint: targetPoint.value.value,
    currentPoint: currentPoint.value.value ?? 0,
    currentPointKnown: currentPointKnown.value,
    startAt: option.startAt,
    aggregateAt: option.aggregateAt,
  })
})

const plannerAlgorithms = computed<DeckRecommendAlgorithm[]>(() =>
  selectedEventType.value === "world_bloom" ? ["dfs_ga"] : ["dfs"],
)

const canRun = computed(() => {
  if (planning.value || runner.running.value || !selectedAccount.value || !recommendDataReady.value) {
    return false
  }
  if (targetPoint.value.invalid || currentPoint.value.invalid || targetPoint.value.value == null) {
    return false
  }
  if (!selectedEventId.value || worldBloomCharacters.loading.value) {
    return false
  }
  if (showWorldBloomCharacterSelect.value && !worldBloomCharacterSelectAllowNone.value && !worldBloomCharacterFallbackId.value) {
    return false
  }
  return songRows.value.every((row) => row.musicId && row.difficulty)
})

const resultRows = computed(() =>
  songRows.value
    .map((row, index) => ({ row, index, result: rowResults.value[row.id] ?? null }))
    .filter((item): item is { row: EventPlannerSongRow; index: number; result: EventPlannerRowResult } =>
      item.result != null,
    ),
)

const summaryItems = computed(() => {
  if (targetPoint.value.value == null) {
    return []
  }

  return [
    {
      key: "target",
      label: t("eventPlanner.summary.targetPoint"),
      value: formatInteger(targetPoint.value.value),
    },
    {
      key: "current",
      label: t("eventPlanner.summary.currentPoint"),
      value: currentPointKnown.value
        ? formatInteger(currentPoint.value.value ?? 0)
        : t("eventPlanner.summary.currentUnknown"),
    },
    {
      key: "remaining",
      label: t("eventPlanner.summary.remainingPoint"),
      value: remainingPoint.value == null ? "-" : formatInteger(remainingPoint.value),
    },
    {
      key: "daily",
      label: t("eventPlanner.summary.dailyPoint"),
      value: dailyPoint.value == null ? "-" : formatInteger(dailyPoint.value),
    },
  ]
})

watch(
  accountOptions,
  (accounts) => {
    if (accounts.length === 0) {
      selectedAccountKey.value = ""
      return
    }
    if (!accounts.some((account) => account.key === selectedAccountKey.value)) {
      selectedAccountKey.value = (accounts.find((account) => account.isDefault) ?? accounts[0]).key
    }
  },
  { immediate: true },
)

watch(
  selectedAccount,
  (account) => {
    if (account && account.server !== dataRegion.value) {
      dataRegion.value = account.server
    }
    ensureRegionMasterData()
  },
  { immediate: true },
)

watch(dataRegion, () => {
  selectedEventId.value = null
  selectedEventType.value = null
  selectedCharacterId.value = null
  clearAllRowResults()
  ensureRegionMasterData()
})

watch(
  () => [selectedAccountKey.value, selectedEventId.value, selectedCharacterId.value].join(":"),
  () => {
    clearAllRowResults()
  },
)

watch(
  () => [
    dataRegion.value,
    recommendDataReady.value,
    selectedAccount.value?.server ?? "",
  ].join(":"),
  () => {
    if (recommendDataReady.value) {
      void runner.preloadRegionData(dataRegion.value, selectedAccount.value?.server ?? dataRegion.value).catch(() => undefined)
    }
  },
  { immediate: true },
)

onMounted(() => {
  ensureRegionMasterData()
  void runner.preloadEngine().catch(() => undefined)
})

onBeforeUnmount(() => {
  void runner.disposeEngine().catch(() => undefined)
})

function createSongRow(musicId: string | null = null, difficulty: string | null = null): EventPlannerSongRow {
  songRowIdSeed += 1
  return { id: songRowIdSeed, musicId, difficulty }
}

function createAccountOption(account: GameAccountBinding): BoundAccountOption {
  const uid = String(account.userId)
  return {
    key: `${account.server}:${uid}`,
    server: account.server,
    uid,
    isDefault: account.isDefault === true,
    label: formatGameAccountLabel({
      regionLabel: resolveSekaiRegionLabel(account.server, t),
      uid,
      hideUid: settingsStore.hideGameUserId,
    }),
  }
}

function updateAccount(value: AcceptableValue) {
  selectedAccountKey.value = typeof value === "string" ? value : ""
}

function updateDataRegion(value: AcceptableValue) {
  if (typeof value === "string" && SEKAI_REGION_OPTIONS.some((option) => option.value === value)) {
    dataRegion.value = value as SekaiRegion
  }
}

function ensureRegionMasterData() {
  void sekaiDataStore.ensureRegionData(dataRegion.value, {
    files: [...SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES],
  })
  const accountRegion = selectedAccount.value?.server
  if (accountRegion && accountRegion !== dataRegion.value) {
    void sekaiDataStore.ensureRegionData(accountRegion, { files: ["honors"] })
  }
}

function addSongRow() {
  if (songRows.value.length >= EVENT_PLANNER_MAX_SONG_ROWS) {
    return
  }
  songRows.value = [...songRows.value, createSongRow()]
}

function removeSongRow(rowId: number) {
  if (songRows.value.length <= 1) {
    return
  }
  songRows.value = songRows.value.filter((row) => row.id !== rowId)
  clearRowResult(rowId)
}

function updateRowMusic(row: EventPlannerSongRow, musicId: string | null) {
  row.musicId = musicId
  clearRowResult(row.id)
}

function updateRowDifficulty(row: EventPlannerSongRow, difficulty: string | null) {
  row.difficulty = difficulty
  clearRowResult(row.id)
}

function clearRowResult(rowId: number) {
  if (rowResults.value[rowId] == null) {
    return
  }
  const next = { ...rowResults.value }
  delete next[rowId]
  rowResults.value = next
}

function clearAllRowResults() {
  rowResults.value = {}
}

function setRowResult(rowId: number, result: EventPlannerRowResult) {
  rowResults.value = { ...rowResults.value, [rowId]: result }
}

async function runPlanner() {
  if (!canRun.value) {
    return
  }

  planning.value = true
  clearAllRowResults()
  try {
    for (const row of [...songRows.value]) {
      setRowResult(row.id, { status: "running", error: null, basePoint: null, deckView: null })
      try {
        await runner.run({
          account: selectedAccount.value,
          dataRegion: dataRegion.value,
          mode: "event",
          target: "score",
          liveType: "multi",
          algorithms: plannerAlgorithms.value,
          executionMode: "sequential",
          eventId: selectedEventId.value,
          characterId: forcedLeaderCharacterId.value ? null : activeCharacterId.value,
          forcedLeaderCharacterId: forcedLeaderCharacterId.value,
          eventSimulation: {
            enabled: false,
            eventType: "marathon",
            attr: null,
            unit: null,
            worldBloomTurn: null,
            worldBloomCharacterId: null,
            worldBloomCharacterUnit: null,
          },
          targetBonuses: [],
          customBonusAttr: null,
          customBonusCharacterIds: [],
          customBonusCharacterSupportUnits: {},
          filterOtherUnit: false,
          multiLiveTeammatePower: null,
          multiLiveTeammateScoreUp: null,
          multiLiveScoreUpLowerBound: null,
          // Boost stays unset so the engine returns the base per-play score;
          // boost multipliers are applied by buildEventPlannerBoostRows only.
          boost: null,
          areaItemLevel: null,
          areaItemLevelOverrides: [],
          characterRank: null,
          characterRankOverrides: [],
          mysekaiGateLevel: null,
          mysekaiGateLevelOverrides: [],
          mysekaiFixtureBonusRate: null,
          mysekaiFixtureBonusRateOverrides: [],
          resultLimit: 1,
          timeoutMs: null,
          unitFilters: [],
          attrFilters: [],
          characterFilters: [],
          fixedCards: [],
          useCurrentDeck: false,
          fixedCharacters: [],
          excludedCards: [],
          singleCardOverrides: [],
          skillOrderStrategy: "average",
          skillReferenceStrategy: "average",
          specificSkillOrder: [],
          keepAfterTrainingState: false,
          supportMasterMax: false,
          supportSkillMax: false,
          musicId: row.musicId,
          difficulty: row.difficulty,
          trainingConfig: createDefaultCardTrainingConfig(),
        })
        const deckViews = buildDeckResultViews(
          runner.result.value,
          runner.masterData.value,
          dataRegion.value,
          settingsStore.currentAssetEndpoint,
        )
        const topDeck = deckViews[0] ?? null
        const basePoint = topDeck ? resolveDeckBasePoint(topDeck.deck) : null
        if (!topDeck || basePoint == null || basePoint <= 0) {
          setRowResult(row.id, {
            status: "error",
            error: t("eventPlanner.errors.noResult"),
            basePoint: null,
            deckView: null,
          })
          continue
        }
        setRowResult(row.id, { status: "done", error: null, basePoint, deckView: topDeck })
      } catch (error) {
        setRowResult(row.id, {
          status: "error",
          error: runner.error.value ?? (error instanceof Error ? error.message : String(error)),
          basePoint: null,
          deckView: null,
        })
      }
    }
  } finally {
    planning.value = false
  }
}

function resolveDeckBasePoint(deck: DeckResultDeckView["deck"]): number | null {
  const boosted = deck as DeckResultDeckView["deck"] & DeckRecommendLiveBoostFields
  const originalScore = Number(boosted.live_boost_original_score)
  if (Number.isFinite(originalScore) && originalScore > 0) {
    return originalScore
  }

  const score = Number(deck.score)
  return Number.isFinite(score) ? score : null
}

function rowBoostRows(rowId: number) {
  const result = rowResults.value[rowId]
  if (result?.basePoint == null) {
    return []
  }

  return buildEventPlannerBoostRows(result.basePoint, remainingPoint.value ?? 0)
}

function rowDeckBonusTotal(deckView: DeckResultDeckView) {
  return (Number(deckView.deck.event_bonus_rate) || 0) + (Number(deckView.deck.support_deck_bonus_rate) || 0)
}

function songRowTitle(row: EventPlannerSongRow, index: number) {
  const musicLabel = row.musicId
    ? musicOptions.options.value.find((option) => option.value === row.musicId)?.label ?? `#${row.musicId}`
    : null
  return musicLabel
    ? `${t("eventPlanner.songs.rowTitle", { index: index + 1 })} · ${musicLabel}`
    : t("eventPlanner.songs.rowTitle", { index: index + 1 })
}

function formatInteger(value: number | undefined) {
  return new Intl.NumberFormat(locale.value, {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function formatPercentValue(value: number) {
  return new Intl.NumberFormat(locale.value, {
    maximumFractionDigits: 2,
  }).format(value)
}
</script>

<template>
  <div class="flex w-full flex-1 flex-col items-center justify-center px-0 py-4">
    <div class="mx-auto w-full max-w-6xl space-y-3 sm:space-y-4">
      <Card class="gap-3 rounded-lg py-3 xl:gap-6 xl:rounded-xl xl:py-6">
        <CardHeader class="px-2 sm:px-4 xl:px-6">
          <CardTitle class="flex items-center gap-2 text-lg">
            <LucideCalendarRange class="size-5" />
            {{ t("eventPlanner.title") }}
          </CardTitle>
          <CardDescription>{{ t("eventPlanner.description") }}</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-3 px-2 pb-2 sm:px-4 sm:pb-4 xl:gap-5 xl:px-6 xl:pb-6">
          <section class="grid gap-3 rounded-md border bg-muted/10 p-2.5 sm:p-3 xl:rounded-lg xl:p-4">
            <div class="space-y-1">
              <h2 class="text-base font-semibold">{{ t("eventPlanner.sections.setup.title") }}</h2>
              <p class="text-sm text-muted-foreground">{{ t("eventPlanner.sections.setup.description") }}</p>
            </div>

            <div class="grid gap-3 sm:gap-4 lg:grid-cols-2">
              <div class="grid gap-2">
                <Label>{{ t("deckRecommend.form.account") }}</Label>
                <Select :model-value="selectedAccountKey" :disabled="accountOptions.length === 0" @update:model-value="updateAccount">
                  <SelectTrigger class="w-full">
                    <SelectValue :key="`account-value-${selectedAccountLabel}`" :placeholder="t('deckRecommend.form.accountPlaceholder')">
                      {{ selectedAccountLabel }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="account in accountOptions" :key="account.key" :value="account.key">
                      {{ account.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p v-if="accountOptions.length === 0" class="text-xs text-muted-foreground">
                  {{ t("deckRecommend.form.noAccount") }}
                </p>
              </div>

              <div class="grid gap-2">
                <Label>{{ t("deckRecommend.form.dataRegion") }}</Label>
                <Select :model-value="dataRegion" @update:model-value="updateDataRegion">
                  <SelectTrigger class="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="option in SEKAI_REGION_OPTIONS" :key="option.value" :value="option.value">
                      {{ resolveSekaiRegionLabel(option.value, t) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="grid gap-2">
                <Label>{{ t("deckRecommend.form.event") }}</Label>
                <EventSelect
                  v-model="selectedEventId"
                  v-model:event-type="selectedEventType"
                  :region="dataRegion"
                  :disabled="!dataReady"
                />
              </div>

              <div v-if="showWorldBloomCharacterSelect" class="grid gap-2">
                <Label>{{ t("deckRecommend.form.character") }}</Label>
                <CharacterSelect
                  v-model="selectedCharacterId"
                  :region="dataRegion"
                  :allowed-character-ids="characterSelectAllowedIds"
                  :allow-none-option="worldBloomCharacterSelectAllowNone"
                  :disabled="!dataReady || worldBloomCharacters.loading.value"
                />
              </div>
            </div>
          </section>

          <section class="grid gap-3 rounded-md border bg-muted/10 p-2.5 sm:p-3 xl:rounded-lg xl:p-4">
            <div class="space-y-1">
              <h2 class="text-base font-semibold">{{ t("eventPlanner.sections.targets.title") }}</h2>
              <p class="text-sm text-muted-foreground">{{ t("eventPlanner.sections.targets.description") }}</p>
            </div>

            <div class="grid gap-3 sm:gap-4 lg:grid-cols-2">
              <div class="grid gap-2">
                <Label>{{ t("eventPlanner.form.targetPoint") }}</Label>
                <Input
                  v-model="targetPointInput"
                  type="text"
                  inputmode="text"
                  :placeholder="t('eventPlanner.form.targetPointPlaceholder')"
                  :disabled="planning"
                />
                <p v-if="targetPoint.invalid" class="text-xs text-destructive">
                  {{ t("eventPlanner.form.invalidPoint") }}
                </p>
                <p v-else-if="targetPoint.value != null" class="text-xs text-muted-foreground">
                  {{ t("eventPlanner.form.parsedValue", { value: formatInteger(targetPoint.value) }) }}
                </p>
              </div>

              <div class="grid gap-2">
                <Label>{{ t("eventPlanner.form.currentPoint") }}</Label>
                <Input
                  v-model="currentPointInput"
                  type="text"
                  inputmode="text"
                  :placeholder="t('eventPlanner.form.currentPointPlaceholder')"
                  :disabled="planning"
                />
                <p v-if="currentPoint.invalid" class="text-xs text-destructive">
                  {{ t("eventPlanner.form.invalidPoint") }}
                </p>
                <p v-else-if="currentPoint.value != null" class="text-xs text-muted-foreground">
                  {{ t("eventPlanner.form.parsedValue", { value: formatInteger(currentPoint.value) }) }}
                </p>
                <p v-else class="text-xs text-muted-foreground">
                  {{ t("eventPlanner.form.currentPointHint") }}
                </p>
              </div>
            </div>
          </section>

          <section class="grid gap-3 rounded-md border bg-muted/10 p-2.5 sm:p-3 xl:rounded-lg xl:p-4">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div class="space-y-1">
                <h2 class="flex items-center gap-2 text-base font-semibold">
                  <LucideListMusic class="size-4" />
                  {{ t("eventPlanner.sections.songs.title") }}
                </h2>
                <p class="text-sm text-muted-foreground">{{ t("eventPlanner.sections.songs.description") }}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                class="shrink-0"
                :disabled="planning || songRows.length >= EVENT_PLANNER_MAX_SONG_ROWS"
                @click="addSongRow"
              >
                <LucidePlus class="size-4" />
                {{ t("eventPlanner.songs.add") }}
              </Button>
            </div>

            <div
              v-for="(row, index) in songRows"
              :key="row.id"
              class="grid gap-2 rounded-md border bg-background/60 p-2.5 sm:p-3"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-sm font-medium">{{ t("eventPlanner.songs.rowTitle", { index: index + 1 }) }}</span>
                <Button
                  v-if="songRows.length > 1"
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="text-muted-foreground"
                  :disabled="planning"
                  :aria-label="t('eventPlanner.songs.remove')"
                  @click="removeSongRow(row.id)"
                >
                  <LucideTrash2 class="size-4" />
                </Button>
              </div>
              <MusicSelect
                :model-value="row.musicId"
                :difficulty-value="row.difficulty"
                :region="dataRegion"
                :disabled="planning || !dataReady"
                @update:model-value="value => updateRowMusic(row, value)"
                @update:difficulty-value="value => updateRowDifficulty(row, value)"
              />
            </div>
          </section>

          <div class="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-muted-foreground">
              {{
                planning && runner.phase.value
                  ? t(`deckRecommend.runner.phases.${runner.phase.value}`)
                  : t("eventPlanner.runner.ready")
              }}
            </p>
            <Button type="button" :disabled="!canRun" @click="runPlanner">
              <LucidePlay class="size-4" />
              {{ planning ? t("eventPlanner.runner.running") : t("eventPlanner.runner.run") }}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card v-if="summaryItems.length > 0" class="gap-3 rounded-lg py-3 xl:gap-6 xl:rounded-xl xl:py-6">
        <CardHeader class="px-2 sm:px-4 xl:px-6">
          <CardTitle class="text-base">{{ t("eventPlanner.summary.title") }}</CardTitle>
          <CardDescription>{{ t("eventPlanner.summary.description") }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-2 px-2 pb-2 sm:px-4 sm:pb-4 xl:px-6 xl:pb-6">
          <div class="grid grid-cols-2 gap-1.5 sm:gap-2 lg:grid-cols-4">
            <div
              v-for="item in summaryItems"
              :key="item.key"
              class="rounded-md bg-muted/20 px-2 py-1.5 ring-1 ring-border/40 sm:px-3 sm:py-2"
            >
              <span class="block text-xs text-muted-foreground">{{ item.label }}</span>
              <span class="block font-mono text-sm font-semibold sm:text-base">{{ item.value }}</span>
            </div>
          </div>
          <p v-if="remainingPoint === 0" class="text-xs text-muted-foreground">
            {{ t("eventPlanner.summary.reached") }}
          </p>
          <p v-if="!hasEventSchedule" class="text-xs text-muted-foreground">
            {{ t("eventPlanner.summary.noEventSchedule") }}
          </p>
          <p v-else class="text-xs text-muted-foreground">
            {{ t("eventPlanner.summary.dailyHint") }}
          </p>
        </CardContent>
      </Card>

      <Card v-if="resultRows.length > 0" class="gap-3 rounded-lg py-3 xl:gap-6 xl:rounded-xl xl:py-6">
        <CardHeader class="px-2 sm:px-4 xl:px-6">
          <CardTitle class="text-base">{{ t("eventPlanner.result.title") }}</CardTitle>
          <CardDescription>{{ t("eventPlanner.result.description") }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3 px-2 pb-2 sm:px-4 sm:pb-4 xl:px-6 xl:pb-6">
          <section
            v-for="item in resultRows"
            :key="item.row.id"
            class="overflow-hidden rounded-md border bg-background/80 shadow-sm"
          >
            <div class="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/10 px-2.5 py-2 sm:px-3">
              <span class="text-sm font-semibold">{{ songRowTitle(item.row, item.index) }}</span>
              <span
                v-if="item.result.basePoint != null"
                class="rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
              >
                {{ t("eventPlanner.result.basePoint", { value: formatInteger(item.result.basePoint) }) }}
              </span>
            </div>

            <div v-if="item.result.status === 'running'" class="p-3 text-sm text-muted-foreground">
              {{ t("eventPlanner.result.running") }}
            </div>
            <div
              v-else-if="item.result.status === 'error'"
              class="m-2.5 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive sm:m-3"
            >
              {{ item.result.error }}
            </div>
            <div v-else class="space-y-3 p-2.5 sm:p-3">
              <div
                v-if="item.result.deckView"
                class="grid gap-2 rounded-md bg-muted/10 p-2 ring-1 ring-border/50 sm:p-3"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-sm font-medium">{{ t("eventPlanner.result.deckTitle") }}</span>
                  <span class="rounded-md bg-muted/45 px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {{ t("eventPlanner.result.deckPower") }}
                    <span class="font-mono font-semibold text-foreground">
                      {{ formatInteger(item.result.deckView.deck.total_power) }}
                    </span>
                  </span>
                  <span class="rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                    {{ t("eventPlanner.result.deckBonus", { value: formatPercentValue(rowDeckBonusTotal(item.result.deckView)) }) }}
                  </span>
                </div>
                <div class="grid w-full max-w-[41rem] grid-cols-5 content-center justify-items-center gap-0.5 rounded bg-muted/20 p-0.5 ring-1 ring-border/60 sm:gap-1 sm:rounded-md">
                  <CardThumbnail
                    v-for="cardView in item.result.deckView.cards"
                    :key="cardView.card.card_id"
                    :thumbnail="cardView.thumbnail"
                    size="fluid"
                  />
                </div>
              </div>

              <div class="overflow-x-auto rounded-md ring-1 ring-border/50">
                <table class="w-full min-w-[26rem] border-collapse text-sm">
                  <thead>
                    <tr class="bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                      <th class="px-2.5 py-2 font-medium sm:px-3">{{ t("eventPlanner.result.table.boost") }}</th>
                      <th class="px-2.5 py-2 font-medium sm:px-3">{{ t("eventPlanner.result.table.pointPerPlay") }}</th>
                      <th class="px-2.5 py-2 font-medium sm:px-3">{{ t("eventPlanner.result.table.plays") }}</th>
                      <th class="px-2.5 py-2 font-medium sm:px-3">{{ t("eventPlanner.result.table.energy") }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="boostRow in rowBoostRows(item.row.id)"
                      :key="boostRow.boost"
                      class="border-t border-border/50"
                    >
                      <td class="px-2.5 py-1.5 font-mono sm:px-3">{{ boostRow.boost }}</td>
                      <td class="px-2.5 py-1.5 font-mono sm:px-3">{{ formatInteger(boostRow.pointPerPlay) }}</td>
                      <td class="px-2.5 py-1.5 font-mono sm:px-3">{{ formatInteger(boostRow.plays) }}</td>
                      <td class="px-2.5 py-1.5 font-mono sm:px-3">{{ formatInteger(boostRow.energy) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-if="remainingPoint === 0" class="text-xs text-muted-foreground">
                {{ t("eventPlanner.result.remainingZeroHint") }}
              </p>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
