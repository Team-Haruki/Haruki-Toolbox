<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink } from "vue-router"
import type { AcceptableValue } from "reka-ui"
import { LucideChevronDown } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import MusicJacket from "@/modules/music-library/components/MusicJacket.vue"
import type { MusicRewardTotals, MusicScoreRank } from "@/modules/music-library/lib/music-rewards"
import {
  MUSIC_SCORE_RANK_FILTERS,
  MUSIC_SCORE_RANK_SORTS,
  filterMusicScoreRankSongs,
  isMusicScoreRankFilter,
  isMusicScoreRankSort,
  sortMusicScoreRankSongs,
  type MusicScoreRankBucket,
  type MusicScoreRankFilter,
  type MusicScoreRankSort,
} from "@/modules/music-library/lib/music-score-rank"

export type MusicProgressScoreRankStepView = {
  rank: MusicScoreRank
  reached: boolean
  /** Tooltip with this rank's reward, already formatted. */
  title: string
}

export type MusicProgressScoreRankRow = {
  musicId: number
  title: string
  jacketUrl: string | null
  /** C → S, lowest first. */
  steps: readonly MusicProgressScoreRankStepView[]
  currentRank: MusicScoreRank | null
  /** "Current rank B" / "No rank yet", for the badge tooltip and screen readers. */
  currentLabel: string
  /** Sort key; `remainingText` is the formatted version. */
  remaining: MusicRewardTotals
  /** Rewards of every rank above the current one ("Remaining: Crystals 70"), or "Complete". */
  remainingText: string
  complete: boolean
}

/**
 * Per-song score-rank progress. Score rank is progressive (C → B → A → S),
 * so each row shows one current rank: a stepper filled up to it, a badge
 * coloured by it, and what the ranks above it still pay in total.
 * Filter, sort and the paging of the long list are local UI state; the rows
 * come in prepared from the page so this component only lays them out.
 */
const props = defineProps<{
  rows: readonly MusicProgressScoreRankRow[]
  /** Songs per filter, for the chip counts. */
  counts: Readonly<Record<MusicScoreRankFilter, number>>
  /** Obtained vs remaining totals, already formatted. */
  summaryText: string
  /** Reset the local state when the account / snapshot changes. */
  resetKey: string
}>()

const { t } = useI18n()

const PAGE_SIZE = 60

const expanded = ref(false)
const filter = ref<MusicScoreRankFilter>("all")
const sort = ref<MusicScoreRankSort>("remaining")
const limit = ref(PAGE_SIZE)

const visibleRows = computed(() => sortMusicScoreRankSongs(filterMusicScoreRankSongs(props.rows, filter.value), sort.value))
const pagedRows = computed(() => visibleRows.value.slice(0, limit.value))
const hiddenCount = computed(() => Math.max(0, visibleRows.value.length - limit.value))

watch(
  () => [props.resetKey, filter.value, sort.value] as const,
  () => {
    limit.value = PAGE_SIZE
  },
)
watch(
  () => props.resetKey,
  () => {
    expanded.value = false
  },
)

function setFilter(value: AcceptableValue | AcceptableValue[] | undefined) {
  if (typeof value === "string" && isMusicScoreRankFilter(value)) {
    filter.value = value
  }
}

function setSort(value: AcceptableValue | AcceptableValue[] | undefined) {
  if (typeof value === "string" && isMusicScoreRankSort(value)) {
    sort.value = value
  }
}

function filterLabel(option: MusicScoreRankFilter): string {
  return option === "all" || option === "remaining" || option === "none"
    ? t(`musicProgress.scoreRank.filter.${option}`)
    : option
}

/**
 * One palette per current rank, escalating from muted (none) through cool
 * hues to a solid gold S that reads as "maxed". The stepper fill and the
 * badge share the hue so the colour alone encodes the progress.
 */
const RANK_STYLES: Record<MusicScoreRankBucket, { badge: string; fill: string; row: string }> = {
  none: {
    badge: "border-border bg-muted text-muted-foreground",
    fill: "bg-muted-foreground/40 text-background",
    row: "",
  },
  C: {
    badge: "border-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-sky-300",
    fill: "bg-sky-500 text-white",
    row: "border-sky-500/30",
  },
  B: {
    badge: "border-indigo-500/40 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
    fill: "bg-indigo-500 text-white",
    row: "border-indigo-500/30",
  },
  A: {
    badge: "border-violet-500/40 bg-violet-500/15 text-violet-700 dark:text-violet-300",
    fill: "bg-violet-500 text-white",
    row: "border-violet-500/30",
  },
  S: {
    badge: "border-amber-500/60 bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-950",
    fill: "bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-950",
    row: "border-amber-500/50 bg-amber-500/5",
  },
}

