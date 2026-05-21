<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useI18n } from "vue-i18n"
import {
  LucideGamepad2,
  LucideInfo,
  LucidePlay,
  LucideSettings2,
} from "lucide-vue-next"
import { toast } from "vue-sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { resolveSekaiRegionLabel, SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import { SEKAI_DATA_RECOMMEND_MASTER_FILES } from "@/shared/sekai/worker-protocol"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { useUserStore } from "@/shared/stores/user"
import type { GameAccountBinding, SekaiRegion } from "@/types"
import CardThumbnail from "../components/CardThumbnail.vue"
import CardTrainingConfigTable from "../components/CardTrainingConfigTable.vue"
import CharacterSelect from "../components/CharacterSelect.vue"
import EventSelect from "../components/EventSelect.vue"
import MusicSelect from "../components/MusicSelect.vue"
import { buildDeckResultViews, type DeckResultDeckView } from "../lib/card-thumbnail"
import {
  type DeckRecommendAlgorithm,
  type DeckRecommendLiveType,
  type DeckRecommendMode,
} from "../lib/recommend-options"
import { createDefaultCardTrainingConfig } from "../lib/training-config"
import {
  useDeckRecommendRunner,
  type DeckRecommendExecutionMode,
} from "../composables/useDeckRecommendRunner"
import { useWorldBloomCharacterOptions } from "../composables/useWorldBloomCharacterOptions"

type BoundAccountOption = {
  key: string
  server: SekaiRegion
  uid: string
  label: string
}

const DEFAULT_MUSIC_ID = "74"
const DEFAULT_MUSIC_DIFFICULTY = "expert"
const DEFAULT_ALGORITHMS: DeckRecommendAlgorithm[] = ["dfs_ga", "ga", "rl"]
const DECK_RECOMMEND_PREFERENCES_STORAGE_KEY = "haruki:deck-recommend:preferences"
const DECK_RECOMMEND_EXECUTION_MODES: DeckRecommendExecutionMode[] = ["sequential", "parallel"]

const { t, locale } = useI18n()
const userStore = useUserStore()
const sekaiDataStore = useSekaiDataStore()
const runner = useDeckRecommendRunner()
const initialPreferences = readDeckRecommendPreferences()

const selectedAccountKey = ref("")
const dataRegion = ref<SekaiRegion>("jp")
const recommendMode = ref<DeckRecommendMode>("event")
const liveType = ref<DeckRecommendLiveType>("multi")
const selectedAlgorithms = ref<DeckRecommendAlgorithm[]>(initialPreferences.algorithms ?? [...DEFAULT_ALGORITHMS])
const executionMode = ref<DeckRecommendExecutionMode>(initialPreferences.executionMode ?? "sequential")
const selectedEventId = ref<string | null>(null)
const selectedEventType = ref<string | null>(null)
const selectedCharacterId = ref<string | null>(null)
const selectedMusicId = ref<string | null>(DEFAULT_MUSIC_ID)
const selectedDifficulty = ref<string | null>(DEFAULT_MUSIC_DIFFICULTY)
const trainingConfig = ref(createDefaultCardTrainingConfig())
const worldBloomCharacters = useWorldBloomCharacterOptions(dataRegion, selectedEventId)
let dataPreloadGeneration = 0
let dataPreloadSignature = ""

const accountOptions = computed<BoundAccountOption[]>(() => {
  const accounts = Array.isArray(userStore.gameAccountBindings) ? userStore.gameAccountBindings : []
  return accounts.map((account) => createAccountOption(account))
})

const selectedAccount = computed(() => {
  return accountOptions.value.find((account) => account.key === selectedAccountKey.value) ?? null
})

