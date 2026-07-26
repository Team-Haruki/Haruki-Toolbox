<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { RouterLink } from "vue-router"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import { ChevronDown, ChevronRight, LucideRefreshCw } from "lucide-vue-next"
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
import { formatCompactNumber } from "@/lib/number-format"
import { useSettingsStore } from "@/shared/stores/settings"
import type { SekaiRegion } from "@/types"
import MusicJacket from "../components/MusicJacket.vue"
import { useMusicProgressMasterData } from "../composables/useMusicProgressMasterData"
import { resolveMusicJacketUrl } from "../lib/music-assets"
import { suiteUploadTimeToMillis } from "@/shared/sekai/user-snapshot/api"
import {
  MUSIC_DIFFICULTIES,
  MUSIC_DIFFICULTY_COLORS,
  isMusicDifficulty,
  type MusicDifficulty,
} from "../lib/music-difficulties"
import {
  MUSIC_PROGRESS_STATUS_COLORS,
  buildMusicProgress,
  type MusicProgress,
  type MusicProgressLevelRow,
  type MusicProgressStatus,
} from "../lib/music-progress"
import {
  buildClaimedMusicAchievementMap,
  hasMusicRewardTotals,
  normalizeMusicAchievementMasters,
  sumRemainingMusicRewards,
  type MusicRewardTotals,
} from "../lib/music-rewards"

const { t, locale } = useI18n()
const settingsStore = useSettingsStore()

const { selectedAccount } = useGameAccountSelection()
const suite = useUserSuite(["userMusics", "userMusicResults", "userMusicAchievements"], selectedAccount)

const region = computed<SekaiRegion | null>(() => selectedAccount.value?.server ?? null)
const master = useMusicProgressMasterData(region, { withAchievements: true })

const activeDifficulty = ref<MusicDifficulty>("master")
const expandedLevels = ref<Set<string>>(new Set())

const STATUS_COLORS = MUSIC_PROGRESS_STATUS_COLORS

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

// --- Obtainable achievement rewards (crystals / coins / shards) ---

const achievementMasters = computed(() => {
  if (master.rawMusicAchievements.value == null) {
    return []
  }

  return normalizeMusicAchievementMasters(
    master.rawMusicAchievements.value,
    master.rawResourceBoxes.value,
    master.rawResourceBoxDetails.value,
  )
})

/** null when the snapshot does not include `userMusicAchievements`. */
const claimedAchievements = computed(() => {
  const raw = suite.data.value?.userMusicAchievements
  return raw == null ? null : buildClaimedMusicAchievementMap(raw)
})

const rewardStats = computed(() => {
  const current = progress.value
  const claimed = claimedAchievements.value
  if (current == null || claimed == null || achievementMasters.value.length === 0) {
    return null
  }

  const allMusicIds = new Set<number>()
  const perDifficulty: Array<{ difficulty: MusicDifficulty; totals: MusicRewardTotals }> = []
  for (const difficulty of MUSIC_DIFFICULTIES) {
    const musicIds = current[difficulty].levels.flatMap((row) => row.songs.map((song) => song.musicId))
    for (const musicId of musicIds) {
      allMusicIds.add(musicId)
    }
    if (musicIds.length === 0) {
      continue
    }

    const combos = achievementMasters.value
      .filter((achievement) => achievement.type === "combo" && achievement.difficulty === difficulty)
    const totals = sumRemainingMusicRewards(musicIds, combos, claimed)
    perDifficulty.push({ difficulty, totals })
  }

  const scoreRankMasters = achievementMasters.value
    .filter((achievement) => achievement.type === "score_rank")
  const scoreRank = sumRemainingMusicRewards([...allMusicIds], scoreRankMasters, claimed)

  const total = { jewel: scoreRank.jewel, coin: scoreRank.coin, shard: scoreRank.shard }
  for (const entry of perDifficulty) {
    total.jewel += entry.totals.jewel
    total.coin += entry.totals.coin
    total.shard += entry.totals.shard
  }

  return { total, perDifficulty, scoreRank }
})

const activeComboMasters = computed(() => achievementMasters.value
  .filter((achievement) => achievement.type === "combo" && achievement.difficulty === activeDifficulty.value))

