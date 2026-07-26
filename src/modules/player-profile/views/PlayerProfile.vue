<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { LucideCopy, LucideRefreshCw, LucideTrophy } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GameAccountSelect from "@/shared/components/GameAccountSelect.vue"
import { resolveSekaiCharacterColor } from "@/shared/sekai/catalog"
import { copyTextToClipboard } from "@/lib/clipboard"
import { usePlayerProfile } from "@/modules/player-profile/composables/usePlayerProfile"
import ProfileRadarChart from "@/modules/player-profile/components/ProfileRadarChart.vue"
import {
  buildChallengeLiveGrid,
  buildCharacterRanks,
  buildDeckThumbnailCard,
  buildPlayerCardMap,
  normalizeMultiLiveTopScoreCount,
  normalizeMusicDifficultyClearCounts,
  normalizePlayerCards,
  normalizePlayerGamedata,
  normalizePlayerProfile,
  normalizeProfileSnapshot,
  parseSekaiColoredText,
  resolveActiveDeckCardIds,
  summarizeChallengeLiveTop,
} from "@/modules/player-profile/lib/player-profile"
import CardThumbnail from "@/shared/components/SekaiCardThumbnail.vue"
import { buildCardThumbnailView, type DeckRecommendMasterCard } from "@/modules/deck-recommend/lib/card-thumbnail"
import { MUSIC_DIFFICULTIES, MUSIC_DIFFICULTY_COLORS } from "@/modules/music-library/lib/music-difficulties"
import { MUSIC_PROGRESS_STATUS_COLORS, buildMusicProgress } from "@/modules/music-library/lib/music-progress"
import { useMusicProgressMasterData } from "@/modules/music-library/composables/useMusicProgressMasterData"
import { suiteUploadTimeToMillis } from "@/shared/sekai/user-snapshot/api"

const { t, locale } = useI18n()

const {
  accountRegion,
  dataSource,
  profileStatus,
  profileData,
  profileError,
  profileUpdatedAt,
  reloadProfile,
  suiteStatus,
  suiteData,
  uploadTime,
  suiteError,
  reloadSuite,
  masterLoading,
  masterError,
  assetEndpoint,
  multiLiveStatus,
  multiLiveData,
  reloadMultiLive,
  cardMap,
  characterMap,
  unitColorMap,
  reloadMaster,
} = usePlayerProfile()

const musicMaster = useMusicProgressMasterData(accountRegion)

const isRealtime = computed(() => dataSource.value === "realtime")

const sourceStatus = computed(() => isRealtime.value ? profileStatus.value : suiteStatus.value)
const sourceError = computed(() => isRealtime.value ? profileError.value : suiteError.value)

// Both sources are exposed through one suite-shaped record so every section
// below reads the same keys regardless of where the data came from.
const snapshotData = computed(() =>
  isRealtime.value ? normalizeProfileSnapshot(profileData.value) : suiteData.value,
)

const isLoading = computed(() => sourceStatus.value === "loading" || masterLoading.value)
const hasError = computed(() => sourceStatus.value === "error" || masterError.value != null)
const isReady = computed(() => sourceStatus.value === "ready" && !masterLoading.value && masterError.value == null)

const errorDetail = computed(() => {
  if (masterError.value != null) {
    return masterError.value
  }

  const raw = sourceError.value
  if (raw == null) {
    return null
  }

  return raw instanceof Error ? raw.message : String(raw)
})

const uploadTimeText = computed(() => {
  const millis = isRealtime.value
    ? profileUpdatedAt.value
    : uploadTime.value != null
      ? suiteUploadTimeToMillis(uploadTime.value)
      : null
  if (millis == null) {
    return null
  }

  return new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeStyle: "short" })
    .format(millis)
})

function handleSourceChange(value: unknown) {
  if (value === "realtime" || value === "snapshot") {
    dataSource.value = value
  }
}

const numberFormatter = computed(() => new Intl.NumberFormat(locale.value))

const gamedata = computed(() => normalizePlayerGamedata(snapshotData.value?.userGamedata))
const nameSegments = computed(() => parseSekaiColoredText(gamedata.value?.name))
const profileInfo = computed(() => normalizePlayerProfile(snapshotData.value?.userProfile))
const wordSegments = computed(() => parseSekaiColoredText(profileInfo.value.rawWord))
const playerCardMap = computed(() => buildPlayerCardMap(normalizePlayerCards(snapshotData.value?.userCards)))