const currentRegionState = computed(() => sekaiDataStore.regionStates[dataRegion.value])
const dataReady = computed(() => currentRegionState.value.status === "ready")
const recommendDataReady = computed(() =>
  dataReady.value
  && currentRegionState.value.musicMetasUpdatedAt != null
  && hasRequiredFiles(currentRegionState.value.files, SEKAI_DATA_RECOMMEND_MASTER_FILES),
)
const resultDecks = computed(() => buildDeckResultViews(runner.result.value, runner.masterData.value, dataRegion.value))
const showResultCard = computed(() =>
  runner.error.value != null || runner.elapsedMs.value != null || resultDecks.value.length > 0,
)
const resultTimingItems = computed<Array<{ key: string; label: string; elapsedMs: number; class: string }>>(() => {
  const items: Array<{ key: string; label: string; elapsedMs: number; class: string }> = []
  if (runner.dataElapsedMs.value != null) {
    items.push({
      key: "data",
      label: t("deckRecommend.result.dataElapsed"),
      elapsedMs: runner.dataElapsedMs.value,
      class: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
    })
  }
  if (runner.engineDataElapsedMs.value != null) {
    items.push({
      key: "engine-data",
      label: t("deckRecommend.result.engineDataElapsed"),
      elapsedMs: runner.engineDataElapsedMs.value,
      class: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
    })
  }
  if (runner.recommendElapsedMs.value != null) {
    items.push({
      key: "recommend",
      label: recommendElapsedTimingLabel(runner.resultExecutionMode.value),
      elapsedMs: runner.recommendElapsedMs.value,
      class: "border-lime-200 bg-lime-50 text-lime-800 dark:border-lime-500/30 dark:bg-lime-500/10 dark:text-lime-200",
    })
  }

  return items
})
const isEventLikeMode = computed(() =>
  recommendMode.value === "event" || recommendMode.value === "bonus" || recommendMode.value === "mysekai",
)
const showWorldBloomCharacterSelect = computed(() =>
  isEventLikeMode.value && worldBloomCharacters.hasCharacters.value,
)
const showCharacterSelect = computed(() =>
  recommendMode.value === "challenge" || showWorldBloomCharacterSelect.value,
)
const characterSelectAllowedIds = computed<readonly number[] | null>(() =>
  recommendMode.value === "challenge" ? null : worldBloomCharacters.characterIds.value,
)
const activeCharacterId = computed(() => showCharacterSelect.value ? selectedCharacterId.value : null)
const canRunRecommend = computed(() => {
  if (runner.running.value || !selectedAccount.value || !recommendDataReady.value || selectedAlgorithms.value.length === 0) {
    return false
  }
  if (!selectedMusicId.value || !selectedDifficulty.value) {
    return false
  }
  if (recommendMode.value === "challenge") {
    return Boolean(selectedCharacterId.value)
  }
  if (isEventLikeMode.value && worldBloomCharacters.loading.value) {
    return false
  }
  if (showWorldBloomCharacterSelect.value) {
    return Boolean(selectedCharacterId.value)
  }
  if (recommendMode.value === "event" || recommendMode.value === "bonus" || recommendMode.value === "mysekai") {
    return Boolean(selectedEventId.value)
  }
  return true
})

const modeOptions = computed<Array<{ value: DeckRecommendMode; label: string }>>(() => [
  { value: "event", label: t("deckRecommend.modes.event") },
  { value: "challenge", label: t("deckRecommend.modes.challenge") },
  { value: "bonus", label: t("deckRecommend.modes.bonus") },
  { value: "mysekai", label: t("deckRecommend.modes.mysekai") },
  { value: "max-power", label: t("deckRecommend.modes.maxPower") },
  { value: "max-skill", label: t("deckRecommend.modes.maxSkill") },
])

const liveTypeOptions = computed<Array<{ value: DeckRecommendLiveType; label: string }>>(() => [
  { value: "solo", label: t("deckRecommend.liveTypes.solo") },
  { value: "multi", label: t("deckRecommend.liveTypes.multi") },
  { value: "auto", label: t("deckRecommend.liveTypes.auto") },
  { value: "cheerful", label: t("deckRecommend.liveTypes.cheerful") },
])

const algorithmOptions = computed<Array<{ value: DeckRecommendAlgorithm; label: string }>>(() => [
  { value: "dfs_ga", label: t("deckRecommend.algorithms.dfsGa") },
  { value: "ga", label: t("deckRecommend.algorithms.ga") },
  { value: "rl", label: t("deckRecommend.algorithms.rl") },
])

const executionModeOptions = computed<Array<{ value: DeckRecommendExecutionMode; label: string }>>(() => [
  { value: "sequential", label: t("deckRecommend.executionModes.sequential") },
  { value: "parallel", label: t("deckRecommend.executionModes.parallel") },
])

watch(
  accountOptions,
  (accounts) => {
    if (accounts.length === 0) {
      selectedAccountKey.value = ""
      return
    }

    if (!accounts.some((account) => account.key === selectedAccountKey.value)) {
      selectedAccountKey.value = accounts[0].key
    }
  },
  { immediate: true },
)

