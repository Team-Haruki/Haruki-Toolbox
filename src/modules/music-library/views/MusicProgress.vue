<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { RouterLink } from "vue-router"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import { CalendarClock, ChevronDown, ChevronRight, ListChecks, RotateCcw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GameAccountSelect from "@/shared/components/GameAccountSelect.vue"
import { useGameAccountSelection, useUserSuite } from "@/shared/sekai/user-snapshot/use-user-suite"
import { getI18nLocale } from "@/shared/i18n"
import { useSettingsStore } from "@/shared/stores/settings"
import type { SekaiRegion } from "@/types"
import MusicJacket from "../components/MusicJacket.vue"
import { useMusicProgressMasterData } from "../composables/useMusicProgressMasterData"
import { resolveMusicJacketUrl } from "../lib/music-assets"
import {
  MUSIC_DIFFICULTIES,
  MUSIC_DIFFICULTY_COLORS,
  isMusicDifficulty,
  type MusicDifficulty,
} from "../lib/music-difficulties"
import {
  buildMusicProgress,
  type MusicProgress,
  type MusicProgressLevelRow,
  type MusicProgressStatus,
} from "../lib/music-progress"

const { t, locale } = useI18n()
const settingsStore = useSettingsStore()

const { selectedAccount } = useGameAccountSelection()
const suite = useUserSuite(["userMusics", "userMusicResults"], selectedAccount)

const region = computed<SekaiRegion | null>(() => selectedAccount.value?.server ?? null)
const master = useMusicProgressMasterData(region)

const activeDifficulty = ref<MusicDifficulty>("master")
const expandedLevels = ref<Set<string>>(new Set())

const STATUS_COLORS: Record<MusicProgressStatus, string> = {
  allPerfect: "#3B82F6",
  fullCombo: "#A855F7",
  clear: "#F7B50C",
  unplayed: "var(--muted-foreground)",
}

const progress = computed<MusicProgress | null>(() => {
  if (suite.status.value !== "ready" || master.rawMusics.value == null) {
    return null
  }

  return buildMusicProgress({
    rawMusics: master.rawMusics.value,
    rawMusicDifficulties: master.rawMusicDifficulties.value,
    rawUserMusicResults: suite.data.value?.userMusicResults,
  })
})

const activeProgress = computed(() => progress.value?.[activeDifficulty.value] ?? null)
const activeColor = computed(() => MUSIC_DIFFICULTY_COLORS[activeDifficulty.value])

const overallRows = computed(() => {
  const current = progress.value
  if (!current) {
    return []
  }

  return MUSIC_DIFFICULTIES
    .map((difficulty) => current[difficulty])
    .filter((entry) => entry.summary.total > 0)
})

const summaryCards = computed(() => {
  const summary = activeProgress.value?.summary
  if (!summary) {
    return []
  }

  return [
    { key: "total", value: summary.total, percent: null },
    { key: "cleared", value: summary.cleared, percent: formatPercent(summary.cleared, summary.total) },
    { key: "fullCombo", value: summary.fullCombo, percent: formatPercent(summary.fullCombo, summary.total) },
    { key: "allPerfect", value: summary.allPerfect, percent: formatPercent(summary.allPerfect, summary.total) },
  ] as const
})

const hasResults = computed(() => {
  const results = suite.data.value?.userMusicResults
  return Array.isArray(results) && results.length > 0
})

const showSkeleton = computed(
  () => progress.value == null
    && (suite.status.value === "loading" || master.loading.value)
    && suite.status.value !== "idle",
)
const showDownloadProgress = computed(
  () => progress.value == null && master.regionState.value?.refreshing === true,
)

const dateTimeFormatter = computed(() =>
  new Intl.DateTimeFormat(locale.value || getI18nLocale(), {
    dateStyle: "medium",
    timeStyle: "short",
  }),
)
const uploadTimeLabel = computed(() => {
  const timestamp = suite.uploadTime.value
  return timestamp != null ? dateTimeFormatter.value.format(new Date(timestamp)) : null
})

watch(
  () => [activeDifficulty.value, selectedAccount.value?.key ?? null] as const,
  () => {
    expandedLevels.value = new Set()
  },
)

function updateDifficulty(value: AcceptableValue) {
  if (typeof value === "string" && isMusicDifficulty(value)) {
    activeDifficulty.value = value
  }
}

function levelKey(row: MusicProgressLevelRow): string {
  return row.playLevel != null ? String(row.playLevel) : "unknown"
}

function isLevelExpanded(row: MusicProgressLevelRow): boolean {
  return expandedLevels.value.has(levelKey(row))
}

function toggleLevel(row: MusicProgressLevelRow) {
  const next = new Set(expandedLevels.value)
  const key = levelKey(row)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  expandedLevels.value = next
}

function levelLabel(playLevel: number | null): string {
  return playLevel != null
    ? t("musicProgress.level", { level: playLevel })
    : t("musicProgress.levelUnknown")
}

function barSegments(row: MusicProgressLevelRow) {
  return [
    { key: "allPerfect", count: row.allPerfect, color: STATUS_COLORS.allPerfect },
    { key: "fullCombo", count: row.fullComboOnly, color: STATUS_COLORS.fullCombo },
    { key: "clear", count: row.clearOnly, color: STATUS_COLORS.clear },
    { key: "unplayed", count: row.unplayed, color: STATUS_COLORS.unplayed },
  ].filter((segment) => segment.count > 0)
}

function legendItems() {
  return [
    { key: "allPerfect", color: STATUS_COLORS.allPerfect },
    { key: "fullCombo", color: STATUS_COLORS.fullCombo },
    { key: "clear", color: STATUS_COLORS.clear },
    { key: "unplayed", color: STATUS_COLORS.unplayed },
  ] as const
}

function statusChipStyle(status: MusicProgressStatus): Record<string, string> {
  if (status === "unplayed") {
    return {}
  }

  return { backgroundColor: STATUS_COLORS[status], color: "#fff", borderColor: "transparent" }
}

function jacketUrl(assetbundleName: string): string | null {
  if (!region.value) {
    return null
  }

  return resolveMusicJacketUrl(region.value, assetbundleName, settingsStore.currentAssetEndpoint)
}

function formatPercent(value: number, total: number): string {
  if (total <= 0) {
    return "0%"
  }

  return `${(Math.round((value / total) * 1000) / 10).toFixed(1)}%`
}

function difficultyLabel(difficulty: MusicDifficulty): string {
  return t(`musicLibrary.difficulty.${difficulty}`)
}
</script>

<template>
  <div class="flex w-full flex-1 justify-center px-0 py-4">
    <div class="mx-auto w-full max-w-6xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle class="flex flex-wrap items-center gap-2 text-lg">
            <ListChecks class="size-5" />
            {{ t("musicProgress.title") }}
          </CardTitle>
          <CardDescription>{{ t("musicProgress.description") }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <GameAccountSelect />

          <div
            v-if="uploadTimeLabel"
            class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
          >
            <span class="inline-flex items-center gap-1">
              <CalendarClock class="size-3.5 shrink-0" />
              {{ t("musicProgress.dataAsOf", { time: uploadTimeLabel }) }}
            </span>
            <Button type="button" variant="ghost" size="sm" class="h-7 px-2" @click="suite.reload()">
              <RotateCcw class="size-3.5" />
              {{ t("musicProgress.refresh") }}
            </Button>
          </div>

          <div
            v-if="suite.status.value === 'idle'"
            class="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground"
          >
            {{ t("musicProgress.noAccount") }}
          </div>

          <div v-if="suite.status.value === 'error'" class="flex flex-wrap items-center gap-2">
            <p class="text-sm text-destructive">{{ t("musicProgress.suiteError") }}</p>
            <Button type="button" variant="outline" size="sm" @click="suite.reload()">
              {{ t("musicProgress.retry") }}
            </Button>
          </div>

          <p v-if="master.error.value" class="text-sm text-destructive">
            {{ t("musicProgress.masterError", { message: master.error.value }) }}
          </p>

          <p
            v-if="suite.status.value === 'ready' && !hasResults"
            class="text-xs text-muted-foreground"
          >
            {{ t("musicProgress.noResults") }}
          </p>

          <div v-if="showDownloadProgress" class="grid gap-2 rounded-md border bg-muted/20 p-3">
            <p class="text-xs text-muted-foreground">
              {{ t("musicProgress.downloading", { progress: Math.round(master.regionState.value?.progress ?? 0) }) }}
            </p>
            <Progress :model-value="master.regionState.value?.progress ?? 0" />
          </div>
        </CardContent>
      </Card>

      <template v-if="progress">
        <Card>
          <CardHeader>
            <CardTitle class="text-sm font-medium text-muted-foreground">
              {{ t("musicProgress.overallTitle") }}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <div
                v-for="entry in overallRows"
                :key="entry.difficulty"
                class="rounded-md border p-2"
              >
                <p class="flex items-center gap-1.5 text-xs font-semibold">
                  <span
                    class="size-2.5 shrink-0 rounded-full"
                    :style="{ backgroundColor: MUSIC_DIFFICULTY_COLORS[entry.difficulty] }"
                  />
                  {{ difficultyLabel(entry.difficulty) }}
                </p>
                <p class="mt-1 text-xs text-muted-foreground">
                  AP {{ entry.summary.allPerfect }} · FC {{ entry.summary.fullCombo }} ·
                  CL {{ entry.summary.cleared }} / {{ entry.summary.total }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs :model-value="activeDifficulty" @update:model-value="updateDifficulty">
          <TabsList class="w-full flex-wrap sm:w-auto">
            <TabsTrigger
              v-for="difficulty in MUSIC_DIFFICULTIES"
              :key="difficulty"
              :value="difficulty"
            >
              <span
                class="size-2.5 rounded-full"
                :style="{ backgroundColor: MUSIC_DIFFICULTY_COLORS[difficulty] }"
              />
              {{ difficultyLabel(difficulty) }}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card v-for="card in summaryCards" :key="card.key">
            <CardContent class="space-y-1">
              <p class="text-xs text-muted-foreground">
                {{ t(`musicProgress.summary.${card.key}`) }}
              </p>
              <p class="text-2xl font-semibold tabular-nums">
                {{ card.value }}
                <span v-if="card.percent != null" class="text-sm font-normal text-muted-foreground">
                  {{ card.percent }}
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        <Card v-if="activeProgress">
          <CardHeader>
            <CardTitle class="text-sm font-medium text-muted-foreground">
              {{ t("musicProgress.levelsTitle") }}
            </CardTitle>
            <CardDescription class="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              <span
                v-for="item in legendItems()"
                :key="item.key"
                class="inline-flex items-center gap-1.5"
              >
                <span class="size-2.5 rounded-full" :style="{ backgroundColor: item.color }" />
                {{ t(`musicProgress.legend.${item.key}`) }}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-2">
            <div
              v-if="activeProgress.levels.length === 0"
              class="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground"
            >
              {{ t("musicProgress.noSongs") }}
            </div>

            <div
              v-for="row in activeProgress.levels"
              :key="levelKey(row)"
              class="rounded-md border"
            >
              <button
                type="button"
                class="flex w-full flex-wrap items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-accent/50 dark:hover:bg-accent/30"
                :aria-expanded="isLevelExpanded(row)"
                @click="toggleLevel(row)"
              >
                <component
                  :is="isLevelExpanded(row) ? ChevronDown : ChevronRight"
                  class="size-4 shrink-0 text-muted-foreground"
                />
                <span
                  class="inline-flex min-w-12 items-center justify-center rounded px-2 py-0.5 text-xs font-semibold text-white"
                  :style="{ backgroundColor: activeColor }"
                >
                  {{ levelLabel(row.playLevel) }}
                </span>
                <span class="text-xs text-muted-foreground">
                  {{ t("musicProgress.songCount", { count: row.total }) }}
                </span>
                <span class="flex h-3 min-w-40 flex-1 gap-px overflow-hidden rounded-full bg-muted">
                  <span
                    v-for="segment in barSegments(row)"
                    :key="segment.key"
                    class="h-full"
                    :style="{
                      backgroundColor: segment.color,
                      width: `${(segment.count / row.total) * 100}%`,
                      opacity: segment.key === 'unplayed' ? 0.35 : 1,
                    }"
                    :title="`${t(`musicProgress.legend.${segment.key}`)}: ${segment.count}`"
                  />
                </span>
                <span class="text-xs tabular-nums text-muted-foreground">
                  AP {{ row.allPerfect }} · FC {{ row.fullComboOnly }} ·
                  CL {{ row.clearOnly }} · — {{ row.unplayed }}
                </span>
              </button>

              <div
                v-if="isLevelExpanded(row)"
                class="grid grid-cols-1 gap-2 border-t p-3 sm:grid-cols-2 lg:grid-cols-3"
              >
                <RouterLink
                  v-for="song in row.songs"
                  :key="song.musicId"
                  :to="`/music/${song.musicId}`"
                  class="flex items-center gap-2 rounded-md border bg-card p-2 transition-colors hover:bg-accent/50 dark:hover:bg-accent/30"
                >
                  <MusicJacket
                    :url="jacketUrl(song.assetbundleName)"
                    :alt="song.title"
                    class="size-10 shrink-0 rounded"
                  />
                  <span class="min-w-0 flex-1 truncate text-sm" :title="song.title">
                    {{ song.title }}
                  </span>
                  <span
                    class="inline-flex min-w-12 shrink-0 items-center justify-center rounded border px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground"
                    :style="statusChipStyle(song.status)"
                  >
                    {{ t(`musicProgress.status.${song.status}`) }}
                  </span>
                </RouterLink>
              </div>
            </div>
          </CardContent>
        </Card>
      </template>

      <div v-else-if="showSkeleton" class="space-y-3">
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Skeleton v-for="index in 4" :key="index" class="h-20 w-full rounded-lg" />
        </div>
        <Skeleton class="h-9 w-full max-w-md rounded-lg" />
        <div class="space-y-2">
          <Skeleton v-for="index in 6" :key="index" class="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  </div>
</template>
