<script setup lang="ts">
import { computed, ref, watch } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useLocalStorage } from "@vueuse/core"
import { useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { ChevronDown, RefreshCcw, Target } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatNumberCN } from "@/lib/number-format"
import { resolveSekaiRegionLabel, SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import { MusicSelect, parseEventPlannerPointInput } from "@/modules/deck-recommend"
import EmptyState from "@/shared/components/EmptyState.vue"
import PageHeader from "@/shared/components/PageHeader.vue"
import { readSekaiMusicMetas } from "@/shared/sekai/cache"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import type { SekaiRegion } from "@/types"
import ScoreControlPlanCard from "../components/score-control/ScoreControlPlanCard.vue"
import ScoreControlSolutionTable from "../components/score-control/ScoreControlSolutionTable.vue"
import {
  findScoreControlRanges,
  SCORE_CONTROL_BOOST_MULTIPLIERS,
  SCORE_CONTROL_DEFAULT_MUSIC_ID,
  SCORE_CONTROL_MAX_EVENT_BONUS,
  SCORE_CONTROL_MAX_WORLD_LINK_EVENT_BONUS,
  selectScoreControlBasicPoint,
  type ScoreControlMusicMeta,
  type ScoreControlRange,
} from "../lib/score-control"
import {
  isIdleRange,
  planScoreControl,
  resolveScoreControlPointBounds,
  sortScoreControlRangesByEase,
  type ScoreControlSettings,
} from "../lib/score-control-plan"

const DEFAULT_BONUS_FLOOR = 100
const BONUS_LIMIT = 1000
const MAX_GAMES_OPTIONS = [3, 5, 10, 20] as const
const DEFAULT_MAX_GAMES = 5
const ALL_BOOSTS = Object.keys(SCORE_CONTROL_BOOST_MULTIPLIERS).map(Number).sort((a, b) => a - b)

type EntryMode = "gap" | "range"

type StoredSettings = {
  region: SekaiRegion
  musicId: string
  entryMode: EntryMode
  minBonus: number
  maxBonus: number
  worldLink: boolean
  boosts: number[]
  maxGames: number
}

const { t } = useI18n()
const router = useRouter()
const sekaiDataStore = useSekaiDataStore()

// How the player plays is the same from one visit to the next; the pt they
// are chasing is not, so only the conditions are remembered.
const settings = useLocalStorage<StoredSettings>("haruki:score-control:settings", {
  region: "jp",
  musicId: String(SCORE_CONTROL_DEFAULT_MUSIC_ID),
  entryMode: "gap",
  minBonus: DEFAULT_BONUS_FLOOR,
  maxBonus: SCORE_CONTROL_MAX_EVENT_BONUS,
  worldLink: false,
  boosts: ALL_BOOSTS,
  maxGames: DEFAULT_MAX_GAMES,
}, { mergeDefaults: true })

sanitizeSettings()

function sanitizeSettings() {
  const value = settings.value
  if (!SEKAI_REGION_OPTIONS.some((option) => option.value === value.region)) {
    value.region = "jp"
  }
  if (value.entryMode !== "gap" && value.entryMode !== "range") {
    value.entryMode = "gap"
  }
  value.boosts = Array.isArray(value.boosts)
    ? ALL_BOOSTS.filter((boost) => value.boosts.includes(boost))
    : ALL_BOOSTS
  if (!MAX_GAMES_OPTIONS.includes(value.maxGames as (typeof MAX_GAMES_OPTIONS)[number])) {
    value.maxGames = DEFAULT_MAX_GAMES
  }
  if (!isBonus(value.minBonus) || !isBonus(value.maxBonus) || value.minBonus > value.maxBonus) {
    value.minBonus = DEFAULT_BONUS_FLOOR
    value.maxBonus = value.worldLink ? SCORE_CONTROL_MAX_WORLD_LINK_EVENT_BONUS : SCORE_CONTROL_MAX_EVENT_BONUS
  }
}

function isBonus(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= BONUS_LIMIT
}

// --- Song data ---------------------------------------------------------------

const loading = ref(false)
const loadError = ref<string | null>(null)
const musicMetas = ref<ScoreControlMusicMeta[]>([])

const basicPoint = computed(() => selectScoreControlBasicPoint(settings.value.musicId, musicMetas.value))

watch(() => settings.value.region, () => {
  void loadScoreControlData()
}, { immediate: true })

async function loadScoreControlData() {
  const region = settings.value.region
  loading.value = true
  loadError.value = null
  try {
    const state = sekaiDataStore.regionStates[region]
    if (!state.masterFetchVersion || !state.files.includes("musics")) {
      await sekaiDataStore.ensureRegionData(region, { files: ["musics"] })
    }
    const metas = await readSekaiMusicMetas<ScoreControlMusicMeta[]>(region)
    if (settings.value.region === region) {
      musicMetas.value = Array.isArray(metas) ? metas : []
    }
  } catch (error) {
    if (settings.value.region === region) {
      musicMetas.value = []
      loadError.value = error instanceof Error ? error.message : String(error)
    }
  } finally {
    if (settings.value.region === region) {
      loading.value = false
    }
  }
}

function updateRegion(value: AcceptableValue) {
  if (typeof value === "string" && SEKAI_REGION_OPTIONS.some((option) => option.value === value)) {
    settings.value.region = value as SekaiRegion
  }
}

function updateMusic(value: string | null) {
  settings.value.musicId = value || ""
}

// --- What to earn ------------------------------------------------------------

const gapInput = ref("")
const currentInput = ref("")
const targetInput = ref("")

const gapEntry = computed(() => parseEventPlannerPointInput(gapInput.value))
const currentEntry = computed(() => parseEventPlannerPointInput(currentInput.value))
const targetEntry = computed(() => parseEventPlannerPointInput(targetInput.value))

/** Shown when the text was shorthand ("2.3w"), so the player sees the number being used. */
function parsedHint(raw: string, value: number | null) {
  return value != null && !/^\d+$/.test(raw.trim()) ? t("tools.pointCalculator.entry.parsed", { value: formatNumberCN(value) }) : null
}

function updateEntryMode(value: AcceptableValue) {
  if (value === "gap" || value === "range") {
    settings.value.entryMode = value
  }
}

/** The two totals to plan between; with only a gap entered it starts from zero and no running total is shown. */
const request = computed(() => {
  if (settings.value.entryMode === "gap") {
    const gap = gapEntry.value.value
    return gap != null && gap > 0 ? { current: 0, target: gap, start: null as number | null } : null
  }
  const current = currentEntry.value.value
  const target = targetEntry.value.value
  return current != null && target != null ? { current, target, start: current as number | null } : null
})

// --- Conditions --------------------------------------------------------------

const conditionsOpen = ref(typeof window === "undefined" || window.matchMedia("(min-width: 1024px)").matches)

const bonusFloorInput = ref<number | string>(settings.value.minBonus)
const bonusCapInput = ref<number | string>(settings.value.maxBonus)

const bonusRangeInvalid = computed(() => {
  const floor = Number(bonusFloorInput.value)
  const cap = Number(bonusCapInput.value)
  return String(bonusFloorInput.value).trim() === ""
    || String(bonusCapInput.value).trim() === ""
    || !isBonus(floor)
    || !isBonus(cap)
    || floor > cap
})

watch([bonusFloorInput, bonusCapInput], () => {
  if (!bonusRangeInvalid.value) {
    settings.value.minBonus = Number(bonusFloorInput.value)
    settings.value.maxBonus = Number(bonusCapInput.value)
  }
})

function updateWorldLink(value: boolean) {
  settings.value.worldLink = value
  // Move the cap with the event type unless the player set their own.
  if (value && Number(bonusCapInput.value) === SCORE_CONTROL_MAX_EVENT_BONUS) {
    bonusCapInput.value = SCORE_CONTROL_MAX_WORLD_LINK_EVENT_BONUS
  } else if (!value && Number(bonusCapInput.value) === SCORE_CONTROL_MAX_WORLD_LINK_EVENT_BONUS) {
    bonusCapInput.value = SCORE_CONTROL_MAX_EVENT_BONUS
  }
}

const boostValues = computed(() => settings.value.boosts.map(String))

function updateBoosts(value: AcceptableValue | AcceptableValue[] | undefined) {
  const picked = new Set((Array.isArray(value) ? value : []).map(Number))
  settings.value.boosts = ALL_BOOSTS.filter((boost) => picked.has(boost))
}

function updateMaxGames(value: AcceptableValue) {
  const parsed = Number(value)
  if (MAX_GAMES_OPTIONS.includes(parsed as (typeof MAX_GAMES_OPTIONS)[number])) {
    settings.value.maxGames = parsed
  }
}

const boostSummary = computed(() => {
  const boosts = settings.value.boosts
  if (boosts.length === ALL_BOOSTS.length) {
    return t("tools.pointCalculator.conditions.boostsAll")
  }
  return t("tools.pointCalculator.conditions.boostsSome", { list: boosts.join("/") || "-" })
})

const conditionsSummary = computed(() => t("tools.pointCalculator.conditions.summary", {
  min: settings.value.minBonus,
  max: settings.value.maxBonus,
  boosts: boostSummary.value,
  games: settings.value.maxGames,
}))

// --- Results -----------------------------------------------------------------

const controlSettings = computed<ScoreControlSettings | null>(() => {
  const basic = basicPoint.value
  if (!basic || bonusRangeInvalid.value || settings.value.boosts.length === 0) {
    return null
  }
  return {
    basicPoint: basic.basicPoint,
    minEventBonus: settings.value.minBonus,
    maxEventBonus: settings.value.maxBonus,
    boosts: settings.value.boosts,
  }
})

const pointBounds = computed(() => (controlSettings.value ? resolveScoreControlPointBounds(controlSettings.value) : null))

const planResult = computed(() => {
  const value = request.value
  const control = controlSettings.value
  if (!value || !control) {
    return null
  }
  return planScoreControl({
    ...control,
    currentPoint: value.current,
    targetPoint: value.target,
    maxGames: settings.value.maxGames,
  })
})

/** Every single game that earns the gap, easiest first. */
const singleRanges = computed<ScoreControlRange[]>(() => {
  const result = planResult.value
  const control = controlSettings.value
  if (!result || !control || result.gap <= 0) {
    return []
  }
  const allowed = new Set(control.boosts)
  return sortScoreControlRangesByEase(
    findScoreControlRanges({
      targetPoint: result.gap,
      basicPoint: control.basicPoint,
      minEventBonus: control.minEventBonus,
      maxEventBonus: control.maxEventBonus,
      limit: 0,
    }).filter((range) => allowed.has(range.boost)),
  )
})

/** Where to play up to before coming back, when the gap is still too wide and both totals are known. */
const resumePoint = computed(() => {
  const result = planResult.value
  const start = request.value?.start
  return result?.status === "tooFar" && start != null && request.value
    ? Math.max(start, request.value.target - result.reach)
    : null
})

const resultNote = computed(() => {
  const result = planResult.value
  if (!result) {
    return null
  }
  const named = { gap: formatNumberCN(Math.abs(result.gap)) }
  switch (result.status) {
    case "ok":
      if (singleRanges.value.length === 0) {
        return t("tools.pointCalculator.result.splitNote", {
          ...named,
          min: formatNumberCN(pointBounds.value?.min ?? 0),
          max: formatNumberCN(pointBounds.value?.max ?? 0),
        })
      }
      // One game can do it; say whether that game is free or needs a precise score.
      return t(
        singleRanges.value.some(isIdleRange) ? "tools.pointCalculator.result.singleNote" : "tools.pointCalculator.result.singleScoreNote",
        { count: singleRanges.value.length },
      )
    case "reached":
      return t("tools.pointCalculator.result.status.reached")
    case "overshot":
      return t("tools.pointCalculator.result.status.overshot", named)
    case "tooClose":
      return t("tools.pointCalculator.result.status.tooClose", { ...named, min: formatNumberCN(result.minPoint) })
    case "tooFar": {
      const note = t("tools.pointCalculator.result.status.tooFar", {
        ...named,
        games: settings.value.maxGames,
        reach: formatNumberCN(result.reach),
      })
      return resumePoint.value != null
        ? note + t("tools.pointCalculator.result.status.tooFarTarget", { value: formatNumberCN(resumePoint.value) })
        : note
    }
    default:
      return t("tools.pointCalculator.result.status.none", named)
  }
})

const nextMaxGames = computed(() => {
  const result = planResult.value
  if (result?.status !== "tooFar") {
    return null
  }
  const perGame = result.reach / settings.value.maxGames
  return MAX_GAMES_OPTIONS.find((count) => count > settings.value.maxGames && count * perGame >= result.gap) ?? null
})

const canLowerFloor = computed(() => planResult.value?.status === "tooClose" && settings.value.minBonus > 0)

function lowerBonusFloor() {
  bonusFloorInput.value = 0
}

function goToDeckRecommend(range: ScoreControlRange) {
  void router.push({
    path: "/deck-recommend",
    query: {
      source: "score-control",
      mode: "bonus",
      dataRegion: settings.value.region,
      liveType: "solo",
      musicId: settings.value.musicId,
      musicDifficulty: basicPoint.value?.difficulty ?? "master",
      bonusTargets: String(range.eventBonus),
      boost: String(range.boost),
    },
  })
}
</script>

<template>
  <div class="flex w-full flex-1 flex-col items-center px-1 py-2 sm:px-0 sm:py-4">
    <div class="mx-auto grid w-full max-w-6xl gap-4">
      <PageHeader :title="t('tools.pointCalculator.title')" :description="t('tools.pointCalculator.description')" />

      <div class="grid items-start gap-4 lg:grid-cols-[23rem_minmax(0,1fr)]">
        <!-- Inputs: what to earn, on which song, under which conditions -->
        <section class="divide-y divide-border/60 rounded-xl border bg-card lg:sticky lg:top-4" data-testid="score-control-form">
          <div class="grid gap-3 p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h2 class="text-sm font-semibold">{{ t("tools.pointCalculator.entry.label") }}</h2>
              <Tabs :model-value="settings.entryMode" @update:model-value="updateEntryMode">
                <TabsList class="h-8">
                  <TabsTrigger value="gap" class="px-2.5 text-xs">{{ t("tools.pointCalculator.entry.gapTab") }}</TabsTrigger>
                  <TabsTrigger value="range" class="px-2.5 text-xs">{{ t("tools.pointCalculator.entry.rangeTab") }}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div v-if="settings.entryMode === 'gap'" class="grid gap-1.5">
              <Label for="score-control-gap" class="text-xs text-muted-foreground">{{ t("tools.pointCalculator.entry.gap") }}</Label>
              <Input
                id="score-control-gap"
                v-model="gapInput"
                class="h-11 text-base font-semibold tabular-nums"
                inputmode="numeric"
                autocomplete="off"
                :aria-invalid="gapEntry.invalid || undefined"
                :placeholder="t('tools.pointCalculator.entry.gapPlaceholder')"
              />
              <p v-if="gapEntry.invalid" class="text-xs text-destructive" role="alert">{{ t("tools.pointCalculator.entry.invalid") }}</p>
              <p v-else-if="parsedHint(gapInput, gapEntry.value)" class="text-xs text-muted-foreground">{{ parsedHint(gapInput, gapEntry.value) }}</p>
            </div>

            <div v-else class="grid grid-cols-2 gap-3">
              <div class="grid content-start gap-1.5">
                <Label for="score-control-current" class="text-xs text-muted-foreground">{{ t("tools.pointCalculator.entry.current") }}</Label>
                <Input
                  id="score-control-current"
                  v-model="currentInput"
                  class="h-10 font-semibold tabular-nums"
                  inputmode="numeric"
                  autocomplete="off"
                  :aria-invalid="currentEntry.invalid || undefined"
                  :placeholder="t('tools.pointCalculator.entry.currentPlaceholder')"
                />
                <p v-if="parsedHint(currentInput, currentEntry.value)" class="text-xs text-muted-foreground">{{ parsedHint(currentInput, currentEntry.value) }}</p>
              </div>
              <div class="grid content-start gap-1.5">
                <Label for="score-control-target" class="text-xs text-muted-foreground">{{ t("tools.pointCalculator.entry.target") }}</Label>
                <Input
                  id="score-control-target"
                  v-model="targetInput"
                  class="h-10 font-semibold tabular-nums"
                  inputmode="numeric"
                  autocomplete="off"
                  :aria-invalid="targetEntry.invalid || undefined"
                  :placeholder="t('tools.pointCalculator.entry.targetPlaceholder')"
                />
                <p v-if="parsedHint(targetInput, targetEntry.value)" class="text-xs text-muted-foreground">{{ parsedHint(targetInput, targetEntry.value) }}</p>
              </div>
              <p v-if="currentEntry.invalid || targetEntry.invalid" class="col-span-2 text-xs text-destructive" role="alert">
                {{ t("tools.pointCalculator.entry.invalid") }}
              </p>
            </div>
          </div>

          <div class="grid gap-3 p-4">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-sm font-semibold">{{ t("tools.pointCalculator.song.label") }}</h2>
              <Select :model-value="settings.region" :disabled="loading" :aria-label="t('tools.pointCalculator.song.region')" @update:model-value="updateRegion">
                <SelectTrigger class="h-8 w-28 text-xs" :aria-label="t('tools.pointCalculator.song.region')">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in SEKAI_REGION_OPTIONS" :key="option.value" :value="option.value">
                    {{ resolveSekaiRegionLabel(option.value, t) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <MusicSelect
              :model-value="settings.musicId"
              :region="settings.region"
              :disabled="loading"
              hide-difficulty
              @update:model-value="updateMusic"
            />
            <div v-if="loadError" class="flex flex-wrap items-center gap-2 text-xs text-destructive">
              <span class="min-w-0 [overflow-wrap:anywhere]">{{ loadError }}</span>
              <Button type="button" variant="outline" size="sm" class="h-7" @click="loadScoreControlData">
                <RefreshCcw class="size-3.5" />
                {{ t("tools.pointCalculator.actions.retry") }}
              </Button>
            </div>
            <p v-else-if="basicPoint" class="text-xs text-muted-foreground">
              {{ t("tools.pointCalculator.song.basicPoint", { value: basicPoint.basicPoint }) }}
            </p>
            <p v-else-if="!loading" class="text-xs text-destructive">{{ t("tools.pointCalculator.song.missingBasicPoint") }}</p>
          </div>

          <div>
            <button
              type="button"
              class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none"
              :aria-expanded="conditionsOpen"
              aria-controls="score-control-conditions"
              @click="conditionsOpen = !conditionsOpen"
            >
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-semibold">{{ t("tools.pointCalculator.conditions.title") }}</span>
                <span v-if="!conditionsOpen" class="block text-xs text-muted-foreground">{{ conditionsSummary }}</span>
              </span>
              <ChevronDown :class="['size-4 shrink-0 text-muted-foreground transition-transform', conditionsOpen ? 'rotate-180' : '']" />
            </button>
            <div v-show="conditionsOpen" id="score-control-conditions" class="grid gap-4 px-4 pb-4">
              <div class="grid gap-1.5">
                <p class="text-sm font-medium">{{ t("tools.pointCalculator.conditions.bonusRange") }}</p>
                <p class="text-xs text-muted-foreground">{{ t("tools.pointCalculator.conditions.bonusRangeHelp") }}</p>
                <div class="flex items-center gap-2">
                  <Input
                    v-model.number="bonusFloorInput"
                    class="min-w-0 tabular-nums"
                    type="number"
                    min="0"
                    :max="BONUS_LIMIT"
                    inputmode="numeric"
                    :aria-invalid="bonusRangeInvalid || undefined"
                    :aria-label="t('tools.pointCalculator.conditions.bonusMin')"
                  />
                  <span class="shrink-0 text-muted-foreground">–</span>
                  <Input
                    v-model.number="bonusCapInput"
                    class="min-w-0 tabular-nums"
                    type="number"
                    min="0"
                    :max="BONUS_LIMIT"
                    inputmode="numeric"
                    :aria-invalid="bonusRangeInvalid || undefined"
                    :aria-label="t('tools.pointCalculator.conditions.bonusMax')"
                  />
                  <span class="shrink-0 text-sm text-muted-foreground">%</span>
                </div>
                <p v-if="bonusRangeInvalid" class="text-xs text-destructive" role="alert">
                  {{ t("tools.pointCalculator.conditions.bonusRangeInvalid", { max: BONUS_LIMIT }) }}
                </p>
                <div class="flex items-center justify-between gap-3 pt-1">
                  <Label for="score-control-world-link" class="flex min-w-0 flex-col items-start gap-0.5 font-normal">
                    <span class="text-sm">{{ t("tools.pointCalculator.conditions.worldLink") }}</span>
                    <span class="text-xs text-muted-foreground">{{ t("tools.pointCalculator.conditions.worldLinkHelp", { max: SCORE_CONTROL_MAX_WORLD_LINK_EVENT_BONUS }) }}</span>
                  </Label>
                  <Switch id="score-control-world-link" :model-value="settings.worldLink" @update:model-value="updateWorldLink" />
                </div>
              </div>

              <div class="grid gap-1.5">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-sm font-medium">{{ t("tools.pointCalculator.conditions.boosts") }}</p>
                  <Button
                    v-if="settings.boosts.length < ALL_BOOSTS.length"
                    type="button"
                    variant="ghost"
                    size="sm"
                    class="-mr-2 h-7 px-2 text-xs"
                    @click="settings.boosts = [...ALL_BOOSTS]"
                  >
                    {{ t("tools.pointCalculator.conditions.selectAllBoosts") }}
                  </Button>
                </div>
                <ToggleGroup
                  type="multiple"
                  variant="chip"
                  size="sm"
                  class="min-w-0 max-w-full flex-wrap"
                  :model-value="boostValues"
                  :aria-label="t('tools.pointCalculator.conditions.boosts')"
                  @update:model-value="updateBoosts"
                >
                  <ToggleGroupItem v-for="boost in ALL_BOOSTS" :key="boost" :value="String(boost)" class="min-w-9 tabular-nums">
                    {{ boost }}
                  </ToggleGroupItem>
                </ToggleGroup>
                <p v-if="settings.boosts.length === 0" class="text-xs text-destructive" role="alert">
                  {{ t("tools.pointCalculator.conditions.boostsNone") }}
                </p>
              </div>

              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-medium">{{ t("tools.pointCalculator.conditions.maxGames") }}</p>
                <Select :model-value="String(settings.maxGames)" :aria-label="t('tools.pointCalculator.conditions.maxGames')" @update:model-value="updateMaxGames">
                  <SelectTrigger class="h-8 w-28 text-xs" :aria-label="t('tools.pointCalculator.conditions.maxGames')">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="count in MAX_GAMES_OPTIONS" :key="count" :value="String(count)">
                      {{ t("tools.pointCalculator.conditions.maxGamesOption", { count }) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        <!-- Results -->
        <div class="grid min-w-0 gap-4" aria-live="polite" data-testid="score-control-results">
          <div v-if="!planResult" class="rounded-xl border bg-card px-4">
            <EmptyState :icon="Target" :title="t('tools.pointCalculator.result.empty')" />
          </div>

          <template v-else>
            <section class="rounded-xl border bg-card px-4 py-3" data-testid="score-control-summary" :data-status="planResult.status">
              <p class="text-xs text-muted-foreground">
                <template v-if="request?.start != null">
                  {{ t("tools.pointCalculator.result.fromTo", { current: formatNumberCN(request.current), target: formatNumberCN(request.target) }) }}
                </template>
                <template v-else>{{ t("tools.pointCalculator.result.gapLabel") }}</template>
              </p>
              <p class="text-2xl leading-tight font-semibold tabular-nums">
                {{ planResult.gap < 0 ? "−" : "" }}{{ formatNumberCN(Math.abs(planResult.gap)) }}
                <span class="text-base font-medium text-muted-foreground">Pt</span>
              </p>
              <p v-if="resultNote" class="mt-1 text-sm text-muted-foreground">{{ resultNote }}</p>
              <div v-if="nextMaxGames != null || canLowerFloor" class="mt-2 flex flex-wrap gap-2">
                <Button v-if="nextMaxGames != null" type="button" variant="outline" size="sm" @click="settings.maxGames = nextMaxGames">
                  {{ t("tools.pointCalculator.result.status.tooFarAction", { count: nextMaxGames }) }}
                </Button>
                <Button v-if="canLowerFloor" type="button" variant="outline" size="sm" @click="lowerBonusFloor">
                  {{ t("tools.pointCalculator.result.status.tooCloseAction") }}
                </Button>
              </div>
            </section>

            <section v-if="planResult.status === 'ok'" class="grid gap-2" data-testid="score-control-plans">
              <h2 class="px-1 text-sm font-semibold">{{ t("tools.pointCalculator.result.plansTitle") }}</h2>
              <ScoreControlPlanCard
                v-for="(plan, index) in planResult.plans"
                :key="index"
                :plan="plan"
                :index="index + 1"
                :start-point="request?.start ?? null"
                @build-deck="goToDeckRecommend"
              />
            </section>

            <ScoreControlSolutionTable v-if="singleRanges.length > 0" :ranges="singleRanges" @build-deck="goToDeckRecommend" />
          </template>
        </div>
      </div>

      <ul class="grid list-disc gap-1 pl-5 text-xs leading-5 text-muted-foreground">
        <li>{{ t("tools.pointCalculator.tips.boost") }}</li>
        <li>{{ t("tools.pointCalculator.tips.beta") }}</li>
      </ul>
    </div>
  </div>
</template>