watch(
  selectedAccount,
  (account) => {
    if (account) {
      dataRegion.value = account.server
    }
  },
  { immediate: true },
)

watch(dataRegion, () => {
  invalidateDataPreload()
  selectedEventId.value = null
  selectedEventType.value = null
  selectedCharacterId.value = null
  selectedMusicId.value = DEFAULT_MUSIC_ID
  selectedDifficulty.value = DEFAULT_MUSIC_DIFFICULTY
  runner.reset()
  checkDeckRecommendRegionData(dataRegion.value)
})

watch(
  [
    selectedAccountKey,
    recommendMode,
    liveType,
    selectedAlgorithms,
    executionMode,
    selectedEventId,
    selectedCharacterId,
    selectedMusicId,
    selectedDifficulty,
    trainingConfig,
  ],
  () => runner.reset(),
  { deep: true },
)

watch(
  () => [selectedAlgorithms.value.join(","), executionMode.value],
  () => {
    writeDeckRecommendPreferences({
      algorithms: selectedAlgorithms.value,
      executionMode: executionMode.value,
    })
    syncParallelEngines()
  },
  { immediate: true },
)

watch(
  () => runner.running.value,
  (running) => {
    if (!running) {
      syncParallelEngines()
    }
  },
)

watch(
  [selectedEventType, recommendMode],
  () => {
    if (!isEventLikeMode.value) {
      return
    }

    liveType.value = selectedEventType.value === "cheerful_carnival" ? "cheerful" : "multi"
  },
  { immediate: true },
)

watch(
  [showCharacterSelect, characterSelectAllowedIds],
  () => {
    if (!showCharacterSelect.value) {
      selectedCharacterId.value = null
      return
    }

    const allowedIds = characterSelectAllowedIds.value
    if (!allowedIds || selectedCharacterId.value == null) {
      return
    }

    if (!allowedIds.includes(Number(selectedCharacterId.value))) {
      selectedCharacterId.value = null
    }
  },
  { immediate: true },
)

watch(
  [
    showWorldBloomCharacterSelect,
    () => worldBloomCharacters.defaultCharacterId.value,
    () => worldBloomCharacters.characterIds.value.join(","),
  ],
  () => {
    if (!showWorldBloomCharacterSelect.value) {
      return
    }

    const defaultCharacterId = worldBloomCharacters.defaultCharacterId.value
      ?? worldBloomCharacters.characterIds.value[0]
      ?? null
    if (!defaultCharacterId) {
      selectedCharacterId.value = null
      return
    }

    const currentId = selectedCharacterId.value == null ? null : Number(selectedCharacterId.value)
    if (!currentId || !worldBloomCharacters.characterIds.value.includes(currentId)) {
      selectedCharacterId.value = String(defaultCharacterId)
    }
  },
  { immediate: true },
)

watch(
  () => [
    dataRegion.value,
    recommendDataReady.value,
    currentRegionState.value.masterFetchVersion,
    currentRegionState.value.musicMetasUpdatedAt,
    currentRegionState.value.files.join(","),
  ],
  () => {
    if (!recommendDataReady.value) {
      return
    }

    preloadCurrentRegionData()
  },
)

onMounted(() => {
  checkDeckRecommendRegionData(dataRegion.value)
  void runner.preloadEngine().catch(() => undefined)
  if (recommendDataReady.value) {
    preloadCurrentRegionData()
  }
})

onBeforeUnmount(() => {
  invalidateDataPreload()
  void runner.disposeEngine().catch(() => undefined)
})

function createAccountOption(account: GameAccountBinding): BoundAccountOption {
  const uid = String(account.userId)
  return {
    key: `${account.server}:${uid}`,
    server: account.server,
    uid,
    label: `${resolveSekaiRegionLabel(account.server, t)} / UID ${uid}`,
  }
}

function updateAccount(value: AcceptableValue) {
  selectedAccountKey.value = typeof value === "string" ? value : ""
}

function updateDataRegion(value: AcceptableValue) {
  if (typeof value === "string" && isSekaiRegionValue(value)) {
    dataRegion.value = value
  }
}

function updateRecommendMode(value: AcceptableValue) {
  if (typeof value === "string" && isDeckRecommendMode(value)) {
    recommendMode.value = value
  }
}

function updateLiveType(value: AcceptableValue) {
  if (typeof value === "string" && isDeckRecommendLiveType(value)) {
    liveType.value = value
  }
}

