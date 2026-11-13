<script setup lang="ts">
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import MissingGameDataNotice from "@/shared/components/MissingGameDataNotice.vue"
import PageHeader from "@/shared/components/PageHeader.vue"
import { useUserDataPageState } from "@/shared/sekai/user-snapshot/use-user-data-page-state"
import { useSuiteRefresh } from "@/shared/sekai/user-snapshot/use-suite-refresh"
import { formatUploadTime, useUploadTimeText } from "@/shared/sekai/user-snapshot/upload-time"
import { useRouteQueryState, type QueryCodec } from "@/composables/useRouteQueryState"
import { readQueryEnum, writeQueryValue } from "@/lib/query-codec"

import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { LucideArrowUpRight, LucideCloudUpload, LucideCopy, LucideRefreshCw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GameAccountSelect from "@/shared/components/GameAccountSelect.vue"
import { resolveSekaiCharacterColor } from "@/shared/sekai/catalog"
import { copyTextToClipboard } from "@/lib/clipboard"
import {
  PLAYER_PROFILE_CAPABILITIES,
  PLAYER_PROFILE_SOURCES,
  usePlayerProfile,
  type PlayerProfileSource,
} from "@/modules/player-profile/composables/usePlayerProfile"
import SekaiUnitLogo from "@/shared/components/SekaiUnitLogo.vue"
import { SEKAI_UNITS } from "@/shared/sekai/catalog"
import { buildProfileCharacterGroups, summarizeMusicClears } from "@/modules/player-profile/lib/profile-overview"
import { useProfileHonors } from "@/modules/player-profile/composables/useProfileHonors"
import HonorBadge from "@/modules/rank-border/components/HonorBadge.vue"
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
import EventPointTrendChart from "@/modules/events/components/EventPointTrendChart.vue"
import { useEventRecordsMaster } from "@/modules/events/composables/useEventRecordsMaster"
import {
  buildDerivedRankMap,
  buildEventPointTrend,
  buildEventRecordRows,
  normalizeUserEventRecords,
  normalizeUserHonorIds,
} from "@/modules/events/lib/event-records"
import {
  buildCharacterDistribution,
  buildOwnedCardMap,
  filterCardsByRarity,
  filterReleasedCards,
  normalizeUserCards,
  summarizeCollection,
} from "@/modules/cards/lib/card-box"
import { CARD_RARITY_TYPES, type CardRarityType } from "@/modules/cards/lib/card-filter"
import { MUSIC_DIFFICULTIES, resolveMusicDifficultyChipClass } from "@/modules/music-library/lib/music-difficulties"
import { MUSIC_PROGRESS_STATUS_COLORS, buildMusicProgress } from "@/modules/music-library/lib/music-progress"
import { useMusicProgressMasterData } from "@/modules/music-library/composables/useMusicProgressMasterData"

const { t, locale } = useI18n()

// The 实时/上传的数据 choice lives in the URL so a reload or a shared link
// opens the same source.
type ProfileSourceQuery = { source: PlayerProfileSource }
const SOURCE_QUERY_CODEC: QueryCodec<ProfileSourceQuery> = {
  keys: ["source"],
  filterKeys: [],
  defaults: () => ({ source: "realtime" }),
  parse: (query) => ({ source: readQueryEnum(query.source, PLAYER_PROFILE_SOURCES) ?? "realtime" }),
  serialize: (state) => ({ source: writeQueryValue(state.source, "realtime") }),
}
const sourceQuery = useRouteQueryState(SOURCE_QUERY_CODEC)

const {
  selectedAccount,
  ancillaryDataMissing,
  accountRegion,
  dataSource,
  canUseRealtime,
  canUseSnapshot,
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
  honorsData,
  reloadHonors,
  extrasData,
  extrasUploadTime,
  reloadExtras,
  eventsStatus,
  eventsData,
  eventsUploadTime,
  reloadEvents,
  cardMap,
  characterMap,
  unitColorMap,
  reloadMaster,
} = usePlayerProfile({ initialSource: sourceQuery.state.source })

// Keep the URL and the composable's source in step in both directions (the
// composable may correct the source for an account that lacks a capability).
watch(dataSource, (value) => {
  sourceQuery.patch({ source: value })
})
watch(() => sourceQuery.state.source, (value) => {
  if (dataSource.value !== value) {
    dataSource.value = value
  }
})

const musicMaster = useMusicProgressMasterData(accountRegion)

const isRealtime = computed(() => dataSource.value === "realtime")

const sourceStatus = computed(() => isRealtime.value ? profileStatus.value : suiteStatus.value)
const sourceError = computed(() => isRealtime.value ? profileError.value : suiteError.value)

// Both sources are exposed through one suite-shaped record so every section
// below reads the same keys regardless of where the data came from.
const snapshotData = computed(() =>
  isRealtime.value ? normalizeProfileSnapshot(profileData.value) : suiteData.value,
)

const {
  isLoading,
  hasError,
  isReady,
  suiteDataMissing,
  missingDataType,
  errorMessage,
  errorDetail,
} = useUserDataPageState({
  status: sourceStatus,
  error: sourceError,
  masterLoading: masterLoading,
  masterError: masterError,
  account: selectedAccount,
  fallback: () => t("playerProfile.loadError"),
})

// Realtime shows when the profile was fetched; the uploaded source shows the
// shared "data uploaded at" line like every other snapshot page.
const sourceTime = computed(() => isRealtime.value ? profileUpdatedAt.value : uploadTime.value)
const uploadTimeText = useUploadTimeText(sourceTime)
const dataTimeLabel = computed(() => {
  if (uploadTimeText.value == null) {
    return null
  }
  return isRealtime.value
    ? t("playerProfile.realtimeAsOf", { time: uploadTimeText.value })
    : t("uploadedGameData.uploadedAt", { time: uploadTimeText.value })
})

/**
 * In realtime mode the collection, challenge and event modules still read
 * the uploaded snapshot, so each of them names its own data time instead of
 * borrowing the page-level realtime timestamp.
 */
function snapshotNote(snapshotUploadTime: number | null): string | null {
  if (!isRealtime.value || snapshotUploadTime == null) {
    return null
  }

  return t("playerProfile.snapshotNote", { time: formatUploadTime(snapshotUploadTime) })
}

const extrasNote = computed(() => snapshotNote(extrasUploadTime.value))
const eventsNote = computed(() => snapshotNote(eventsUploadTime.value))

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

// The realtime payload carries the profile honors inline; the snapshot
// source fetches them as their own suite subset.
const profileHonorsRaw = computed(() =>
  isRealtime.value ? snapshotData.value?.userProfileHonors : honorsData.value?.userProfileHonors,
)
const { honorViews } = useProfileHonors(accountRegion, profileHonorsRaw, assetEndpoint)

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
          trainedByDefault: master.trainedByDefault ?? false,
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
        // Draw the not-yet-cleared remainder explicitly in gray instead of leaving the track blank.
        { key: "uncleared", count: summary.total - summary.cleared, color: MUSIC_PROGRESS_STATUS_COLORS.unplayed },
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

// The realtime profile only carries the single best challenge result, so the
// per-character scores always come from the snapshot suite subset instead.
const challengeCells = computed(() => {
  const source = isRealtime.value ? extrasData.value : snapshotData.value
  return buildChallengeLiveGrid(
    source?.userChallengeLiveSoloResults,
    source?.userChallengeLiveSoloStages,
  )
})

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

const eventsMaster = useEventRecordsMaster(accountRegion)

const eventTrend = computed(() => buildEventPointTrend(
  buildEventRecordRows(
    normalizeUserEventRecords(eventsData.value?.userEvents),
    eventsMaster.eventsById.value,
  ),
  buildDerivedRankMap(
    normalizeUserHonorIds(eventsData.value?.userHonors),
    eventsMaster.honorRankIndex.value,
  ),
))

const eventTrendLoading = computed(() => eventsStatus.value === "loading" || eventsMaster.loading.value)

// Collection always counts against the snapshot card box: the realtime
// profile's userCards only contains the shown deck's five cards.
const collectionOwnedMap = computed(() => buildOwnedCardMap(normalizeUserCards(
  isRealtime.value ? extrasData.value?.userCards : snapshotData.value?.userCards,
)))

const releasedMasterCards = computed(() => filterReleasedCards([...cardMap.value.values()]))

const collectionRarities = ref<CardRarityType[]>([])

function toggleCollectionRarity(rarity: CardRarityType) {
  const current = collectionRarities.value
  collectionRarities.value = current.includes(rarity)
    ? current.filter((item) => item !== rarity)
    : [...current, rarity]
}

const collectionCards = computed(() => filterCardsByRarity(releasedMasterCards.value, collectionRarities.value))

const collectionSummary = computed(() => summarizeCollection(collectionCards.value, collectionOwnedMap.value))

const collectionColumns = computed(() => {
  const rows = buildCharacterDistribution(collectionCards.value, collectionOwnedMap.value)
    .filter((row) => row.characterId > 0)
  return rows.map((row) => {
    const character = characterMap.value.get(row.characterId) ?? null
    return {
      characterId: row.characterId,
      name: character?.name ?? t("playerProfile.unknownCharacter"),
      iconUrl: character?.iconUrl ?? null,
      color: resolveSekaiCharacterColor(row.characterId) ?? "#94a3b8",
      owned: row.owned,
      total: row.total,
      percent: row.percent,
      // The bar and the ring read the same value: share of that character's cards owned.
      barHeight: row.owned > 0 ? `${Math.max(3, row.percent)}%` : "0%",
    }
  })
})

// One cell per character: level, collection and challenge live score side by
// side, so the three no longer have to be matched across three charts.
const characterGroups = computed(() => buildProfileCharacterGroups(
  {
    ranks: characterRankCells.value,
    collection: hasCollectionData.value ? collectionColumns.value : [],
    challenge: challengeCells.value,
  },
  (characterId) => characterMap.value.get(characterId)?.unit ?? null,
  SEKAI_UNITS,
).map((group) => ({
  unit: group.unit,
  cells: group.cells.map((cell) => {
    const character = characterMap.value.get(cell.characterId) ?? null
    return {
      ...cell,
      name: character?.name ?? t("playerProfile.unknownCharacter"),
      iconUrl: character?.iconUrl ?? null,
      color: resolveSekaiCharacterColor(cell.characterId) ?? "#94a3b8",
    }
  }),
})))

// The numbers people compare first, pulled up next to the name.
const headlineStats = computed(() => {
  const stats: { key: string; label: string; value: string; detail?: string }[] = []
  if (multiLiveCounts.value) {
    stats.push({ key: "mvp", label: t("playerProfile.multiLive.mvp"), value: formatScore(multiLiveCounts.value.mvp) })
    stats.push({ key: "superStar", label: t("playerProfile.multiLive.superStar"), value: formatScore(multiLiveCounts.value.superStar) })
  }
  if (musicStatRows.value.length > 0) {
    const clears = summarizeMusicClears(musicStatRows.value)
    stats.push({ key: "allPerfect", label: t("playerProfile.headline.allPerfect"), value: formatScore(clears.allPerfect), detail: `/ ${formatScore(clears.total)}` })
    stats.push({ key: "fullCombo", label: t("playerProfile.headline.fullCombo"), value: formatScore(clears.fullCombo), detail: `/ ${formatScore(clears.total)}` })
  }
  if (hasCollectionData.value) {
    stats.push({
      key: "collection",
      label: t("playerProfile.headline.collection"),
      value: `${collectionSummary.value.percent}%`,
      detail: `${formatScore(collectionSummary.value.owned)} / ${formatScore(collectionSummary.value.total)}`,
    })
  }
  if (challengeTop.value) {
    stats.push({ key: "challenge", label: t("playerProfile.headline.challenge"), value: formatScore(challengeTop.value.highScore), detail: challengeTop.value.name })
  }
  const latestEvent = eventTrend.value.at(-1)
  if (latestEvent) {
    const rank = latestEvent.rank ?? latestEvent.derivedRank
    stats.push({
      key: "event",
      label: t("playerProfile.headline.latestEvent"),
      value: rank != null ? `#${formatScore(rank)}` : formatScore(latestEvent.eventPoint),
      detail: latestEvent.name,
    })
  }
  return stats
})

// Keyed on the unfiltered card box so an empty rarity selection still renders
// the (all-zero) chart with the filter chips available to undo it.
const hasCollectionData = computed(() => collectionOwnedMap.value.size > 0)

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

// The primary source's reload drives the "up to date / updated to …" toast;
// the ancillary subsets and master data refresh alongside it.
const { refreshing, refresh } = useSuiteRefresh([
  () => isRealtime.value ? reloadProfile("refresh") : reloadSuite("check-remote"),
  async () => {
    if (isRealtime.value) {
      await reloadExtras("check-remote")
    } else {
      await Promise.all([reloadMultiLive("check-remote"), reloadHonors("check-remote")])
    }
    await reloadEvents("check-remote")
    reloadMaster()
  },
])

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
  <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4">
    <PageHeader :title="t('playerProfile.title')">
      <template #actions>
      <div class="flex flex-col items-start gap-1.5 sm:items-end">
        <div class="flex flex-wrap items-center gap-2">
          <Tabs :model-value="dataSource" @update:model-value="handleSourceChange">
            <TabsList class="h-8">
              <!-- A granted account only enables the sources its grants cover. -->
              <TabsTrigger value="realtime" class="text-xs" :disabled="!canUseRealtime">
                {{ t("playerProfile.source.realtime") }}
              </TabsTrigger>
              <TabsTrigger value="snapshot" class="text-xs" :disabled="!canUseSnapshot">
                {{ t("playerProfile.source.snapshot") }}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <GameAccountSelect :capability="PLAYER_PROFILE_CAPABILITIES" />
        </div>
        <!-- Refresh reloads every module, so it lives with the page-level data time. -->
        <div v-if="sourceStatus !== 'idle'" class="flex items-center gap-1 text-xs text-muted-foreground">
          <span v-if="dataTimeLabel">{{ dataTimeLabel }}</span>
          <Button variant="ghost" size="sm" class="h-6 gap-1 px-1.5 text-xs text-muted-foreground" :disabled="isLoading || refreshing" @click="refresh">
            <LucideRefreshCw :class="['size-3.5', refreshing ? 'animate-spin' : '']" />
            {{ t("playerProfile.refresh") }}
          </Button>
        </div>
      </div>
      </template>
    </PageHeader>

    <!-- No account selected -->
    <Card v-if="sourceStatus === 'idle'">
      <CardContent class="py-12 text-center text-sm text-muted-foreground">
        {{ t("playerProfile.noAccountHint") }}
      </CardContent>
    </Card>

    <!-- Missing game data (uploaded snapshot or realtime profile): guidance, not an error -->
    <Card v-else-if="suiteDataMissing">
      <CardContent class="py-10">
        <MissingGameDataNotice :granted="selectedAccount?.ownership === 'granted'" :data-type="missingDataType ?? 'suite'" />
      </CardContent>
    </Card>

    <!-- Backend / masterdata failure -->
    <Card v-else-if="hasError && !isLoading">
      <CardContent>
        <LoadErrorState
          :description="errorMessage"
          :detail="errorDetail"
          :retry-label="t('playerProfile.retry')"
          :retrying="isLoading"
          @retry="retry"
        />
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
      <!-- Identity: the in-game profile card (name, honors, bio, id) next to the shown deck -->
      <Card>
        <CardContent class="flex flex-col gap-5 py-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div class="flex min-w-0 flex-1 flex-col gap-3">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span class="text-2xl font-bold leading-tight">
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
            <div v-if="honorViews.length > 0" class="flex flex-wrap items-center gap-2">
              <HonorBadge v-for="honor in honorViews" :key="honor.key" :honor="honor" variant="detail" />
            </div>
            <p v-if="profileInfo.word" class="whitespace-pre-wrap break-words text-sm text-muted-foreground">
              <span
                v-for="(segment, index) in wordSegments"
                :key="index"
                :style="segment.color ? { color: segment.color } : {}"
              >{{ segment.text }}</span>
            </p>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span v-if="profileInfo.twitterId">@{{ profileInfo.twitterId }}</span>
              <span v-if="gamedata?.userId" class="flex items-center gap-1">
                <span>{{ t("playerProfile.header.gameId") }}</span>
                <span class="font-mono tabular-nums">{{ gamedata.userId }}</span>
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded p-1 transition-colors hover:bg-muted hover:text-foreground pointer-coarse:min-h-10 pointer-coarse:min-w-10"
                  :aria-label="t('playerProfile.header.copy')"
                  @click="copyGameId"
                >
                  <LucideCopy class="size-3.5" />
                </button>
              </span>
            </div>
          </div>

          <!-- Active deck -->
          <div class="flex w-full flex-col gap-2 lg:w-[26rem] lg:shrink-0">
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
        </CardContent>
        <!-- The numbers people compare first, in one strip. -->
        <dl
          v-if="headlineStats.length > 0"
          class="-mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-b-xl border-t bg-border sm:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]"
          data-testid="profile-headline"
        >
          <div v-for="stat in headlineStats" :key="stat.key" class="min-w-0 bg-card px-4 py-2.5" :data-stat="stat.key">
            <dt class="truncate text-xs text-muted-foreground">{{ stat.label }}</dt>
            <dd class="flex min-w-0 items-baseline gap-1.5">
              <span class="text-lg leading-tight font-semibold tabular-nums">{{ stat.value }}</span>
              <span v-if="stat.detail" class="min-w-0 truncate text-[11px] text-muted-foreground tabular-nums" :title="stat.detail">{{ stat.detail }}</span>
            </dd>
          </div>
        </dl>
      </Card>

      <!-- Notice first: it names the modules below that need an upload. -->
      <!-- The sections from here down read the uploaded Suite; with a live profile
           but no upload they are empty, so the notice sits right above them and
           names them instead of calling the whole page "no data". -->
      <Card v-if="ancillaryDataMissing" size="compact">
        <CardContent class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex min-w-0 items-start gap-3">
            <LucideCloudUpload class="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <div class="min-w-0 space-y-0.5">
              <p class="text-sm font-medium">{{ t("playerProfile.partialUpload.title") }}</p>
              <p class="text-sm text-muted-foreground">
                {{ t(selectedAccount?.ownership === 'granted' ? "uploadedGameData.missingGranted" : "playerProfile.partialUpload.description") }}
              </p>
            </div>
          </div>
          <Button as-child size="sm" variant="outline" class="shrink-0">
            <RouterLink to="/upload-data">
              <LucideCloudUpload class="size-4" aria-hidden="true" />
              {{ t("uploadedGameData.uploadAction") }}
            </RouterLink>
          </Button>
        </CardContent>
      </Card>

      <!-- Songs cleared (a compact table) beside the event PT trend. -->
      <div class="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Card v-if="musicStatRows.length > 0" data-testid="profile-music">
          <CardHeader class="pb-2">
            <CardTitle class="text-base">{{ t("playerProfile.music.title") }}</CardTitle>
          </CardHeader>
          <CardContent>
            <table class="w-full text-xs tabular-nums">
              <thead>
                <tr class="text-muted-foreground">
                  <th scope="col" class="w-18 pb-1.5 text-left font-medium"><span class="sr-only">{{ t("musicLibrary.list.filters.difficulty") }}</span></th>
                  <th scope="col" class="pb-1.5 font-medium"><span class="sr-only">{{ t("playerProfile.music.progress") }}</span></th>
                  <th scope="col" class="w-12 pb-1.5 text-right font-medium">AP</th>
                  <th scope="col" class="w-12 pb-1.5 text-right font-medium">FC</th>
                  <th scope="col" class="w-12 pb-1.5 text-right font-medium">Clear</th>
                  <th scope="col" class="w-12 pb-1.5 text-right font-medium">{{ t("playerProfile.music.total") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in musicStatRows" :key="row.difficulty">
                  <th scope="row" class="py-1 pr-2 text-left font-normal">
                    <span :class="[resolveMusicDifficultyChipClass(row.difficulty), 'w-16 px-1 py-1']">
                      {{ t(`musicLibrary.difficulty.${row.difficulty}`) }}
                    </span>
                  </th>
                  <td class="py-1">
                    <span class="flex h-2.5 min-w-12 gap-px overflow-hidden rounded-full bg-muted" aria-hidden="true">
                      <span
                        v-for="segment in row.segments"
                        :key="segment.key"
                        class="h-full"
                        :style="{ flex: `${segment.count} 0 0`, backgroundColor: segment.color }"
                      />
                    </span>
                  </td>
                  <td class="py-1 text-right font-medium">{{ row.summary.allPerfect }}</td>
                  <td class="py-1 text-right font-medium">{{ row.summary.fullCombo }}</td>
                  <td class="py-1 text-right font-medium">{{ row.summary.cleared }}</td>
                  <td class="py-1 text-right text-muted-foreground">{{ row.summary.total }}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <!-- Always sourced from the suite snapshot; the full chart is on the records page. -->
        <EventPointTrendChart :trend="eventTrend" :loading="eventTrendLoading" compact>
          <template #actions>
            <span v-if="eventsNote" class="text-xs font-normal text-muted-foreground">{{ eventsNote }}</span>
            <Button as-child variant="ghost" size="sm" class="h-7 gap-1 text-xs font-normal text-muted-foreground">
              <RouterLink :to="{ name: 'events.records' }">
                {{ t("playerProfile.links.eventRecords") }}
                <LucideArrowUpRight class="size-3.5" />
              </RouterLink>
            </Button>
          </template>
        </EventPointTrendChart>
      </div>

      <!-- Characters: level, card collection and challenge live score in one cell each, by unit. -->
      <Card data-testid="profile-characters">
        <CardHeader class="pb-2">
          <CardTitle class="flex flex-wrap items-center justify-between gap-2 text-base">
            <span class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span>{{ t("playerProfile.roster.title") }}</span>
              <span v-if="extrasNote" class="text-xs font-normal text-muted-foreground">{{ extrasNote }}</span>
            </span>
            <span class="flex flex-wrap items-center gap-1.5">
              <button
                v-for="rarity in CARD_RARITY_TYPES"
                :key="rarity"
                type="button"
                :class="[
                  'rounded-full border px-2 py-0.5 text-xs font-normal transition-colors pointer-coarse:min-h-10 pointer-coarse:px-3',
                  collectionRarities.includes(rarity)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:bg-muted',
                ]"
                :aria-pressed="collectionRarities.includes(rarity)"
                :title="t('playerProfile.roster.rarityFilter')"
                @click="toggleCollectionRarity(rarity)"
              >
                {{ t(`cards.rarity.${rarity}`) }}
              </button>
              <Button as-child variant="ghost" size="sm" class="h-7 gap-1 px-2 text-xs font-normal text-muted-foreground">
                <RouterLink :to="{ name: 'cards.box' }">
                  {{ t("cardBox.entryLink") }}
                  <LucideArrowUpRight class="size-3.5" />
                </RouterLink>
              </Button>
              <Button as-child variant="ghost" size="sm" class="h-7 gap-1 px-2 text-xs font-normal text-muted-foreground">
                <RouterLink :to="{ name: 'training.missions' }">
                  {{ t("playerProfile.links.characterMissions") }}
                  <LucideArrowUpRight class="size-3.5" />
                </RouterLink>
              </Button>
              <Button as-child variant="ghost" size="sm" class="h-7 gap-1 px-2 text-xs font-normal text-muted-foreground">
                <RouterLink :to="{ name: 'training.challenge' }">
                  {{ t("playerProfile.links.challengeDetail") }}
                  <LucideArrowUpRight class="size-3.5" />
                </RouterLink>
              </Button>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p v-if="characterGroups.length === 0" class="py-4 text-center text-sm text-muted-foreground">
            {{ t("playerProfile.characters.empty") }}
          </p>
          <div v-else class="grid items-start gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            <section
              v-for="group in characterGroups"
              :key="group.unit ?? 'other'"
              class="rounded-xl border bg-muted/20 p-2.5"
              :data-unit="group.unit ?? 'other'"
            >
              <h3 class="mb-2 flex h-5 items-center px-0.5 text-xs font-medium text-muted-foreground">
                <SekaiUnitLogo v-if="group.unit" :unit="group.unit" size="md" show-label :color="unitColorMap.get(group.unit as never) ?? null" />
                <template v-else>{{ t("playerProfile.roster.otherUnit") }}</template>
              </h3>
              <ul class="grid grid-cols-2 gap-1.5">
                <li
                  v-for="cell in group.cells"
                  :key="cell.characterId"
                  class="min-w-0 rounded-lg border bg-card px-2 py-1.5"
                  :data-character="cell.characterId"
                >
                  <div class="flex min-w-0 items-center gap-1.5">
                    <img
                      v-if="cell.iconUrl"
                      :src="cell.iconUrl"
                      alt=""
                      class="size-6 shrink-0 rounded-full bg-muted object-cover"
                      loading="lazy"
                    >
                    <span v-else class="size-6 shrink-0 rounded-full bg-muted" />
                    <span class="min-w-0 flex-1 truncate text-xs font-medium" :title="cell.name">{{ cell.name }}</span>
                    <span v-if="cell.rank != null" class="shrink-0 text-xs font-semibold tabular-nums" :title="t('playerProfile.characters.title')">
                      Lv.{{ cell.rank }}
                    </span>
                  </div>
                  <div class="mt-1.5 flex items-center gap-1.5" :title="t('playerProfile.collection.title')">
                    <span class="flex h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                      <span
                        v-if="cell.collection"
                        class="h-full rounded-full"
                        :style="{ width: `${cell.collection.percent}%`, backgroundColor: cell.color }"
                      />
                    </span>
                    <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      <template v-if="cell.collection">{{ cell.collection.owned }}/{{ cell.collection.total }}</template>
                      <template v-else>—</template>
                    </span>
                  </div>
                  <div class="mt-0.5 flex items-baseline justify-between gap-1.5 text-[11px]">
                    <span class="shrink-0 text-muted-foreground">{{ t("playerProfile.roster.challenge") }}</span>
                    <span class="min-w-0 truncate tabular-nums">
                      {{ cell.challengeScore != null ? formatScore(cell.challengeScore) : "—" }}
                    </span>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