const deckViews = computed(() => {
  const cardIds = resolveActiveDeckCardIds(snapshotData.value?.userDecks, gamedata.value?.deck ?? null)
  const region = accountRegion.value ?? "jp"
  return cardIds.map((cardId) => {
    const master = cardMap.value.get(cardId) ?? null
    const record = playerCardMap.value.get(cardId) ?? null
    const masterCard: DeckRecommendMasterCard | null = master
      ? {
          id: master.id,
          characterId: master.characterId,
          characterName: master.characterId != null
            ? characterMap.value.get(master.characterId)?.name ?? null
            : null,
          cardRarityType: master.cardRarityType,
          attr: master.attr,
          prefix: master.prefix,
          assetbundleName: master.assetbundleName,
        }
      : null
    return {
      cardId,
      level: record?.level ?? null,
      thumbnail: buildCardThumbnailView(buildDeckThumbnailCard(cardId, record), masterCard, region, assetEndpoint.value),
    }
  })
})

const multiLiveCounts = computed(() => {
  if (isRealtime.value) {
    return normalizeMultiLiveTopScoreCount(snapshotData.value?.userMultiLiveTopScoreCount)
  }
  if (multiLiveStatus.value !== "ready") {
    return null
  }

  return normalizeMultiLiveTopScoreCount(multiLiveData.value?.userMultiLiveTopScoreCount)
})

const musicStatRows = computed(() => {
  if (musicMaster.rawMusics.value == null || musicMaster.rawMusicDifficulties.value == null) {
    return []
  }

  const progress = buildMusicProgress({
    rawMusics: musicMaster.rawMusics.value,
    rawMusicDifficulties: musicMaster.rawMusicDifficulties.value,
    rawUserMusicResults: isRealtime.value ? [] : snapshotData.value?.userMusicResults,
  })
  // The realtime profile ships aggregated counts instead of per-song results.
  const clearCounts = isRealtime.value
    ? normalizeMusicDifficultyClearCounts(snapshotData.value?.userMusicDifficultyClearCount)
    : null

  return MUSIC_DIFFICULTIES
    .map((difficulty) => {
      const summary = progress[difficulty].summary
      if (clearCounts == null) {
        return summary
      }

      const counts = clearCounts.get(difficulty)
      return {
        ...summary,
        cleared: counts?.liveClear ?? 0,
        fullCombo: counts?.fullCombo ?? 0,
        allPerfect: counts?.allPerfect ?? 0,
      }
    })
    .map((summary, index) => {
      const difficulty = MUSIC_DIFFICULTIES[index]
      const segments = [
        { key: "allPerfect", count: summary.allPerfect, color: MUSIC_PROGRESS_STATUS_COLORS.allPerfect },
        { key: "fullCombo", count: summary.fullCombo - summary.allPerfect, color: MUSIC_PROGRESS_STATUS_COLORS.fullCombo },
        { key: "clear", count: summary.cleared - summary.fullCombo, color: MUSIC_PROGRESS_STATUS_COLORS.clear },
      ].filter((segment) => segment.count > 0)
      return { difficulty, summary, segments }
    })
    .filter((row) => row.summary.total > 0)
})

const characterRankCells = computed(() => buildCharacterRanks(snapshotData.value?.userCharacters).map((entry) => {
  const character = characterMap.value.get(entry.characterId) ?? null
  const unitColor = character?.unit != null ? unitColorMap.value.get(character.unit) ?? null : null
  return {
    ...entry,
    name: character?.name ?? t("playerProfile.unknownCharacter"),
    iconUrl: character?.iconUrl ?? null,
    color: resolveSekaiCharacterColor(entry.characterId) ?? unitColor,
  }
}))

function unitGroupOf(characterId: number): { groupKey: string | null; groupColor: string | null } {
  const unit = characterMap.value.get(characterId)?.unit ?? null
  if (unit == null) {
    return { groupKey: null, groupColor: null }
  }

  return { groupKey: unit, groupColor: unitColorMap.value.get(unit) ?? null }
}

const characterRadarEntries = computed(() => characterRankCells.value.map((cell) => ({
  key: cell.characterId,
  label: cell.name,
  value: cell.characterRank,
  detail: t("playerProfile.characters.rank", { rank: cell.characterRank }),
  iconUrl: cell.iconUrl,
  color: cell.color,
  ...unitGroupOf(cell.characterId),
})))