function toggleAlgorithm(value: DeckRecommendAlgorithm, checked: boolean) {
  const next = new Set(selectedAlgorithms.value)
  if (checked) {
    next.add(value)
  } else {
    next.delete(value)
  }

  selectedAlgorithms.value = algorithmOptions.value
    .map((option) => option.value)
    .filter((optionValue) => next.has(optionValue))
}

function updateExecutionMode(value: AcceptableValue) {
  if (typeof value === "string" && isDeckRecommendExecutionMode(value)) {
    executionMode.value = value
  }
}

function checkDeckRecommendRegionData(region: SekaiRegion) {
  void sekaiDataStore.ensureRegionData(region, { files: SEKAI_DATA_RECOMMEND_MASTER_FILES })
}

function preloadCurrentRegionData() {
  if (!recommendDataReady.value) {
    return
  }

  const region = dataRegion.value
  const signature = createDataPreloadSignature()
  if (signature !== dataPreloadSignature) {
    dataPreloadSignature = signature
    dataPreloadGeneration += 1
  }
  const generation = dataPreloadGeneration
  void runner.preloadRegionData(region, () => generation === dataPreloadGeneration).catch(() => undefined)
  const parallelCount = executionMode.value === "parallel" ? selectedAlgorithms.value.length : 0
  if (parallelCount > 0) {
    void runner.preloadParallelRegionData(region, parallelCount, () => generation === dataPreloadGeneration).catch(() => undefined)
  }
}

function invalidateDataPreload() {
  dataPreloadSignature = ""
  dataPreloadGeneration += 1
}

function createDataPreloadSignature() {
  return [
    dataRegion.value,
    currentRegionState.value.masterFetchVersion ?? "",
    currentRegionState.value.musicMetasUpdatedAt ?? "",
    currentRegionState.value.files.slice().sort().join(","),
    executionMode.value,
    selectedAlgorithms.value.join(","),
  ].join(":")
}

function syncParallelEngines() {
  if (runner.running.value) {
    return
  }

  const parallelCount = executionMode.value === "parallel" ? selectedAlgorithms.value.length : 0
  void runner.preloadParallelEngines(parallelCount)
    .then(() => {
      if (parallelCount > 0 && recommendDataReady.value) {
        preloadCurrentRegionData()
      }
    })
    .catch(() => undefined)
}

async function runRecommend() {
  try {
    await runner.run({
      account: selectedAccount.value,
      dataRegion: dataRegion.value,
      mode: recommendMode.value,
      liveType: liveType.value,
      algorithms: selectedAlgorithms.value,
      executionMode: executionMode.value,
      eventId: selectedEventId.value,
      characterId: activeCharacterId.value,
      musicId: selectedMusicId.value,
      difficulty: selectedDifficulty.value,
      trainingConfig: trainingConfig.value,
    })
    toast.success(t("deckRecommend.toast.runSuccessTitle"))
  } catch (error) {
    toast.error(t("deckRecommend.toast.runFailedTitle"), {
      description: error instanceof Error ? error.message : String(error),
    })
  }
}

function algorithmLabel(algorithm: DeckRecommendAlgorithm) {
  switch (algorithm) {
    case "dfs_ga":
      return t("deckRecommend.algorithms.dfsGa")
    case "ga":
      return t("deckRecommend.algorithms.ga")
    case "rl":
      return t("deckRecommend.algorithms.rl")
  }
}

function recommendElapsedTimingLabel(mode: DeckRecommendExecutionMode | null) {
  if (mode === "parallel") {
    return t("deckRecommend.result.parallelRecommendElapsed")
  }

  return t("deckRecommend.result.sequentialRecommendElapsed")
}

function deckSourceAlgorithms(deck: DeckResultDeckView["deck"]): DeckRecommendAlgorithm[] {
  if ("source_algorithms" in deck && Array.isArray(deck.source_algorithms)) {
    return deck.source_algorithms
  }

  return []
}

function algorithmTagClass(algorithm: DeckRecommendAlgorithm) {
  switch (algorithm) {
    case "dfs_ga":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
    case "ga":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
    case "rl":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
  }
}

