<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { LucideCopy, LucideRefreshCw, LucideTrophy } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GameAccountSelect from "@/shared/components/GameAccountSelect.vue"
import { copyTextToClipboard } from "@/lib/clipboard"
import { usePlayerProfile } from "@/modules/player-profile/composables/usePlayerProfile"
import {
  CHALLENGE_LIVE_SORT_MODES,
  buildChallengeLiveGrid,
  buildCharacterRanks,
  buildDeckThumbnailCard,
  buildMusicClearCounts,
  buildPlayerCardMap,
  normalizePlayerCards,
  normalizePlayerGamedata,
  normalizePlayerProfile,
  resolveActiveDeckCardIds,
  sortChallengeLiveCells,
  summarizeChallengeLiveTop,
  type ChallengeLiveSortMode,
} from "@/modules/player-profile/lib/player-profile"
import CardThumbnail from "@/shared/components/SekaiCardThumbnail.vue"
import { buildCardThumbnailView, type DeckRecommendMasterCard } from "@/modules/deck-recommend/lib/card-thumbnail"
import { MUSIC_DIFFICULTY_COLORS } from "@/modules/music-library/lib/music-difficulties"

const { t, locale } = useI18n()

const {
  accountRegion,
  suiteStatus,
  suiteData,
  uploadTime,
  suiteError,
  reloadSuite,
  masterLoading,
  masterError,
  assetEndpoint,
  cardMap,
  characterMap,
  unitColorMap,
  characterColorMap,
  reloadMaster,
} = usePlayerProfile()

const challengeSort = ref<ChallengeLiveSortMode>("character")

const isLoading = computed(() => suiteStatus.value === "loading" || masterLoading.value)
const hasError = computed(() => suiteStatus.value === "error" || masterError.value != null)
const isReady = computed(() => suiteStatus.value === "ready" && !masterLoading.value && masterError.value == null)

const errorDetail = computed(() => {
  if (masterError.value != null) {
    return masterError.value
  }

  const raw = suiteError.value
  if (raw == null) {
    return null
  }

  return raw instanceof Error ? raw.message : String(raw)
})

const uploadTimeText = computed(() => {
  if (uploadTime.value == null) {
    return null
  }

  return new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeStyle: "short" })
    .format(uploadTime.value)
})

const numberFormatter = computed(() => new Intl.NumberFormat(locale.value))

const gamedata = computed(() => normalizePlayerGamedata(suiteData.value?.userGamedata))
const profileInfo = computed(() => normalizePlayerProfile(suiteData.value?.userProfile))
const playerCardMap = computed(() => buildPlayerCardMap(normalizePlayerCards(suiteData.value?.userCards)))