const challengeCells = computed(() => buildChallengeLiveGrid(
  snapshotData.value?.userChallengeLiveSoloResults,
  snapshotData.value?.userChallengeLiveSoloStages,
))

const challengeRadarEntries = computed(() => challengeCells.value.map((cell) => {
  const character = characterMap.value.get(cell.characterId) ?? null
  // The realtime profile only carries the single best score, so the radar
  // switches to the per-character challenge stage in that mode.
  const value = isRealtime.value ? cell.stage : cell.highScore
  return {
    key: cell.characterId,
    label: character?.name ?? t("playerProfile.unknownCharacter"),
    value,
    detail: isRealtime.value
      ? t("playerProfile.challenge.stageDetail", { stage: cell.stage })
      : formatScore(cell.highScore),
    iconUrl: character?.iconUrl ?? null,
    color: resolveSekaiCharacterColor(cell.characterId),
    ...unitGroupOf(cell.characterId),
  }
}))

type UnitLegendItem = {
  unit: string
  color: string | null
  detail: string
  top: boolean
}

/** Per-unit average of the radar values; the highest unit gets `top`. */
function buildUnitLegend(
  entries: ReadonlyArray<{ groupKey: string | null; groupColor: string | null; value: number }>,
  formatValue: (value: number) => string,
): UnitLegendItem[] {
  const rows = new Map<string, { unit: string; color: string | null; sum: number; count: number }>()
  for (const entry of entries) {
    if (entry.groupKey == null) {
      continue
    }

    let row = rows.get(entry.groupKey)
    if (!row) {
      row = { unit: entry.groupKey, color: entry.groupColor, sum: 0, count: 0 }
      rows.set(entry.groupKey, row)
    }

    row.sum += entry.value
    row.count += 1
  }

  const items = [...rows.values()].map((row) => ({
    unit: row.unit,
    color: row.color,
    average: row.count > 0 ? row.sum / row.count : 0,
  }))
  const maxAverage = Math.max(0, ...items.map((item) => item.average))
  return items.map((item) => ({
    unit: item.unit,
    color: item.color,
    detail: formatValue(item.average),
    top: items.length > 1 && maxAverage > 0 && item.average === maxAverage,
  }))
}

const characterUnitLegend = computed(() => buildUnitLegend(
  characterRadarEntries.value,
  (value) => (Math.round(value * 10) / 10).toFixed(1),
))

const challengeUnitLegend = computed(() => buildUnitLegend(
  challengeRadarEntries.value,
  (value) => isRealtime.value
    ? (Math.round(value * 10) / 10).toFixed(1)
    : formatScore(Math.round(value)),
))

const challengeTop = computed(() => {
  const top = summarizeChallengeLiveTop(challengeCells.value)
  if (top == null) {
    return null
  }

  const character = characterMap.value.get(top.characterId) ?? null
  return {
    ...top,
    name: character?.name ?? t("playerProfile.unknownCharacter"),
  }
})

function formatScore(value: number): string {
  return numberFormatter.value.format(value)
}

async function copyGameId() {
  const gameId = gamedata.value?.userId
  if (!gameId) {
    return
  }

  const copied = await copyTextToClipboard(gameId)
  if (copied) {
    toast.success(t("playerProfile.header.copied"))
  } else {
    toast.error(t("playerProfile.header.copyFailed"))
  }
}

function refresh() {
  if (isRealtime.value) {
    void reloadProfile("refresh")
  } else {
    void reloadSuite("check-remote")
    void reloadMultiLive("check-remote")
  }
  reloadMaster()
}