function deckEventBonusLabel(deck: DeckResultDeckView["deck"]) {
  if (showWorldBloomCharacterSelect.value) {
    const main = Number(deck.event_bonus_rate) || 0
    const support = Number(deck.support_deck_bonus_rate) || 0
    return t("deckRecommend.result.worldBloomEventBonus", {
      main: formatPercentValue(main),
      support: formatPercentValue(support),
      total: formatPercentValue(main + support),
    })
  }

  return t("deckRecommend.result.eventBonus", { value: formatPercentValue(deck.event_bonus_rate) })
}

function formatPercentValue(value: number) {
  return new Intl.NumberFormat(locale.value, {
    maximumFractionDigits: 2,
  }).format(value)
}

function isSekaiRegionValue(value: string): value is SekaiRegion {
  return SEKAI_REGION_OPTIONS.some((option) => option.value === value)
}

function isDeckRecommendMode(value: string): value is DeckRecommendMode {
  return modeOptions.value.some((option) => option.value === value)
}

function isDeckRecommendLiveType(value: string): value is DeckRecommendLiveType {
  return liveTypeOptions.value.some((option) => option.value === value)
}

function isDeckRecommendExecutionMode(value: string): value is DeckRecommendExecutionMode {
  return DECK_RECOMMEND_EXECUTION_MODES.includes(value as DeckRecommendExecutionMode)
}

function hasRequiredFiles(cachedFiles: readonly string[], requiredFiles: readonly string[]): boolean {
  return requiredFiles.every((fileName) => cachedFiles.includes(fileName))
}

type DeckRecommendPreferences = {
  algorithms?: DeckRecommendAlgorithm[]
  executionMode?: DeckRecommendExecutionMode
}

function readDeckRecommendPreferences(): DeckRecommendPreferences {
  if (typeof window === "undefined") {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(DECK_RECOMMEND_PREFERENCES_STORAGE_KEY)
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>
    return {
      algorithms: normalizePersistedAlgorithms(parsed.algorithms),
      executionMode: typeof parsed.executionMode === "string" && isDeckRecommendExecutionMode(parsed.executionMode)
        ? parsed.executionMode
        : undefined,
    }
  } catch {
    return {}
  }
}

function writeDeckRecommendPreferences(preferences: Required<DeckRecommendPreferences>) {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(DECK_RECOMMEND_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
  } catch {
  }
}

function normalizePersistedAlgorithms(value: unknown): DeckRecommendAlgorithm[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return DEFAULT_ALGORITHMS.filter((algorithm) => value.includes(algorithm))
}

</script>

