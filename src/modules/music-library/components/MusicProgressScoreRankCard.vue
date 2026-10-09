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
  type MusicScoreRankFilter,
  type MusicScoreRankSort,
} from "@/modules/music-library/lib/music-score-rank"

export type MusicProgressScoreRankBadge = {
  rank: MusicScoreRank
  reached: boolean
  /** Tooltip, already formatted ("S reached" / "S not reached (Crystals 50)"). */
  title: string
}

export type MusicProgressScoreRankRow = {
  musicId: number
  title: string
  jacketUrl: string | null
  ranks: readonly MusicProgressScoreRankBadge[]
  /** Sort key; `remainingText` is the formatted version. */
  remaining: MusicRewardTotals
  remainingText: string
  complete: boolean
}

/**
 * Per-song score-rank (C/B/A/S) rewards: which ranks the snapshot records
 * for each song and the crystals still obtainable. Filter, sort and the
 * paging of the long list are local UI state; the rows come in prepared
 * from the page so this component only lays them out.
 */
const props = defineProps<{
  rows: readonly MusicProgressScoreRankRow[]
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

const RANK_REACHED_CLASSES: Record<MusicScoreRank, string> = {
  C: "border-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-sky-300",
  B: "border-violet-500/40 bg-violet-500/15 text-violet-700 dark:text-violet-300",
  A: "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  S: "border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300",
}

function badgeClass(badge: MusicProgressScoreRankBadge): string {
  return badge.reached
    ? RANK_REACHED_CLASSES[badge.rank]
    : "border-dashed border-border text-muted-foreground/50"
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
      <div v-if="expanded" class="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="mr-1 text-xs font-medium text-muted-foreground">{{ t("musicProgress.scoreRank.filter.label") }}</span>
          <ToggleGroup type="single" variant="segment" size="sm" :model-value="filter" :aria-label="t('musicProgress.scoreRank.filter.label')" @update:model-value="setFilter">
            <ToggleGroupItem v-for="option in MUSIC_SCORE_RANK_FILTERS" :key="option" :value="option">
              {{ t(`musicProgress.scoreRank.filter.${option}`) }}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
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
        >
          <MusicJacket :url="row.jacketUrl" :alt="row.title" class="size-10 shrink-0 rounded" />
          <span class="flex min-w-0 flex-1 flex-col gap-1">
            <span class="truncate text-sm" :title="row.title">{{ row.title }}</span>
            <span class="flex items-center gap-1" role="list">
              <span
                v-for="badge in row.ranks"
                :key="badge.rank"
                role="listitem"
                class="inline-flex size-5 items-center justify-center rounded border text-[11px] font-semibold leading-none"
                :class="badgeClass(badge)"
                :title="badge.title"
                :aria-label="badge.title"
              >
                {{ badge.rank }}
              </span>
            </span>
          </span>
          <span
            class="shrink-0 text-right text-xs tabular-nums"
            :class="row.complete ? 'text-muted-foreground/70' : 'text-emerald-600 dark:text-emerald-400'"
          >
            {{ row.remainingText }}
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