/** Remaining combo rewards of the active difficulty for one level row. */
function levelRemaining(row: MusicProgressLevelRow): MusicRewardTotals | null {
  const claimed = claimedAchievements.value
  if (claimed == null || activeComboMasters.value.length === 0) {
    return null
  }

  return sumRemainingMusicRewards(row.songs.map((song) => song.musicId), activeComboMasters.value, claimed)
}

function levelRemainingText(row: MusicProgressLevelRow): string | null {
  const totals = levelRemaining(row)
  if (totals == null) {
    return null
  }

  return hasRemaining(totals) ? formatRewardTotals(totals) : t("musicProgress.rewards.allClaimed")
}

function formatRewardTotals(totals: MusicRewardTotals): string {
  const parts: string[] = []
  if (totals.jewel > 0) {
    parts.push(`${t("musicProgress.rewards.jewel")} ${formatCompactNumber(totals.jewel, locale.value)}`)
  }
  if (totals.coin > 0) {
    parts.push(`${t("musicProgress.rewards.coin")} ${formatCompactNumber(totals.coin, locale.value)}`)
  }
  if (totals.shard > 0) {
    parts.push(`${t("musicProgress.rewards.shard")} ${formatCompactNumber(totals.shard, locale.value)}`)
  }
  return parts.join(" · ")
}

function hasRemaining(totals: MusicRewardTotals): boolean {
  return hasMusicRewardTotals(totals)
}

function levelHasRemaining(row: MusicProgressLevelRow): boolean {
  const totals = levelRemaining(row)
  return totals != null && hasRemaining(totals)
}

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
  return timestamp != null ? dateTimeFormatter.value.format(new Date(suiteUploadTimeToMillis(timestamp))) : null
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

