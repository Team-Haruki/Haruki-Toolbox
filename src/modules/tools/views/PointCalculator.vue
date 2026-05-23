<script setup lang="ts">
import { computed, ref, watch } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import {
  ArrowRight,
  Database,
  Flame,
  List,
  LucideAlertCircle,
  LucideCalculator,
  Music2,
  Percent,
  Target,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
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
import { formatNumberCN } from "@/lib/number-format"
import { readSekaiMasterFile, readSekaiMusicMetas } from "@/shared/sekai/cache"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import type { SekaiRegion } from "@/types"
import {
  findScoreControlRanges,
  SCORE_CONTROL_BOOST_MULTIPLIERS,
  SCORE_CONTROL_DEFAULT_MUSIC_ID,
  SCORE_CONTROL_MAX_EVENT_BONUS,
  selectScoreControlBasicPoint,
  type ScoreControlMusicMeta,
  type ScoreControlRange,
} from "../lib/score-control"

type SekaiMusic = {
  id?: number
  seq?: number
  title?: string
  pronunciation?: string
  assetbundleName?: string
}

type MusicOption = {
  id: number
  value: string
  label: string
  seq: number | null
  pronunciation: string | null
  assetbundleName: string | null
}

const POINT_CALCULATOR_DEFAULT_RESULT_LIMIT = 10
const POINT_CALCULATOR_MIN_BONUS_CAP = 100

const { t } = useI18n()
const router = useRouter()
const sekaiDataStore = useSekaiDataStore()

const selectedRegion = ref<SekaiRegion>("jp")
const selectedMusicId = ref(String(SCORE_CONTROL_DEFAULT_MUSIC_ID))
const inputPt = ref<number | undefined>(undefined)
const selectedBoost = ref("all")
const maxResults = ref<number | undefined>(POINT_CALCULATOR_DEFAULT_RESULT_LIMIT)
const customBonusFloor = ref<number | undefined>(POINT_CALCULATOR_MIN_BONUS_CAP)
const customBonusCap = ref<number | undefined>(SCORE_CONTROL_MAX_EVENT_BONUS)
const loading = ref(false)
const loadError = ref<string | null>(null)
const musicOptions = ref<MusicOption[]>([])
const musicMetas = ref<ScoreControlMusicMeta[]>([])
const results = ref<ScoreControlRange[]>([])
const calculatedOnce = ref(false)

const boostOptions = computed(() => [
  { value: "all", label: t("tools.pointCalculator.fields.boostIndexAll") },
  ...Object.entries(SCORE_CONTROL_BOOST_MULTIPLIERS).map(([boost, multiplier]) => ({
    value: boost,
    label: t("tools.pointCalculator.fields.boostIndexOption", { index: boost, rate: multiplier }),
  })),
])
const currentRegionState = computed(() => sekaiDataStore.regionStates[selectedRegion.value])
const selectedMusicOption = computed(() =>
  musicOptions.value.find((option) => option.value === selectedMusicId.value) ?? null,
)
const selectedBasicPoint = computed(() =>
  selectScoreControlBasicPoint(selectedMusicId.value, musicMetas.value),
)
const minEventBonus = computed(() => normalizeBonusBound(customBonusFloor.value, POINT_CALCULATOR_MIN_BONUS_CAP))
const maxEventBonus = computed(() => normalizeBonusBound(customBonusCap.value, SCORE_CONTROL_MAX_EVENT_BONUS))
const maxResultsInvalid = computed(() => {
  if (maxResults.value == null || String(maxResults.value).trim() === "") {
    return false
  }

  return !Number.isInteger(Number(maxResults.value)) || Number(maxResults.value) <= 0
})
const customBonusCapInvalid = computed(() => {
  if (customBonusCap.value == null || String(customBonusCap.value).trim() === "") {
    return false
  }

  const parsed = Number(customBonusCap.value)
  return !Number.isInteger(parsed)
    || parsed < POINT_CALCULATOR_MIN_BONUS_CAP
    || parsed > SCORE_CONTROL_MAX_EVENT_BONUS
    || parsed < minEventBonus.value
})
const customBonusFloorInvalid = computed(() => {
  if (customBonusFloor.value == null || String(customBonusFloor.value).trim() === "") {
    return false
  }

  const parsed = Number(customBonusFloor.value)
  return !Number.isInteger(parsed)
    || parsed < POINT_CALCULATOR_MIN_BONUS_CAP
    || parsed > SCORE_CONTROL_MAX_EVENT_BONUS
    || parsed > maxEventBonus.value
})
const targetPointInvalid = computed(() => {
  if (inputPt.value == null || String(inputPt.value).trim() === "") {
    return false
  }

  return !Number.isInteger(Number(inputPt.value)) || Number(inputPt.value) <= 0
})
const canCalculate = computed(() =>
  !loading.value
  && !targetPointInvalid.value
  && !maxResultsInvalid.value
  && !customBonusFloorInvalid.value
  && !customBonusCapInvalid.value
  && Number.isInteger(Number(inputPt.value))
  && Number(inputPt.value) > 0
  && selectedBasicPoint.value != null,
)
const comboboxOptions = computed<ComboboxOption[]>(() =>
  musicOptions.value.map((option) => ({
    value: option.value,
    label: option.label,
    tags: [
      {
        label: `#${option.id}`,
        class: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-200",
      },
    ],
    keywords: [
      String(option.id),
      `#${option.id}`,
      option.seq ? String(option.seq) : "",
      option.pronunciation ?? "",
      option.assetbundleName ?? "",
    ],
  })),
)

watch(
  selectedRegion,
  () => {
    void loadScoreControlData()
  },
  { immediate: true },
)

async function loadScoreControlData() {
  loading.value = true
  loadError.value = null
  try {
    if (!currentRegionState.value.masterFetchVersion || !currentRegionState.value.files.includes("musics")) {
      await sekaiDataStore.ensureRegionData(selectedRegion.value, { files: ["musics"] })
    }
    const [musics, metas] = await Promise.all([
      readSekaiMasterFile<SekaiMusic[]>(selectedRegion.value, "musics"),
      readSekaiMusicMetas<ScoreControlMusicMeta[]>(selectedRegion.value),
    ])
    musicOptions.value = buildMusicOptions(musics)
    musicMetas.value = Array.isArray(metas) ? metas : []
    if (!musicOptions.value.some((option) => option.value === selectedMusicId.value)) {
      selectedMusicId.value = musicOptions.value.some((option) => option.id === SCORE_CONTROL_DEFAULT_MUSIC_ID)
        ? String(SCORE_CONTROL_DEFAULT_MUSIC_ID)
        : musicOptions.value[0]?.value ?? ""
    }
  } catch (error) {
    musicOptions.value = []
    musicMetas.value = []
    loadError.value = error instanceof Error ? error.message : String(error)
  } finally {
    loading.value = false
  }
}

function updateRegion(value: AcceptableValue) {
  if (typeof value === "string" && isSekaiRegionValue(value)) {
    selectedRegion.value = value
  }
}

function updateMusic(value: string | null) {
  selectedMusicId.value = value || ""
  results.value = []
  calculatedOnce.value = false
}

function updateBoost(value: AcceptableValue) {
  selectedBoost.value = typeof value === "string" ? value : "all"
}

function calcResult(): void {
  const targetPoint = Number(inputPt.value)
  const basicPoint = selectedBasicPoint.value
  if (!Number.isInteger(targetPoint) || targetPoint <= 0 || !basicPoint) {
    calculatedOnce.value = false
    results.value = []
    return
  }

  results.value = findScoreControlRanges({
    targetPoint,
    basicPoint: basicPoint.basicPoint,
    worldLink: false,
    boost: selectedBoost.value === "all" ? null : Number(selectedBoost.value),
    minEventBonus: minEventBonus.value,
    maxEventBonus: maxEventBonus.value,
    limit: maxResults.value == null || maxResults.value <= 0
      ? POINT_CALCULATOR_DEFAULT_RESULT_LIMIT
      : Number(maxResults.value),
  })
  calculatedOnce.value = true
}

function goToDeckRecommend(row: ScoreControlRange) {
  if (row.eventBonus <= 0) {
    return
  }

  void router.push({
    path: "/deck-recommend",
    query: {
      source: "score-control",
      mode: "bonus",
      dataRegion: selectedRegion.value,
      liveType: "solo",
      musicId: selectedMusicId.value,
      musicDifficulty: selectedBasicPoint.value?.difficulty ?? "master",
      bonusTargets: String(row.eventBonus),
      boost: String(row.boost),
    },
  })
}

function buildMusicOptions(items: SekaiMusic[] | null): MusicOption[] {
  return (items ?? [])
    .map((item) => {
      const id = normalizePositiveNumber(item.id)
      if (!id) {
        return null
      }

      return {
        id,
        value: String(id),
        label: normalizeText(item.title) ?? `#${id}`,
        seq: normalizePositiveNumber(item.seq),
        pronunciation: normalizeText(item.pronunciation),
        assetbundleName: normalizeText(item.assetbundleName),
      }
    })
    .filter((item): item is MusicOption => item != null)
    .sort((a, b) => (a.seq ?? a.id) - (b.seq ?? b.id))
}

function normalizePositiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function isSekaiRegionValue(value: string): value is SekaiRegion {
  return SEKAI_REGION_OPTIONS.some((option) => option.value === value)
}

function formatScore(value: number) {
  return formatNumberCN(value, "0")
}

function normalizeBonusBound(value: number | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed)
    && parsed >= POINT_CALCULATOR_MIN_BONUS_CAP
    && parsed <= SCORE_CONTROL_MAX_EVENT_BONUS
    ? parsed
    : fallback
}
</script>