function retry() {
  if (masterError.value != null) {
    reloadMaster()
  }

  if (sourceStatus.value === "error") {
    if (isRealtime.value) {
      void reloadProfile("refresh")
    } else {
      void reloadSuite("check-remote")
    }
  }
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-4">
    <!-- Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t("playerProfile.title") }}</h1>
        <p class="text-sm text-muted-foreground">{{ t("playerProfile.description") }}</p>
      </div>
      <div class="flex flex-col items-start gap-1.5 sm:items-end">
        <div class="flex flex-wrap items-center gap-2">
          <Tabs :model-value="dataSource" @update:model-value="handleSourceChange">
            <TabsList class="h-8">
              <TabsTrigger value="realtime" class="text-xs">
                {{ t("playerProfile.source.realtime") }}
              </TabsTrigger>
              <TabsTrigger value="snapshot" class="text-xs">
                {{ t("playerProfile.source.snapshot") }}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <GameAccountSelect />
        </div>
        <p v-if="uploadTimeText" class="text-xs text-muted-foreground">
          {{ t("playerProfile.dataAsOf", { time: uploadTimeText }) }}
        </p>
      </div>
    </div>

    <!-- No account selected -->
    <Card v-if="sourceStatus === 'idle'">
      <CardContent class="py-12 text-center text-sm text-muted-foreground">
        {{ t("playerProfile.noAccountHint") }}
      </CardContent>
    </Card>

    <!-- Error -->
    <Card v-else-if="hasError && !isLoading">
      <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
        <p class="text-sm text-muted-foreground">{{ t("playerProfile.loadError") }}</p>
        <p v-if="errorDetail" class="max-w-full truncate font-mono text-xs text-muted-foreground">
          {{ errorDetail }}
        </p>
        <Button variant="outline" size="sm" @click="retry">
          {{ t("playerProfile.retry") }}
        </Button>
      </CardContent>
    </Card>

    <!-- Loading skeleton -->
    <template v-else-if="isLoading">
      <Skeleton class="h-40 w-full rounded-lg" />
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Skeleton v-for="index in 6" :key="index" class="h-16 w-full rounded-lg" />
      </div>
      <div class="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
        <Skeleton v-for="index in 14" :key="index" class="h-20 w-full rounded-lg" />
      </div>
    </template>

    <template v-else-if="isReady">
      <!-- Basic info -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="flex flex-wrap items-center justify-between gap-2 text-base">
            <span>{{ t("playerProfile.header.title") }}</span>
            <Button variant="ghost" size="sm" class="h-7 gap-1 text-xs text-muted-foreground" @click="refresh">
              <LucideRefreshCw class="size-3.5" />
              {{ t("playerProfile.refresh") }}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent class="grid gap-6 lg:grid-cols-2">
          <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xl font-semibold">
                <template v-if="nameSegments.length > 0">
                  <span
                    v-for="(segment, index) in nameSegments"
                    :key="index"
                    :style="segment.color ? { color: segment.color } : {}"
                  >{{ segment.text }}</span>
                </template>
                <template v-else>—</template>
              </span>
              <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary">
                {{ t("playerProfile.header.rank", { rank: gamedata?.rank ?? 0 }) }}
              </span>
            </div>
            <p v-if="profileInfo.word" class="whitespace-pre-wrap break-words text-sm text-muted-foreground">
              <span
                v-for="(segment, index) in wordSegments"
                :key="index"
                :style="segment.color ? { color: segment.color } : {}"
              >{{ segment.text }}</span>
            </p>
            <p v-if="profileInfo.twitterId" class="text-xs text-muted-foreground">
              @{{ profileInfo.twitterId }}
            </p>
            <div v-if="gamedata?.userId" class="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{{ t("playerProfile.header.gameId") }}</span>
              <span class="font-mono tabular-nums">{{ gamedata.userId }}</span>
              <button
                type="button"
                class="inline-flex items-center rounded p-1 transition-colors hover:bg-muted hover:text-foreground"
                :aria-label="t('playerProfile.header.copy')"
                @click="copyGameId"
              >
                <LucideCopy class="size-3.5" />
              </button>
            </div>
          </div>

          <!-- Active deck -->
          <div class="flex flex-col gap-2">
            <h3 class="text-xs font-medium text-muted-foreground">{{ t("playerProfile.deck.title") }}</h3>
            <p v-if="deckViews.length === 0" class="text-sm text-muted-foreground">
              {{ t("playerProfile.deck.empty") }}
            </p>
            <div
              v-else
              class="grid w-full max-w-[26rem] grid-cols-5 content-center justify-items-center gap-0.5 rounded bg-muted/20 p-0.5 ring-1 ring-border/60 sm:gap-1 sm:rounded-md"
            >
              <CardThumbnail
                v-for="view in deckViews"
                :key="view.cardId"
                :thumbnail="view.thumbnail"
                size="fluid"
                :level-label="view.level != null && view.level > 0 ? t('playerProfile.badge.level', { level: view.level }) : null"
              />
            </div>
          </div>
          </div>

          <!-- Multi-live counts + music stats -->
          <div class="flex flex-col gap-4">
            <div v-if="multiLiveCounts" class="grid grid-cols-2 gap-3">
              <div class="rounded-md border p-3">
                <div class="text-xs text-muted-foreground">{{ t("playerProfile.multiLive.mvp") }}</div>
                <div class="mt-0.5 text-xl font-bold tabular-nums">{{ formatScore(multiLiveCounts.mvp) }}</div>
              </div>
              <div class="rounded-md border p-3">
                <div class="text-xs text-muted-foreground">{{ t("playerProfile.multiLive.superStar") }}</div>
                <div class="mt-0.5 text-xl font-bold tabular-nums">{{ formatScore(multiLiveCounts.superStar) }}</div>
              </div>
            </div>

            <div v-if="musicStatRows.length > 0" class="flex flex-col gap-2">
              <h3 class="text-xs font-medium text-muted-foreground">{{ t("playerProfile.music.title") }}</h3>
              <div
                v-for="row in musicStatRows"
                :key="row.difficulty"
                class="flex flex-wrap items-center gap-x-2 gap-y-1"
              >
                <span
                  class="inline-flex w-16 shrink-0 items-center justify-center rounded px-1 py-0.5 text-[11px] font-semibold text-white"
                  :style="{ backgroundColor: MUSIC_DIFFICULTY_COLORS[row.difficulty] }"
                >
                  {{ t(`musicLibrary.difficulty.${row.difficulty}`) }}
                </span>
                <span class="flex h-2.5 min-w-24 flex-1 gap-px overflow-hidden rounded-full bg-muted">
                  <span
                    v-for="segment in row.segments"
                    :key="segment.key"
                    class="h-full"
                    :style="{ backgroundColor: segment.color, width: `${(segment.count / row.summary.total) * 100}%` }"
                  />
                </span>
                <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  AP {{ row.summary.allPerfect }} · FC {{ row.summary.fullCombo }} ·
                  CL {{ row.summary.cleared }} / {{ row.summary.total }}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Character levels + challenge live radars, side by side on large screens -->
      <div class="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-base">{{ t("playerProfile.characters.title") }}</CardTitle>
          </CardHeader>
          <CardContent>
            <p v-if="characterRadarEntries.length === 0" class="py-4 text-center text-sm text-muted-foreground">
              {{ t("playerProfile.characters.empty") }}
            </p>
            <template v-else>
              <ProfileRadarChart :entries="characterRadarEntries" />
              <div v-if="characterUnitLegend.length > 0" class="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
                <span class="text-muted-foreground">{{ t("playerProfile.unitAverage") }}</span>
                <span
                  v-for="item in characterUnitLegend"
                  :key="item.unit"
                  :class="['inline-flex items-center gap-1', item.top ? 'font-semibold' : 'text-muted-foreground']"
                >
                  <span class="size-2.5 rounded-full" :style="{ backgroundColor: item.color ?? 'currentColor' }" />
                  {{ t(`cards.unit.${item.unit}`) }}
                  <span class="tabular-nums">{{ item.detail }}</span>
                  <LucideTrophy v-if="item.top" class="size-3 text-amber-500" />
                </span>
              </div>
            </template>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="flex flex-wrap items-center justify-between gap-2 text-base">
              {{ t("playerProfile.challenge.title") }}
              <span
                v-if="challengeTop"
                class="inline-flex items-center gap-1.5 text-sm font-normal text-muted-foreground"
              >
                <LucideTrophy class="size-4 shrink-0 text-amber-500" />
                {{ t("playerProfile.challenge.summary", { name: challengeTop.name, score: formatScore(challengeTop.highScore) }) }}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p v-if="!challengeTop" class="py-4 text-center text-sm text-muted-foreground">
              {{ t("playerProfile.challenge.empty") }}
            </p>
            <ProfileRadarChart :entries="challengeRadarEntries" />
            <div v-if="challengeUnitLegend.length > 0" class="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
              <span class="text-muted-foreground">{{ t("playerProfile.unitAverage") }}</span>
              <span
                v-for="item in challengeUnitLegend"
                :key="item.unit"
                :class="['inline-flex items-center gap-1', item.top ? 'font-semibold' : 'text-muted-foreground']"
              >
                <span class="size-2.5 rounded-full" :style="{ backgroundColor: item.color ?? 'currentColor' }" />
                {{ t(`cards.unit.${item.unit}`) }}
                <span class="tabular-nums">{{ item.detail }}</span>
                <LucideTrophy v-if="item.top" class="size-3 text-amber-500" />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