const deckViews = computed(() => {
  const cardIds = resolveActiveDeckCardIds(suiteData.value?.userDecks, gamedata.value?.deck ?? null)
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

const musicRows = computed(() => buildMusicClearCounts(suiteData.value?.userMusicResults))

const characterRankCells = computed(() => buildCharacterRanks(suiteData.value?.userCharacters).map((entry) => {
  const character = characterMap.value.get(entry.characterId) ?? null
  const unitColor = character?.unit != null ? unitColorMap.value.get(character.unit) ?? null : null
  return {
    ...entry,
    name: character?.name ?? t("playerProfile.unknownCharacter"),
    iconUrl: character?.iconUrl ?? null,
    color: characterColorMap.value.get(entry.characterId) ?? unitColor,
  }
}))

const challengeCells = computed(() => buildChallengeLiveGrid(
  suiteData.value?.userChallengeLiveSoloResults,
  suiteData.value?.userChallengeLiveSoloStages,
))

const sortedChallengeCells = computed(() =>
  sortChallengeLiveCells(challengeCells.value, challengeSort.value).map((cell) => {
    const character = characterMap.value.get(cell.characterId) ?? null
    return {
      ...cell,
      name: character?.name ?? t("playerProfile.unknownCharacter"),
      iconUrl: character?.iconUrl ?? null,
    }
  }),
)

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

function handleChallengeSortChange(value: unknown) {
  if (typeof value === "string" && (CHALLENGE_LIVE_SORT_MODES as readonly string[]).includes(value)) {
    challengeSort.value = value as ChallengeLiveSortMode
  }
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
  void reloadSuite("check-remote")
  reloadMaster()
}

function retry() {
  if (masterError.value != null) {
    reloadMaster()
  }

  if (suiteStatus.value === "error") {
    void reloadSuite("check-remote")
  }
}
</script>

<template>
  <div class="w-full max-w-6xl mx-auto flex flex-col gap-4">
    <!-- Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t("playerProfile.title") }}</h1>
        <p class="text-sm text-muted-foreground">{{ t("playerProfile.description") }}</p>
      </div>
      <div class="flex flex-col items-start gap-1 sm:items-end">
        <GameAccountSelect />
        <p v-if="uploadTimeText" class="text-xs text-muted-foreground">
          {{ t("playerProfile.dataAsOf", { time: uploadTimeText }) }}
        </p>
      </div>
    </div>

    <!-- No account selected -->
    <Card v-if="suiteStatus === 'idle'">
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
        <CardContent class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xl font-semibold">{{ gamedata?.name || "—" }}</span>
              <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary">
                {{ t("playerProfile.header.rank", { rank: gamedata?.rank ?? 0 }) }}
              </span>
            </div>
            <p v-if="profileInfo.word" class="whitespace-pre-wrap break-words text-sm text-muted-foreground">
              {{ profileInfo.word }}
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
              class="grid w-full max-w-[41rem] grid-cols-5 content-center justify-items-center gap-0.5 rounded bg-muted/20 p-0.5 ring-1 ring-border/60 sm:gap-1 sm:rounded-md"
            >
              <CardThumbnail
                v-for="view in deckViews"
                :key="view.cardId"
                :thumbnail="view.thumbnail"
                size="fluid"
                :corner-badge="view.level != null && view.level > 0 ? t('playerProfile.badge.level', { level: view.level }) : null"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Music clear counts -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base">{{ t("playerProfile.music.title") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p v-if="musicRows.length === 0" class="py-4 text-center text-sm text-muted-foreground">
            {{ t("playerProfile.music.empty") }}
          </p>
          <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="row in musicRows"
              :key="row.difficulty"
              class="flex items-center gap-3 rounded-md border p-2.5"
            >
              <span
                class="inline-flex min-w-16 items-center justify-center rounded px-2 py-0.5 text-xs font-semibold text-white"
                :style="{ backgroundColor: MUSIC_DIFFICULTY_COLORS[row.difficulty] }"
              >
                {{ t(`musicLibrary.difficulty.${row.difficulty}`) }}
              </span>
              <span class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs tabular-nums text-muted-foreground">
                <span>{{ t("playerProfile.music.clear") }} <b class="font-semibold text-foreground">{{ row.clear }}</b></span>
                <span>{{ t("playerProfile.music.fullCombo") }} <b class="font-semibold text-foreground">{{ row.fullCombo }}</b></span>
                <span>{{ t("playerProfile.music.allPerfect") }} <b class="font-semibold text-foreground">{{ row.allPerfect }}</b></span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Character growth -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base">{{ t("playerProfile.characters.title") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p v-if="characterRankCells.length === 0" class="py-4 text-center text-sm text-muted-foreground">
            {{ t("playerProfile.characters.empty") }}
          </p>
          <div v-else class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            <div
              v-for="cell in characterRankCells"
              :key="cell.characterId"
              class="flex items-center gap-2 rounded-md border border-l-4 p-2"
              :style="cell.color ? { borderLeftColor: cell.color } : {}"
            >
              <img
                v-if="cell.iconUrl"
                :src="cell.iconUrl"
                alt=""
                class="size-8 shrink-0 rounded-full"
                loading="lazy"
              >
              <div class="min-w-0 flex-1">
                <p class="truncate text-xs" :title="cell.name">{{ cell.name }}</p>
                <p class="text-sm font-semibold tabular-nums">
                  {{ t("playerProfile.characters.rank", { rank: cell.characterRank }) }}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Challenge live -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="flex flex-wrap items-center justify-between gap-2 text-base">
            <span>{{ t("playerProfile.challenge.title") }}</span>
            <Tabs :model-value="challengeSort" @update:model-value="handleChallengeSortChange">
              <TabsList class="h-8">
                <TabsTrigger value="character" class="text-xs">
                  {{ t("playerProfile.challenge.sortByCharacter") }}
                </TabsTrigger>
                <TabsTrigger value="score" class="text-xs">
                  {{ t("playerProfile.challenge.sortByScore") }}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col gap-3">
          <p
            v-if="challengeTop"
            class="inline-flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
          >
            <LucideTrophy class="size-4 shrink-0 text-amber-500" />
            {{ t("playerProfile.challenge.summary", { name: challengeTop.name, score: formatScore(challengeTop.highScore) }) }}
          </p>
          <p v-else class="text-sm text-muted-foreground">
            {{ t("playerProfile.challenge.empty") }}
          </p>

          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            <div
              v-for="cell in sortedChallengeCells"
              :key="cell.characterId"
              :class="[
                'flex items-center gap-2 rounded-md border p-2',
                cell.hasData ? '' : 'opacity-50',
              ]"
            >
              <img
                v-if="cell.iconUrl"
                :src="cell.iconUrl"
                alt=""
                class="size-8 shrink-0 rounded-full"
                loading="lazy"
              >
              <div class="min-w-0 flex-1">
                <p class="truncate text-xs" :title="cell.name">{{ cell.name }}</p>
                <p class="text-sm font-semibold tabular-nums">
                  {{ cell.highScore > 0 ? formatScore(cell.highScore) : "—" }}
                </p>
                <p class="text-[11px] tabular-nums text-muted-foreground">
                  {{ cell.stage > 0 ? t("playerProfile.challenge.stage", { stage: cell.stage }) : "—" }}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