<template>
  <div class="flex w-full flex-1 items-center justify-center px-0 py-4">
    <div class="mx-auto w-full max-w-5xl space-y-4">
      <Alert class="border-sky-200 bg-sky-50/70 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100">
        <LucideAlertCircle class="h-4 w-4" />
        <AlertTitle>{{ t("tools.pointCalculator.tips.title") }}</AlertTitle>
        <AlertDescription class="space-y-1 leading-6">
          <p>{{ t("tools.pointCalculator.tips.boostConfig") }}</p>
          <p>
            <span class="font-semibold text-destructive">{{ t("tools.pointCalculator.tips.testingPrefix") }}</span>
            {{ t("tools.pointCalculator.tips.testingSuffix") }}
          </p>
          <p>{{ t("tools.pointCalculator.tips.deckRecommend") }}</p>
        </AlertDescription>
      </Alert>

      <div class="grid items-start gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card class="self-start">
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-lg">
              <LucideCalculator class="size-5" />
              {{ t("tools.pointCalculator.title") }}
            </CardTitle>
            <CardDescription>{{ t("tools.pointCalculator.description") }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div class="grid gap-2">
                <Label>{{ t("tools.pointCalculator.fields.region") }}</Label>
                <Select :model-value="selectedRegion" :disabled="loading" @update:model-value="updateRegion">
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
                <Label>{{ t("tools.pointCalculator.fields.maxResults") }}</Label>
                <div class="relative w-full items-center">
                  <Input
                    v-model.number="maxResults"
                    class="pl-10"
                    type="number"
                    min="1"
                    inputmode="numeric"
                    :aria-invalid="maxResultsInvalid || undefined"
                    :placeholder="t('tools.pointCalculator.fields.maxResultsPlaceholder')"
                  />
                  <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                    <List class="size-4 text-muted-foreground" />
                  </span>
                </div>
              </div>

            </div>

            <div class="grid gap-2">
              <Label>{{ t("tools.pointCalculator.fields.music") }}</Label>
              <Combobox
                :model-value="selectedMusicId"
                :options="comboboxOptions"
                :disabled="loading || comboboxOptions.length === 0"
                :clearable="false"
                :placeholder="loading ? t('tools.pointCalculator.fields.loadingMusic') : t('tools.pointCalculator.fields.musicPlaceholder')"
                :search-placeholder="t('tools.pointCalculator.fields.musicSearchPlaceholder')"
                :empty-text="t('tools.pointCalculator.fields.musicEmpty')"
                :icon-component="Music2"
                @update:model-value="updateMusic"
              />
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="grid gap-2">
                <Label for="score-control-target-pt">{{ t("tools.pointCalculator.fields.targetPt") }}</Label>
                <div class="relative w-full items-center">
                  <Input
                    id="score-control-target-pt"
                    v-model.number="inputPt"
                    class="pl-10"
                    type="number"
                    min="1"
                    inputmode="numeric"
                    :aria-invalid="targetPointInvalid || undefined"
                    :placeholder="t('tools.pointCalculator.fields.targetPtPlaceholder')"
                    @keydown.enter="calcResult"
                  />
                  <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                    <Target class="size-4 text-muted-foreground" />
                  </span>
                </div>
              </div>

              <div class="grid gap-2">
                <Label>{{ t("tools.pointCalculator.fields.boostIndex") }}</Label>
                <div class="relative w-full items-center">
                  <Select :model-value="selectedBoost" @update:model-value="updateBoost">
                    <SelectTrigger class="w-full pl-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="option in boostOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2 pointer-events-none">
                    <Flame class="size-4 text-muted-foreground" />
                  </span>
                </div>
              </div>
            </div>

            <section class="grid gap-3 rounded-md border bg-muted/20 p-3">
              <div class="space-y-1">
                <h3 class="text-sm font-medium">{{ t("tools.pointCalculator.fields.bonusRange") }}</h3>
                <p class="text-xs leading-5 text-muted-foreground">
                  {{ t("tools.pointCalculator.fields.bonusRangeHelp") }}
                </p>
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <div class="grid gap-2">
                  <Label>{{ t("tools.pointCalculator.fields.customBonusFloor") }}</Label>
                  <div class="relative w-full items-center">
                    <Input
                      v-model.number="customBonusFloor"
                      class="pl-10"
                      type="number"
                      :min="POINT_CALCULATOR_MIN_BONUS_CAP"
                      :max="SCORE_CONTROL_MAX_EVENT_BONUS"
                      inputmode="numeric"
                      :aria-invalid="customBonusFloorInvalid || undefined"
                      :placeholder="t('tools.pointCalculator.fields.customBonusFloorPlaceholder')"
                    />
                    <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                      <Percent class="size-4 text-muted-foreground" />
                    </span>
                  </div>
                </div>

                <div class="grid gap-2">
                  <Label>{{ t("tools.pointCalculator.fields.customBonusCap") }}</Label>
                  <div class="relative w-full items-center">
                    <Input
                      v-model.number="customBonusCap"
                      class="pl-10"
                      type="number"
                      :min="POINT_CALCULATOR_MIN_BONUS_CAP"
                      :max="SCORE_CONTROL_MAX_EVENT_BONUS"
                      inputmode="numeric"
                      :aria-invalid="customBonusCapInvalid || undefined"
                      :placeholder="t('tools.pointCalculator.fields.customBonusCapPlaceholder')"
                    />
                    <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                      <Percent class="size-4 text-muted-foreground" />
                    </span>
                  </div>
                </div>
              </div>
              <p v-if="customBonusFloorInvalid || customBonusCapInvalid" class="text-xs text-destructive">
                {{ t("tools.pointCalculator.fields.bonusRangeInvalid") }}
              </p>
            </section>

            <div class="grid gap-2 rounded-md border bg-muted/20 p-3 text-sm">
              <div class="flex items-center gap-2">
                <Database class="size-4 text-muted-foreground" />
                <span class="font-medium">{{ t("tools.pointCalculator.meta.title") }}</span>
              </div>
              <div class="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <span>{{ t("tools.pointCalculator.meta.music", { value: selectedMusicOption?.label ?? "-" }) }}</span>
                <span>{{ t("tools.pointCalculator.meta.basicPoint", { value: selectedBasicPoint?.basicPoint ?? "-" }) }}</span>
                <span>{{ t("tools.pointCalculator.meta.bonusRange", { min: minEventBonus, max: maxEventBonus }) }}</span>
              </div>
              <p v-if="loadError" class="text-xs text-destructive">{{ loadError }}</p>
              <p v-else-if="!selectedBasicPoint" class="text-xs text-destructive">
                {{ t("tools.pointCalculator.meta.missingBasicPoint") }}
              </p>
            </div>

            <Button class="w-full" :disabled="!canCalculate" @click="calcResult">
              <LucideCalculator class="size-4" />
              {{ t("tools.pointCalculator.actions.calculate") }}
            </Button>
          </CardContent>
        </Card>

        <Card class="self-start">
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-lg">
              <Percent class="size-5" />
              {{ t("tools.pointCalculator.result.title") }}
            </CardTitle>
            <CardDescription>
              <template v-if="calculatedOnce">
                {{ t("tools.pointCalculator.result.summary", { count: results.length }) }}
              </template>
              <template v-else>
                {{ t("tools.pointCalculator.result.placeholder") }}
              </template>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="calculatedOnce && results.length > 0" class="space-y-3">
              <div
                v-for="row in results"
                :key="`${row.eventBonus}-${row.boost}-${row.scoreMin}-${row.scoreMax}`"
                class="grid gap-3 rounded-md border bg-muted/20 p-3 sm:grid-cols-[1fr_auto]"
              >
                <div class="min-w-0 space-y-2">
                  <div class="flex flex-wrap gap-2">
                    <span class="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
                      {{ t("tools.pointCalculator.result.deckBonus", { value: row.eventBonus }) }}
                    </span>
                    <span class="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                      {{ t("tools.pointCalculator.result.boost", { index: row.boost, rate: row.boostMultiplier }) }}
                    </span>
                  </div>
                  <div class="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                    {{ formatScore(row.scoreMin) }} ~ {{ formatScore(row.scoreMax) }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    {{ t("tools.pointCalculator.result.scoreRangeLabel") }}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  class="self-center"
                  :disabled="row.eventBonus <= 0"
                  @click="goToDeckRecommend(row)"
                >
                  {{ t("tools.pointCalculator.actions.buildDeck") }}
                  <ArrowRight class="size-4" />
                </Button>
              </div>
            </div>

            <Alert v-else-if="calculatedOnce" variant="destructive">
              <LucideAlertCircle class="h-4 w-4" />
              <AlertTitle>{{ t("tools.pointCalculator.result.noMatchTitle") }}</AlertTitle>
              <AlertDescription>{{ t("tools.pointCalculator.result.noMatchDescription") }}</AlertDescription>
            </Alert>

            <div v-else class="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              {{ t("tools.pointCalculator.result.empty") }}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
