<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { RouterLink } from "vue-router"
import { useI18n } from "vue-i18n"
import { isAxiosError } from "axios"
import type { AcceptableValue } from "reka-ui"
import { LucideChevronsDownUp, LucideChevronsUpDown, LucideCloudUpload, LucideRefreshCw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import GameAccountSelect from "@/shared/components/GameAccountSelect.vue"
import { useGameAccountSelection, useUserSuite } from "@/shared/sekai/user-snapshot/use-user-suite"
import { getI18nLocale } from "@/shared/i18n"
import { formatCompactNumber } from "@/lib/number-format"
import { useSettingsStore } from "@/shared/stores/settings"
import type { SekaiRegion } from "@/types"
import MusicProgressLevelRow, { type MusicProgressSongView } from "../components/MusicProgressLevelRow.vue"
import MusicProgressOverview, { type MusicProgressOverviewRow } from "../components/MusicProgressOverview.vue"
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
  MUSIC_PROGRESS_SONG_FILTERS,
  MUSIC_PROGRESS_STATUS_COLORS,
  buildMusicProgress,
  filterMusicProgressSongs,
  isMusicProgressSongFilter,
  type MusicProgress,
  type MusicProgressLevelRow as MusicProgressLevelRowData,
  type MusicProgressSongFilter,
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

const { selectedAccount } = useGameAccountSelection({ capability: "suite" })
const suite = useUserSuite(["userMusics", "userMusicResults", "userMusicAchievements"], selectedAccount)

const region = computed<SekaiRegion | null>(() => selectedAccount.value?.server ?? null)
const master = useMusicProgressMasterData(region, { withAchievements: true })
const suiteDataMissing = computed(
  () => isAxiosError(suite.error.value) && suite.error.value.response?.status === 404,
)

const activeDifficulty = ref<MusicDifficulty>("master")
const songFilter = ref<MusicProgressSongFilter>("all")
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

const hasResults = computed(() => {
  const results = suite.data.value?.userMusicResults
  return Array.isArray(results) && results.length > 0
})

// --- Achievement rewards still to claim (crystals / coins / shards) --------------------

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

const rewardsAvailable = computed(() => claimedAchievements.value != null && achievementMasters.value.length > 0)

function comboMastersOf(difficulty: MusicDifficulty) {
  return achievementMasters.value.filter((achievement) => achievement.type === "combo" && achievement.difficulty === difficulty)
}

const rewardStats = computed(() => {
  const current = progress.value
  const claimed = claimedAchievements.value
  if (current == null || claimed == null || achievementMasters.value.length === 0) {
    return null
  }

  const allMusicIds = new Set<number>()
  const perDifficulty = new Map<MusicDifficulty, MusicRewardTotals>()
  for (const difficulty of MUSIC_DIFFICULTIES) {
    const musicIds = current[difficulty].levels.flatMap((row) => row.songs.map((song) => song.musicId))
    for (const musicId of musicIds) {
      allMusicIds.add(musicId)
    }
    if (musicIds.length > 0) {
      perDifficulty.set(difficulty, sumRemainingMusicRewards(musicIds, comboMastersOf(difficulty), claimed))
    }
  }

  const scoreRank = sumRemainingMusicRewards([...allMusicIds], achievementMasters.value.filter((achievement) => achievement.type === "score_rank"), claimed)
  const total = { ...scoreRank }
  for (const totals of perDifficulty.values()) {
    total.jewel += totals.jewel
    total.coin += totals.coin
    total.shard += totals.shard
  }

  return { total, perDifficulty, scoreRank }
})

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

function rewardsText(totals: MusicRewardTotals | null | undefined): string | null {
  if (totals == null) {
    return null
  }

  return hasMusicRewardTotals(totals) ? formatRewardTotals(totals) : t("musicProgress.rewards.allClaimed")
}

const rewardTotalsText = computed(() => {
  const stats = rewardStats.value
  return stats == null ? null : t("musicProgress.rewardsRemaining", { list: rewardsText(stats.total) })
})

// --- Overview rows ---------------------------------------------------------------------

const overviewRows = computed<MusicProgressOverviewRow[]>(() => {
  const current = progress.value
  if (current == null) {
    return []
  }

  return MUSIC_DIFFICULTIES
    .map((difficulty) => current[difficulty])
    .filter((entry) => entry.summary.total > 0)
    .map((entry) => {
      const summary = entry.summary
      const totals = rewardStats.value?.perDifficulty.get(entry.difficulty) ?? null
      return {
        difficulty: entry.difficulty,
        label: difficultyLabel(entry.difficulty),
        color: MUSIC_DIFFICULTY_COLORS[entry.difficulty],
        total: summary.total,
        allPerfect: summary.allPerfect,
        fullCombo: summary.fullCombo,
        cleared: summary.cleared,
        segments: [
          { key: "allPerfect", count: summary.allPerfect, color: STATUS_COLORS.allPerfect },
          { key: "fullCombo", count: summary.fullCombo - summary.allPerfect, color: STATUS_COLORS.fullCombo },
          { key: "clear", count: summary.cleared - summary.fullCombo, color: STATUS_COLORS.clear },
          { key: "unplayed", count: summary.total - summary.cleared, color: STATUS_COLORS.unplayed },
        ].filter((segment) => segment.count > 0),
        rewardsText: rewardsText(totals),
        hasRemaining: totals != null && hasMusicRewardTotals(totals),
      }
    })
})

// --- Level rows of the active difficulty --------------------------------------------------

const activeComboMasters = computed(() => comboMastersOf(activeDifficulty.value))

function levelRemaining(row: MusicProgressLevelRowData): MusicRewardTotals | null {
  const claimed = claimedAchievements.value
  if (claimed == null || activeComboMasters.value.length === 0) {
    return null
  }

  return sumRemainingMusicRewards(row.songs.map((song) => song.musicId), activeComboMasters.value, claimed)
}

const filterActive = computed(() => songFilter.value !== "all")

const levelRows = computed(() => {
  const current = activeProgress.value
  if (current == null) {
    return []
  }

  return current.levels.map((row) => {
    const matching = filterMusicProgressSongs(row.songs, songFilter.value)
    const totals = levelRemaining(row)
    return {
      key: row.playLevel != null ? String(row.playLevel) : "unknown",
      row,
      label: row.playLevel != null ? t("musicProgress.level", { level: row.playLevel }) : t("musicProgress.levelUnknown"),
      matchCount: matching.length,
      songs: matching.map((song): MusicProgressSongView => ({
        musicId: song.musicId,
        title: song.title,
        jacketUrl: jacketUrl(song.assetbundleName),
        status: song.status,
      })),
      rewardsText: rewardsText(totals),
      hasRemaining: totals != null && hasMusicRewardTotals(totals),
    }
  })
})

const activeSummaryText = computed(() => {
  const summary = activeProgress.value?.summary
  return summary == null ? null : t("musicProgress.detailSummary", summary)
})

const allExpanded = computed(() =>
  levelRows.value.length > 0 && levelRows.value.every((entry) => expandedLevels.value.has(entry.key)),
)

function toggleLevel(key: string) {
  const next = new Set(expandedLevels.value)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  expandedLevels.value = next
}

function toggleAllLevels() {
  expandedLevels.value = allExpanded.value ? new Set() : new Set(levelRows.value.map((entry) => entry.key))
}

watch(
  () => [activeDifficulty.value, selectedAccount.value?.key ?? null] as const,
  () => {
    expandedLevels.value = new Set()
  },
)

function setSongFilter(value: AcceptableValue | AcceptableValue[] | undefined) {
  if (typeof value === "string" && isMusicProgressSongFilter(value)) {
    songFilter.value = value
  }
}

function selectDifficulty(difficulty: MusicDifficulty) {
  if (isMusicDifficulty(difficulty)) {
    activeDifficulty.value = difficulty
  }
}

const legendItems = [
  { key: "allPerfect", color: STATUS_COLORS.allPerfect },
  { key: "fullCombo", color: STATUS_COLORS.fullCombo },
  { key: "clear", color: STATUS_COLORS.clear },
  { key: "unplayed", color: STATUS_COLORS.unplayed },
] as const

function jacketUrl(assetbundleName: string): string | null {
  if (!region.value) {
    return null
  }

  return resolveMusicJacketUrl(region.value, assetbundleName, settingsStore.currentAssetEndpoint)
}

function difficultyLabel(difficulty: MusicDifficulty): string {
  return t(`musicLibrary.difficulty.${difficulty}`)
}

// --- Page state ---------------------------------------------------------------------------

const showSkeleton = computed(
  () => progress.value == null
    && suite.status.value !== "error"
    && master.error.value == null
    && suite.status.value !== "idle",
)
const showDownloadProgress = computed(
  () => progress.value == null
    && suite.status.value !== "error"
    && master.error.value == null
    && master.regionState.value?.refreshing === true,
)

const dateTimeFormatter = computed(() =>
  new Intl.DateTimeFormat(locale.value || getI18nLocale(), { dateStyle: "medium", timeStyle: "short" }),
)
const uploadTimeLabel = computed(() => {
  const timestamp = suite.uploadTime.value
  return timestamp != null ? dateTimeFormatter.value.format(new Date(suiteUploadTimeToMillis(timestamp))) : null
})

function refresh() {
  void suite.reload()
  void master.reload()
}
</script>

<template>
  <div class="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col justify-center gap-4 py-4">
    <!-- Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t("musicProgress.title") }}</h1>
        <p class="text-sm text-muted-foreground">{{ t("musicProgress.description") }}</p>
      </div>
      <div class="flex flex-col items-start gap-1.5 sm:items-end">
        <GameAccountSelect capability="suite" />
        <div v-if="suite.status.value !== 'idle'" class="flex items-center gap-1 text-xs text-muted-foreground">
          <span v-if="uploadTimeLabel">{{ t("musicProgress.dataAsOf", { time: uploadTimeLabel }) }}</span>
          <Button variant="ghost" size="sm" class="h-6 gap-1 px-1.5 text-xs text-muted-foreground" :disabled="showSkeleton" @click="refresh">
            <LucideRefreshCw class="size-3.5" />
            {{ t("musicProgress.refresh") }}
          </Button>
        </div>
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
        <!-- A grantee cannot upload the owner's data, so no upload CTA there. -->
        <template v-if="suiteDataMissing && selectedAccount?.ownership === 'granted'">
          <LucideCloudUpload class="size-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <p class="max-w-md text-sm text-muted-foreground">{{ t("musicProgress.missingGrantedData") }}</p>
        </template>
        <template v-else-if="suiteDataMissing">
          <LucideCloudUpload class="size-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <p class="max-w-md text-sm text-muted-foreground">{{ t("musicProgress.missingUserData") }}</p>
          <Button as-child type="button" size="sm">
            <RouterLink to="/upload-data">
              <LucideCloudUpload class="size-4" aria-hidden="true" />
              {{ t("musicProgress.uploadData") }}
            </RouterLink>
          </Button>
        </template>
        <template v-else>
          <p v-if="suite.status.value === 'error'" class="text-sm text-muted-foreground">{{ t("musicProgress.suiteError") }}</p>
          <p v-if="master.error.value" class="max-w-full break-words font-mono text-xs text-muted-foreground">
            {{ t("musicProgress.masterError", { message: master.error.value }) }}
          </p>
          <Button type="button" variant="outline" size="sm" @click="refresh">{{ t("musicProgress.retry") }}</Button>
        </template>
      </CardContent>
    </Card>

    <p v-if="suite.status.value === 'ready' && !hasResults" class="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
      {{ t("musicProgress.noResults") }}
    </p>

    <div v-if="showDownloadProgress" class="grid gap-2 rounded-md border bg-muted/20 p-3">
      <p class="text-xs text-muted-foreground">
        {{ t("musicProgress.downloading", { progress: Math.round(master.regionState.value?.progress ?? 0) }) }}
      </p>
      <Progress :model-value="master.regionState.value?.progress ?? 0" />
    </div>

    <template v-if="progress">
      <!-- Every difficulty at a glance; the rows are also the difficulty switch. -->
      <MusicProgressOverview
        :rows="overviewRows"
        :active="activeDifficulty"
        :totals-text="rewardTotalsText"
        :score-rank-text="rewardStats ? rewardsText(rewardStats.scoreRank) : null"
        :score-rank-has-remaining="rewardStats != null && hasMusicRewardTotals(rewardStats.scoreRank)"
        :hint="rewardsAvailable ? t('musicProgress.rewards.hint') : (claimedAchievements == null ? t('musicProgress.rewards.unavailable') : null)"
        @select="selectDifficulty"
      />

      <!-- Level breakdown of the selected difficulty -->
      <Card v-if="activeProgress">
        <CardHeader class="pb-2">
          <CardTitle class="flex flex-wrap items-center gap-x-3 gap-y-1 text-base">
            <span
              class="inline-flex w-16 shrink-0 items-center justify-center rounded px-1 py-0.5 text-[11px] font-semibold text-white"
              :style="{ backgroundColor: activeColor }"
            >
              {{ difficultyLabel(activeDifficulty) }}
            </span>
            <span>{{ t("musicProgress.levelsTitle") }}</span>
            <span v-if="activeSummaryText" class="text-xs font-normal tabular-nums text-muted-foreground">{{ activeSummaryText }}</span>
          </CardTitle>
          <div class="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="mr-1 text-xs font-medium text-muted-foreground">{{ t("musicProgress.songFilter.label") }}</span>
              <ToggleGroup type="single" variant="segment" size="sm" :model-value="songFilter" :aria-label="t('musicProgress.songFilter.label')" @update:model-value="setSongFilter">
                <ToggleGroupItem v-for="option in MUSIC_PROGRESS_SONG_FILTERS" :key="option" :value="option">
                  {{ t(`musicProgress.songFilter.${option}`) }}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <span class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span v-for="item in legendItems" :key="item.key" class="inline-flex items-center gap-1.5">
                <span class="size-2.5 rounded-full" :style="{ backgroundColor: item.color }" />
                {{ t(`musicProgress.legend.${item.key}`) }}
              </span>
            </span>
            <Button
              v-if="levelRows.length > 1"
              variant="ghost"
              size="sm"
              class="ml-auto h-7 gap-1 text-xs text-muted-foreground"
              @click="toggleAllLevels"
            >
              <LucideChevronsDownUp v-if="allExpanded" class="size-3.5" />
              <LucideChevronsUpDown v-else class="size-3.5" />
              {{ allExpanded ? t("musicProgress.sections.collapseAll") : t("musicProgress.sections.expandAll") }}
            </Button>
          </div>
        </CardHeader>
        <CardContent class="space-y-2">
          <div v-if="levelRows.length === 0" class="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            {{ t("musicProgress.noSongs") }}
          </div>
          <MusicProgressLevelRow
            v-for="entry in levelRows"
            :key="entry.key"
            :row="entry.row"
            :label="entry.label"
            :color="activeColor"
            :expanded="expandedLevels.has(entry.key)"
            :songs="entry.songs"
            :match-count="entry.matchCount"
            :filter-active="filterActive"
            :rewards-text="entry.rewardsText"
            :has-remaining="entry.hasRemaining"
            @toggle="toggleLevel(entry.key)"
          />
        </CardContent>
      </Card>
    </template>

    <div v-else-if="showSkeleton" class="space-y-3">
      <p v-if="!showDownloadProgress" class="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
        {{ t("musicProgress.loading") }}
      </p>
      <Skeleton class="h-56 w-full rounded-lg" />
      <div class="space-y-2">
        <Skeleton v-for="index in 6" :key="index" class="h-12 w-full rounded-lg" />
      </div>
    </div>
  </div>
</template>