function styleOf(row: MusicProgressScoreRankRow) {
  return RANK_STYLES[row.currentRank ?? "none"]
}
</script>

<template>
  <Card>
    <CardHeader class="pb-2">
      <button
        type="button"
        class="-m-1 flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-md p-1 text-left transition-colors hover:bg-muted/50"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        <LucideChevronDown
          class="size-4 shrink-0 text-muted-foreground transition-transform duration-200"
          :class="expanded ? '' : '-rotate-90'"
        />
        <CardTitle class="text-base">{{ t("musicProgress.scoreRank.title") }}</CardTitle>
        <span class="basis-full text-xs tabular-nums text-muted-foreground sm:ml-auto sm:basis-auto sm:text-right">{{ summaryText }}</span>
      </button>
      <CardDescription class="text-xs">{{ t("musicProgress.scoreRank.description") }}</CardDescription>
      <div v-if="expanded" class="mt-2 flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="mr-1 text-xs font-medium text-muted-foreground">{{ t("musicProgress.scoreRank.filter.label") }}</span>
          <ToggleGroup type="single" variant="chip" size="sm" :model-value="filter" :aria-label="t('musicProgress.scoreRank.filter.label')" @update:model-value="setFilter">
            <ToggleGroupItem v-for="option in MUSIC_SCORE_RANK_FILTERS" :key="option" :value="option" class="gap-1 tabular-nums">
              {{ filterLabel(option) }}
              <span class="opacity-70">{{ counts[option] }}</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="mr-1 text-xs font-medium text-muted-foreground">{{ t("musicProgress.scoreRank.sort.label") }}</span>
            <ToggleGroup type="single" variant="segment" size="sm" :model-value="sort" :aria-label="t('musicProgress.scoreRank.sort.label')" @update:model-value="setSort">
              <ToggleGroupItem v-for="option in MUSIC_SCORE_RANK_SORTS" :key="option" :value="option">
                {{ t(`musicProgress.scoreRank.sort.${option}`) }}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <span class="text-xs tabular-nums text-muted-foreground sm:ml-auto">
            {{ t("musicProgress.scoreRank.visible", { shown: pagedRows.length, total: visibleRows.length }) }}
          </span>
        </div>
      </div>
    </CardHeader>
    <CardContent v-if="expanded" class="space-y-2">
      <p v-if="visibleRows.length === 0" class="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        {{ t("musicProgress.scoreRank.empty") }}
      </p>
      <div v-else class="grid grid-cols-1 gap-1.5 sm:grid-cols-[repeat(auto-fill,minmax(19rem,1fr))]">
        <RouterLink
          v-for="row in pagedRows"
          :key="row.musicId"
          :to="`/music/${row.musicId}`"
          class="flex items-center gap-2 rounded-md border bg-card p-1.5 pr-2 transition-colors hover:bg-accent/50 dark:hover:bg-accent/30"
          :class="styleOf(row).row"
        >
          <MusicJacket :url="row.jacketUrl" :alt="row.title" class="size-10 shrink-0 rounded" />
          <span class="flex min-w-0 flex-1 flex-col gap-1">
            <span class="truncate text-sm" :title="row.title">{{ row.title }}</span>
            <!-- Stepper: C → S, filled up to the current rank. -->
            <span class="flex h-4 gap-0.5" role="img" :aria-label="row.currentLabel">
              <span
                v-for="step in row.steps"
                :key="step.rank"
                class="flex flex-1 items-center justify-center rounded-sm text-[10px] font-semibold leading-none first:rounded-l-md last:rounded-r-md"
                :class="step.reached ? styleOf(row).fill : 'bg-muted text-muted-foreground/50'"
                :title="step.title"
              >
                {{ step.rank }}
              </span>
            </span>
          </span>
          <span class="flex shrink-0 items-center gap-2">
            <span
              class="text-right text-xs tabular-nums"
              :class="row.complete ? 'text-muted-foreground/70' : 'font-medium text-emerald-600 dark:text-emerald-400'"
            >
              {{ row.remainingText }}
            </span>
            <span
              class="inline-flex size-8 items-center justify-center rounded-md border text-sm font-bold leading-none"
              :class="styleOf(row).badge"
              :title="row.currentLabel"
              :aria-label="row.currentLabel"
            >
              {{ row.currentRank ?? "—" }}
            </span>
          </span>
        </RouterLink>
      </div>
      <div v-if="hiddenCount > 0" class="flex justify-center">
        <Button variant="outline" size="sm" @click="limit += PAGE_SIZE">
          {{ t("musicProgress.scoreRank.showMore", { count: hiddenCount }) }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