<template>
  <div class="flex w-full flex-1 flex-col items-center justify-center px-0 py-4">
    <div class="mx-auto w-full max-w-6xl space-y-4">
      <Card>
          <CardHeader class="gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="space-y-1.5">
              <CardTitle class="flex items-center gap-2 text-lg">
                <LucideGamepad2 class="size-5" />
                {{ t("deckRecommend.title") }}
              </CardTitle>
              <CardDescription>{{ t("deckRecommend.description") }}</CardDescription>
            </div>
          </CardHeader>
          <CardContent class="grid gap-4">
            <div class="grid gap-4 lg:grid-cols-2">
              <div class="grid gap-2">
                <Label>{{ t("deckRecommend.form.account") }}</Label>
                <Select :model-value="selectedAccountKey" :disabled="accountOptions.length === 0" @update:model-value="updateAccount">
                  <SelectTrigger class="w-full">
                    <SelectValue :placeholder="t('deckRecommend.form.accountPlaceholder')" />
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
                <Label>{{ t("deckRecommend.form.mode") }}</Label>
                <Select :model-value="recommendMode" @update:model-value="updateRecommendMode">
                  <SelectTrigger class="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="option in modeOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="grid gap-2">
                <Label>{{ t("deckRecommend.form.liveType") }}</Label>
                <Select :model-value="liveType" @update:model-value="updateLiveType">
                  <SelectTrigger class="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="option in liveTypeOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="grid gap-2">
                <div class="flex items-center gap-1.5">
                  <Label>{{ t("deckRecommend.form.algorithm") }}</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button
                          type="button"
                          class="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          :aria-label="t('deckRecommend.form.algorithmHint')"
                        >
                          <LucideInfo class="size-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent class="max-w-80 !border-slate-200 !bg-white !text-slate-950 text-left leading-5 shadow-lg dark:!border-slate-700 dark:!bg-slate-950 dark:!text-slate-50">
                        {{ t("deckRecommend.form.algorithmHint") }}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div class="grid gap-2 rounded-md border p-3 sm:grid-cols-3">
                  <label
                    v-for="option in algorithmOptions"
                    :key="option.value"
                    class="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      :model-value="selectedAlgorithms.includes(option.value)"
                      :disabled="runner.running.value"
                      @update:model-value="checked => toggleAlgorithm(option.value, checked === true)"
                    />
                    <span>{{ option.label }}</span>
                  </label>
                </div>
              </div>

              <div class="grid gap-2">
                <Label>{{ t("deckRecommend.form.executionMode") }}</Label>
                <Select :model-value="executionMode" :disabled="runner.running.value" @update:model-value="updateExecutionMode">
                  <SelectTrigger class="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="option in executionModeOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div class="grid gap-4">
              <div class="grid gap-2">
                <Label>{{ t("deckRecommend.form.event") }}</Label>
                <EventSelect
                  v-model="selectedEventId"
                  v-model:event-type="selectedEventType"
                  :region="dataRegion"
                  :disabled="!dataReady"
                />
              </div>

              <div v-if="showCharacterSelect" class="grid gap-2">
                <Label>{{ t("deckRecommend.form.character") }}</Label>
                <CharacterSelect
                  v-model="selectedCharacterId"
                  :region="dataRegion"
                  :allowed-character-ids="characterSelectAllowedIds"
                  :disabled="!dataReady || worldBloomCharacters.loading.value"
                />
              </div>

              <div class="grid gap-2">
                <Label>{{ t("deckRecommend.form.music") }}</Label>
                <MusicSelect
                  v-model="selectedMusicId"
                  v-model:difficulty-value="selectedDifficulty"
                  :region="dataRegion"
                  :disabled="!dataReady"
                />
              </div>
            </div>

            <div class="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p class="text-sm text-muted-foreground">
                {{ runner.running.value && runner.phase.value ? t(`deckRecommend.runner.phases.${runner.phase.value}`) : t("deckRecommend.runner.ready") }}
              </p>
              <Button type="button" :disabled="!canRunRecommend" @click="runRecommend">
                <LucidePlay class="size-4" />
                {{ runner.running.value ? t("deckRecommend.runner.running") : t("deckRecommend.runner.run") }}
              </Button>
            </div>
          </CardContent>
      </Card>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-base">
              <LucideSettings2 class="size-4" />
              {{ t("deckRecommend.training.title") }}
            </CardTitle>
            <CardDescription>{{ t("deckRecommend.training.description") }}</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTrainingConfigTable v-model="trainingConfig" />
          </CardContent>
        </Card>

        <Card v-if="showResultCard">
          <CardHeader>
            <CardTitle class="text-base">{{ t("deckRecommend.result.title") }}</CardTitle>
            <CardDescription>
              <template v-if="runner.elapsedMs.value != null">
                {{ t("deckRecommend.result.totalElapsed", { ms: runner.elapsedMs.value }) }}
              </template>
              <template v-else>
                {{ t("deckRecommend.result.description") }}
              </template>
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div v-if="resultTimingItems.length > 0" class="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span
                v-for="item in resultTimingItems"
                :key="item.key"
                :class="[
                  'inline-flex items-baseline gap-1 rounded-md border px-2 py-1 font-medium',
                  item.class,
                ]"
              >
                <span>{{ item.label }}</span>
                <span class="rounded bg-background/80 px-1 font-mono text-sm font-bold text-foreground shadow-sm">
                  {{ item.elapsedMs }}
                </span>
                <span>ms</span>
              </span>
            </div>
            <div v-if="runner.algorithmTimings.value.length > 0" class="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span
                v-for="item in runner.algorithmTimings.value"
                :key="item.algorithm"
                :class="[
                  'inline-flex items-baseline gap-1 rounded-md border px-2 py-1 font-medium',
                  algorithmTagClass(item.algorithm),
                ]"
              >
                <span>{{ algorithmLabel(item.algorithm) }}</span>
                <span class="rounded bg-background/80 px-1 font-mono text-sm font-bold text-foreground shadow-sm">
                  {{ item.elapsedMs }}
                </span>
                <span>ms</span>
              </span>
            </div>
            <div v-if="runner.error.value" class="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {{ runner.error.value }}
            </div>
            <div v-else-if="resultDecks.length === 0" class="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              {{ t("deckRecommend.result.empty") }}
            </div>
            <div v-for="deckView in resultDecks" :key="deckView.index" class="space-y-3 rounded-md border p-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-medium">{{ t("deckRecommend.result.deckTitle", { index: deckView.index + 1 }) }}</span>
                  <span
                    v-for="algorithm in deckSourceAlgorithms(deckView.deck)"
                    :key="algorithm"
                    :class="[
                      'rounded-md border px-2 py-0.5 text-xs font-medium',
                      algorithmTagClass(algorithm),
                    ]"
                  >
                    {{ algorithmLabel(algorithm) }}
                  </span>
                </div>
                <span class="font-mono text-xs text-muted-foreground">{{ t("deckRecommend.result.score", { score: deckView.deck.score }) }}</span>
              </div>
              <div class="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <span>{{ t("deckRecommend.result.totalPower", { value: deckView.deck.total_power }) }}</span>
                <span>{{ deckEventBonusLabel(deckView.deck) }}</span>
                <span>{{ t("deckRecommend.result.liveScore", { value: deckView.deck.live_score }) }}</span>
              </div>
              <div class="grid gap-2 md:grid-cols-2">
                <div
                  v-for="cardView in deckView.cards"
                  :key="cardView.card.card_id"
                  class="flex min-w-0 gap-3 rounded-md border bg-muted/20 p-2"
                >
                  <CardThumbnail :thumbnail="cardView.thumbnail" />
                  <div class="min-w-0 flex-1 space-y-2">
                    <div class="flex min-w-0 items-start justify-between gap-2">
                      <span class="min-w-0 truncate text-sm font-medium">
                        {{ cardView.thumbnail.title ?? t("deckRecommend.result.unknownCard") }}
                      </span>
                      <span class="shrink-0 font-mono text-xs text-muted-foreground">#{{ cardView.card.card_id }}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{{ t("deckRecommend.result.cardLevel", { value: cardView.card.level }) }}</span>
                      <span>{{ t("deckRecommend.result.masterRank", { value: cardView.card.master_rank }) }}</span>
                      <span>{{ t("deckRecommend.result.skillLevel", { value: cardView.card.skill_level }) }}</span>
                      <span>{{ t("deckRecommend.result.skillScoreUp", { value: cardView.card.skill_score_up }) }}</span>
                      <span>{{ t("deckRecommend.result.cardEventBonus", { value: cardView.card.event_bonus_rate }) }}</span>
                      <span>{{ t(cardView.card.has_canvas_bonus ? "deckRecommend.result.canvasBonus" : "deckRecommend.result.noCanvasBonus") }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
      </Card>

      <div class="space-y-1.5 rounded-md border bg-muted/20 p-4 text-xs leading-6 text-muted-foreground">
        <p>
          {{ t("deckRecommend.attribution.originalPrefix") }}<a
            class="font-medium text-foreground underline underline-offset-2 hover:text-primary"
            href="https://github.com/xfl03"
            target="_blank"
            rel="noreferrer noopener"
          >xfl03(33)</a>{{ t("deckRecommend.attribution.originalMiddle") }}<a
            class="font-medium text-foreground underline underline-offset-2 hover:text-primary"
            href="https://github.com/xfl03/sekai-calculator"
            target="_blank"
            rel="noreferrer noopener"
          >sekai-calculator</a>{{ t("deckRecommend.attribution.originalSuffix") }}
        </p>
        <p>
          {{ t("deckRecommend.attribution.optimizationPrefix") }}<a
            class="font-medium text-foreground underline underline-offset-2 hover:text-primary"
            href="https://github.com/NeuraXmy"
            target="_blank"
            rel="noreferrer noopener"
          >{{ t("deckRecommend.attribution.neuraxmyName") }}</a>{{ t("deckRecommend.attribution.optimizationMiddle") }}<a
            class="font-medium text-foreground underline underline-offset-2 hover:text-primary"
            href="https://github.com/NeuraXmy/sekai-deck-recommend-cpp"
            target="_blank"
            rel="noreferrer noopener"
          >sekai-deck-recommend-cpp</a>
        </p>
        <p>
          {{ t("deckRecommend.attribution.enginePrefix") }}<router-link
            class="font-medium text-foreground underline underline-offset-2 hover:text-primary"
            to="/about"
          >{{ t("deckRecommend.attribution.aboutLink") }}</router-link>{{ t("deckRecommend.attribution.engineSuffix") }}
        </p>
      </div>
    </div>
  </div>
</template>
