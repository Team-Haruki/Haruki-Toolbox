<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useI18n } from "vue-i18n"
import {
  LucideGamepad2,
  LucidePlay,
  LucideRefreshCw,
  LucideSettings2,
  LucideTrash2,
  LucideUsers,
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
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { resolveSekaiRegionLabel, SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import { useSekaiDataStore, type SekaiDataQueueItem } from "@/shared/stores/sekai-data"
import { useUserStore } from "@/shared/stores/user"
import type { GameAccountBinding, SekaiRegion } from "@/types"
import CardThumbnail from "../components/CardThumbnail.vue"
import CardTrainingConfigTable from "../components/CardTrainingConfigTable.vue"
import CharacterSelect from "../components/CharacterSelect.vue"
import EventSelect from "../components/EventSelect.vue"
import MusicSelect from "../components/MusicSelect.vue"
import { buildDeckResultViews, type DeckResultDeckView } from "../lib/card-thumbnail"
import {
  resolveWasmLiveType,
  type DeckRecommendAlgorithm,
  type DeckRecommendLiveType,
  type DeckRecommendMode,
  type WasmRecommendLiveType,
} from "../lib/recommend-options"
import { createDefaultCardTrainingConfig } from "../lib/training-config"
import { useDeckRecommendRunner } from "../composables/useDeckRecommendRunner"
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

const { t, locale } = useI18n()
const userStore = useUserStore()
const sekaiDataStore = useSekaiDataStore()
const runner = useDeckRecommendRunner()

const selectedAccountKey = ref("")
const dataRegion = ref<SekaiRegion>("jp")
const recommendMode = ref<DeckRecommendMode>("event")
const liveType = ref<DeckRecommendLiveType>("solo")
const selectedAlgorithms = ref<DeckRecommendAlgorithm[]>([...DEFAULT_ALGORITHMS])
const selectedEventId = ref<string | null>(null)
const selectedCharacterId = ref<string | null>(null)
const selectedMusicId = ref<string | null>(DEFAULT_MUSIC_ID)
const selectedDifficulty = ref<string | null>(DEFAULT_MUSIC_DIFFICULTY)
const trainingConfig = ref(createDefaultCardTrainingConfig())
const worldBloomCharacters = useWorldBloomCharacterOptions(dataRegion, selectedEventId)

const accountOptions = computed<BoundAccountOption[]>(() => {
  const accounts = Array.isArray(userStore.gameAccountBindings) ? userStore.gameAccountBindings : []
  return accounts.map((account) => createAccountOption(account))
})

const selectedAccount = computed(() => {
  return accountOptions.value.find((account) => account.key === selectedAccountKey.value) ?? null
})

const currentRegionState = computed(() => sekaiDataStore.regionStates[dataRegion.value])
const wasmLiveType = computed(() => resolveWasmLiveType(recommendMode.value, liveType.value))
const wasmLiveTypeLabel = computed(() => liveTypeLabel(wasmLiveType.value))
const dataReady = computed(() => currentRegionState.value.status === "ready")
const queueItems = computed(() => sekaiDataStore.latestQueueItems)
const resultDecks = computed(() => buildDeckResultViews(runner.result.value, runner.masterData.value, dataRegion.value))
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
  if (runner.running.value || !selectedAccount.value || !dataReady.value || selectedAlgorithms.value.length === 0) {
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
  selectedEventId.value = null
  selectedCharacterId.value = null
  selectedMusicId.value = DEFAULT_MUSIC_ID
  selectedDifficulty.value = DEFAULT_MUSIC_DIFFICULTY
  runner.reset()
  void sekaiDataStore.ensureRegionData(dataRegion.value)
})

watch(
  [
    selectedAccountKey,
    recommendMode,
    liveType,
    selectedAlgorithms,
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

onMounted(() => {
  void sekaiDataStore.ensureRegionData(dataRegion.value)
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

function refreshCurrentRegion() {
  sekaiDataStore.refreshRegionData(dataRegion.value)
}

function clearCurrentRegion() {
  sekaiDataStore.clearRegionData(dataRegion.value)
}

async function runRecommend() {
  try {
    await runner.run({
      account: selectedAccount.value,
      dataRegion: dataRegion.value,
      mode: recommendMode.value,
      liveType: liveType.value,
      algorithms: selectedAlgorithms.value,
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

function phaseLabel(item: Pick<SekaiDataQueueItem, "phase">) {
  return t(`deckRecommend.dataQueue.phases.${item.phase}`)
}

function queueStatusLabel(item: Pick<SekaiDataQueueItem, "status">) {
  return t(`deckRecommend.dataQueue.status.${item.status}`)
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

function liveTypeLabel(type: DeckRecommendLiveType | WasmRecommendLiveType) {
  switch (type) {
    case "solo":
      return t("deckRecommend.liveTypes.solo")
    case "multi":
      return t("deckRecommend.liveTypes.multi")
    case "auto":
      return t("deckRecommend.liveTypes.auto")
    case "challenge":
      return t("deckRecommend.liveTypes.challenge")
    case "challenge_auto":
      return t("deckRecommend.liveTypes.challengeAuto")
    case "cheerful":
      return t("deckRecommend.liveTypes.cheerful")
    case "mysekai":
      return t("deckRecommend.liveTypes.mysekai")
  }
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

function formatTime(value: number | null) {
  if (!value) {
    return t("deckRecommend.dataStatus.never")
  }

  return new Intl.DateTimeFormat(locale.value, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
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

</script>

<template>
  <div class="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-lg">
              <LucideGamepad2 class="size-5" />
              {{ t("deckRecommend.title") }}
            </CardTitle>
            <CardDescription>{{ t("deckRecommend.description") }}</CardDescription>
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
                <p class="text-xs text-muted-foreground">
                  {{ t("deckRecommend.form.wasmLiveType", { type: wasmLiveTypeLabel }) }}
                </p>
              </div>

              <div class="grid gap-2">
                <Label>{{ t("deckRecommend.form.algorithm") }}</Label>
                <div class="grid gap-2 rounded-md border p-3 sm:grid-cols-3">
                  <label
                    v-for="option in algorithmOptions"
                    :key="option.value"
                    class="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      :model-value="selectedAlgorithms.includes(option.value)"
                      @update:model-value="checked => toggleAlgorithm(option.value, checked === true)"
                    />
                    <span>{{ option.label }}</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="grid gap-4">
              <div class="grid gap-2">
                <Label>{{ t("deckRecommend.form.event") }}</Label>
                <EventSelect v-model="selectedEventId" :region="dataRegion" :disabled="!dataReady" />
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

        <Card>
          <CardHeader>
            <CardTitle class="text-base">{{ t("deckRecommend.result.title") }}</CardTitle>
            <CardDescription>
              <template v-if="runner.elapsedMs.value != null">
                {{ t("deckRecommend.result.elapsed", { ms: runner.elapsedMs.value }) }}
              </template>
              <template v-else>
                {{ t("deckRecommend.result.description") }}
              </template>
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div v-if="runner.algorithmTimings.value.length > 0" class="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span
                v-for="item in runner.algorithmTimings.value"
                :key="item.algorithm"
                class="rounded-md border bg-muted/20 px-2 py-1"
              >
                {{ t("deckRecommend.result.algorithmElapsed", { algorithm: algorithmLabel(item.algorithm), ms: item.elapsedMs }) }}
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
      </div>

      <div class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-base">
              <LucideUsers class="size-4" />
              {{ t("deckRecommend.dataStatus.title") }}
            </CardTitle>
            <CardDescription>{{ t("deckRecommend.dataStatus.description") }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid gap-2 text-sm">
              <div class="flex items-center justify-between gap-3">
                <span class="text-muted-foreground">{{ t("deckRecommend.dataStatus.region") }}</span>
                <span class="font-medium">{{ resolveSekaiRegionLabel(dataRegion, t) }}</span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="text-muted-foreground">{{ t("deckRecommend.dataStatus.masterVersion") }}</span>
                <span class="font-mono text-xs">{{ currentRegionState.masterDisplayVersion ?? "-" }}</span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="text-muted-foreground">{{ t("deckRecommend.dataStatus.fetchVersion") }}</span>
                <span class="font-mono text-xs">{{ currentRegionState.masterFetchVersion ?? "-" }}</span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="text-muted-foreground">{{ t("deckRecommend.dataStatus.updatedAt") }}</span>
                <span>{{ formatTime(currentRegionState.updatedAt) }}</span>
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs text-muted-foreground">
                <span>{{ currentRegionState.phase ? t(`deckRecommend.dataQueue.phases.${currentRegionState.phase}`) : t("deckRecommend.dataStatus.idle") }}</span>
                <span>{{ currentRegionState.progress }}%</span>
              </div>
              <Progress :model-value="currentRegionState.progress" />
              <p v-if="currentRegionState.error" class="text-xs text-destructive">
                {{ currentRegionState.error }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" :disabled="currentRegionState.refreshing" @click="refreshCurrentRegion">
                <LucideRefreshCw class="size-4" />
                {{ t("deckRecommend.dataStatus.refresh") }}
              </Button>
              <Button type="button" variant="outline" :disabled="currentRegionState.refreshing" @click="clearCurrentRegion">
                <LucideTrash2 class="size-4" />
                {{ t("deckRecommend.dataStatus.clear") }}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-base">{{ t("deckRecommend.dataQueue.title") }}</CardTitle>
            <CardDescription>{{ t("deckRecommend.dataQueue.description") }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div v-if="queueItems.length === 0" class="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              {{ t("deckRecommend.dataQueue.empty") }}
            </div>
            <div v-for="item in queueItems" :key="item.id" class="space-y-2 rounded-md border p-3">
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="font-medium">{{ resolveSekaiRegionLabel(item.region, t) }}</span>
                <span class="text-xs text-muted-foreground">{{ queueStatusLabel(item) }}</span>
              </div>
              <div class="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>{{ phaseLabel(item) }}</span>
                <span v-if="item.fileName">{{ item.fileName }}</span>
              </div>
              <Progress :model-value="item.progress" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