function refresh() {
  void suite.reload()
  void master.reload()
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-4 py-4">
      <!-- Header -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold">{{ t("musicProgress.title") }}</h1>
          <p class="text-sm text-muted-foreground">{{ t("musicProgress.description") }}</p>
        </div>
        <div class="flex flex-col items-start gap-1 sm:items-end">
          <div class="flex flex-wrap items-center gap-2">
            <GameAccountSelect />
            <Button variant="ghost" size="sm" class="h-7 gap-1 text-xs text-muted-foreground" @click="refresh">
              <LucideRefreshCw class="size-3.5" />
              {{ t("musicProgress.refresh") }}
            </Button>
          </div>
          <p v-if="uploadTimeLabel" class="text-xs text-muted-foreground">
            {{ t("musicProgress.dataAsOf", { time: uploadTimeLabel }) }}
          </p>
        </div>
      </div>

      <!-- No account selected -->
      <Card v-if="suite.status.value === 'idle'">
        <CardContent class="py-12 text-center text-sm text-muted-foreground">
          {{ t("musicProgress.noAccount") }}
        </CardContent>
      </Card>

      <!-- Errors -->
      <Card v-else-if="suite.status.value === 'error' || master.error.value">
        <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
          <p v-if="suite.status.value === 'error'" class="text-sm text-muted-foreground">
            {{ t("musicProgress.suiteError") }}
          </p>
          <p v-if="master.error.value" class="max-w-full truncate font-mono text-xs text-muted-foreground">
            {{ t("musicProgress.masterError", { message: master.error.value }) }}
          </p>
          <Button type="button" variant="outline" size="sm" @click="refresh">
            {{ t("musicProgress.retry") }}
          </Button>
        </CardContent>
      </Card>

      <p
        v-if="suite.status.value === 'ready' && !hasResults"
        class="rounded-md border border-dashed p-3 text-xs text-muted-foreground"
      >
        {{ t("musicProgress.noResults") }}
      </p>

      <div v-if="showDownloadProgress" class="grid gap-2 rounded-md border bg-muted/20 p-3">
        <p class="text-xs text-muted-foreground">
          {{ t("musicProgress.downloading", { progress: Math.round(master.regionState.value?.progress ?? 0) }) }}
        </p>
        <Progress :model-value="master.regionState.value?.progress ?? 0" />
      </div>

      <template v-if="progress">
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-base">{{ t("musicProgress.overallTitle") }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <div
                v-for="entry in overallRows"
                :key="entry.difficulty"
                class="flex flex-wrap items-center gap-2 rounded-md border p-2"
              >
                <span
                  class="inline-flex w-16 shrink-0 items-center justify-center rounded px-1 py-0.5 text-[11px] font-semibold text-white"
                  :style="{ backgroundColor: MUSIC_DIFFICULTY_COLORS[entry.difficulty] }"
                >
                  {{ difficultyLabel(entry.difficulty) }}
                </span>
                <p class="text-xs tabular-nums text-muted-foreground">
                  AP {{ entry.summary.allPerfect }} · FC {{ entry.summary.fullCombo }} ·
                  CL {{ entry.summary.cleared }}/{{ entry.summary.total }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card v-if="rewardStats">
          <CardHeader class="pb-2">
            <CardTitle class="text-base">{{ t("musicProgress.rewards.title") }}</CardTitle>
            <CardDescription class="text-xs">
              {{ t("musicProgress.rewards.hint") }}
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="grid grid-cols-3 gap-2">
              <div class="rounded-md border p-2 text-center">
                <p class="text-xs text-muted-foreground">{{ t("musicProgress.rewards.jewel") }}</p>
                <p class="text-xl font-semibold tabular-nums">{{ formatCompactNumber(rewardStats.total.jewel, locale) }}</p>
              </div>
              <div class="rounded-md border p-2 text-center">
                <p class="text-xs text-muted-foreground">{{ t("musicProgress.rewards.coin") }}</p>
                <p class="text-xl font-semibold tabular-nums">{{ formatCompactNumber(rewardStats.total.coin, locale) }}</p>
              </div>
              <div class="rounded-md border p-2 text-center">
                <p class="text-xs text-muted-foreground">{{ t("musicProgress.rewards.shard") }}</p>
                <p class="text-xl font-semibold tabular-nums">{{ formatCompactNumber(rewardStats.total.shard, locale) }}</p>
              </div>
            </div>
            <div class="grid gap-1 text-xs text-muted-foreground">
              <p
                v-for="entry in rewardStats.perDifficulty"
                :key="entry.difficulty"
                class="flex flex-wrap items-center gap-2"
              >
                <span
                  class="inline-flex w-16 shrink-0 items-center justify-center rounded px-1 py-0.5 text-[11px] font-semibold text-white"
                  :style="{ backgroundColor: MUSIC_DIFFICULTY_COLORS[entry.difficulty] }"
                >
                  {{ difficultyLabel(entry.difficulty) }}
                </span>
                <span class="tabular-nums">
                  {{ hasRemaining(entry.totals) ? formatRewardTotals(entry.totals) : t("musicProgress.rewards.allClaimed") }}
                </span>
              </p>
              <p class="flex flex-wrap items-center gap-2">
                <span class="inline-flex w-16 shrink-0 items-center justify-center rounded border px-1 py-0.5 text-[11px] font-semibold">
                  {{ t("musicProgress.rewards.scoreRank") }}
                </span>
                <span class="tabular-nums">
                  {{ hasRemaining(rewardStats.scoreRank) ? formatRewardTotals(rewardStats.scoreRank) : t("musicProgress.rewards.allClaimed") }}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
        <p
          v-else-if="claimedAchievements == null && suite.status.value === 'ready'"
          class="rounded-md border border-dashed p-3 text-xs text-muted-foreground"
        >
          {{ t("musicProgress.rewards.unavailable") }}
        </p>

        <Tabs :model-value="activeDifficulty" @update:model-value="updateDifficulty">
          <TabsList class="flex-wrap">
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
          <CardHeader class="pb-2">
            <CardTitle class="text-base">{{ t("musicProgress.levelsTitle") }}</CardTitle>
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
                  class="inline-flex w-16 shrink-0 items-center justify-center rounded px-2 py-0.5 text-xs font-semibold text-white"
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
                <span class="w-48 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  AP {{ row.allPerfect }} · FC {{ row.fullComboOnly }} ·
                  CL {{ row.clearOnly }} · — {{ row.unplayed }}
                </span>
                <span
                  v-if="levelRemainingText(row)"
                  :class="[
                    'w-44 shrink-0 text-right text-xs tabular-nums',
                    levelHasRemaining(row)
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground/70',
                  ]"
                >
                  {{ levelRemainingText(row) }}
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
</template>
