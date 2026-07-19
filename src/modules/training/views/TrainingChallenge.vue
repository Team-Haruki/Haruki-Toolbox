<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideGem, LucideRefreshCw, LucideTrophy } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTrainingChallenge } from "@/modules/training/composables/useTrainingChallenge"
import {
  CHALLENGE_SORT_MODES,
  buildChallengeGrid,
  collectClaimedChallengeRewardIds,
  resolveChallengeDisplayMax,
  sortChallengeCells,
  summarizeChallengeCells,
  type ChallengeSortMode,
} from "@/modules/training/lib/challenge-live"

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
  characterMap,
  rewardMasters,
  boxRewards,
  reloadMaster,
} = useTrainingChallenge()

const sortMode = ref<ChallengeSortMode>("character")

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

const cells = computed(() => buildChallengeGrid({
  results: suiteData.value?.userChallengeLiveSoloResults,
  stages: suiteData.value?.userChallengeLiveSoloStages,
  rewardMasters: rewardMasters.value,
  boxRewards: boxRewards.value,
  claimedRewardIds: collectClaimedChallengeRewardIds(suiteData.value?.userChallengeLiveSoloHighScoreRewards),
}))

const displayMax = computed(() => resolveChallengeDisplayMax(rewardMasters.value, cells.value, accountRegion.value))

const sortedCells = computed(() => sortChallengeCells(cells.value, sortMode.value).map((cell) => {
  const character = characterMap.value.get(cell.characterId) ?? null
  return {
    ...cell,
    name: character?.name ?? t("training.challenge.unknownCharacter"),
    iconUrl: character?.iconUrl ?? null,
    scorePercent: displayMax.value > 0 ? Math.min((cell.highScore / displayMax.value) * 100, 100) : 0,
  }
}))

const summary = computed(() => {
  const { top, withDataCount } = summarizeChallengeCells(cells.value)
  if (top == null) {
    return { top: null, withDataCount }
  }

  const character = characterMap.value.get(top.characterId) ?? null
  return {
    top: { ...top, name: character?.name ?? t("training.challenge.unknownCharacter") },
    withDataCount,
  }
})

function formatNumber(value: number): string {
  return numberFormatter.value.format(value)
}

function handleSortChange(value: unknown) {
  if (typeof value === "string" && (CHALLENGE_SORT_MODES as readonly string[]).includes(value)) {
    sortMode.value = value as ChallengeSortMode
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
  <div class="flex flex-col gap-4">
    <!-- No account selected -->
    <Card v-if="suiteStatus === 'idle'">
      <CardContent class="py-12 text-center text-sm text-muted-foreground">
        {{ t("training.challenge.noAccountHint") }}
      </CardContent>
    </Card>

    <!-- Error -->
    <Card v-else-if="hasError && !isLoading">
      <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
        <p class="text-sm text-muted-foreground">{{ t("training.challenge.loadError") }}</p>
        <p v-if="errorDetail" class="max-w-full truncate font-mono text-xs text-muted-foreground">
          {{ errorDetail }}
        </p>
        <Button variant="outline" size="sm" @click="retry">
          {{ t("training.challenge.retry") }}
        </Button>
      </CardContent>
    </Card>

    <!-- Loading skeleton -->
    <template v-else-if="isLoading">
      <Skeleton class="h-16 w-full rounded-lg" />
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton v-for="index in 9" :key="index" class="h-24 w-full rounded-lg" />
      </div>
    </template>

    <Card v-else-if="isReady">
      <CardHeader class="pb-2">
        <CardTitle class="flex flex-wrap items-center justify-between gap-2 text-base">
          <span>{{ t("training.challenge.title") }}</span>
          <span class="flex flex-wrap items-center gap-2">
            <Tabs :model-value="sortMode" @update:model-value="handleSortChange">
              <TabsList class="h-8">
                <TabsTrigger value="character" class="text-xs">
                  {{ t("training.challenge.sortByCharacter") }}
                </TabsTrigger>
                <TabsTrigger value="score" class="text-xs">
                  {{ t("training.challenge.sortByScore") }}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="ghost" size="sm" class="h-7 gap-1 text-xs text-muted-foreground" @click="refresh">
              <LucideRefreshCw class="size-3.5" />
              {{ t("training.challenge.refresh") }}
            </Button>
          </span>
        </CardTitle>
        <p v-if="uploadTimeText" class="text-xs text-muted-foreground">
          {{ t("training.challenge.dataAsOf", { time: uploadTimeText }) }}
        </p>
      </CardHeader>
      <CardContent class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <p v-if="summary.top" class="inline-flex items-center gap-1.5">
            <LucideTrophy class="size-4 shrink-0 text-amber-500" />
            {{ t("training.challenge.summary", { name: summary.top.name, score: formatNumber(summary.top.highScore) }) }}
          </p>
          <p v-else>{{ t("training.challenge.empty") }}</p>
          <p>{{ t("training.challenge.charactersWithData", { count: summary.withDataCount, total: cells.length }) }}</p>
        </div>

        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="cell in sortedCells"
            :key="cell.characterId"
            :class="[
              'flex flex-col gap-2 rounded-md border p-2.5',
              cell.hasData ? '' : 'opacity-50',
            ]"
          >
            <div class="flex items-center gap-2">
              <img
                v-if="cell.iconUrl"
                :src="cell.iconUrl"
                alt=""
                class="size-9 shrink-0 rounded-full"
                loading="lazy"
              >
              <div class="min-w-0 flex-1">
                <p class="truncate text-xs" :title="cell.name">{{ cell.name }}</p>
                <p class="text-sm font-semibold tabular-nums">
                  {{ cell.highScore > 0 ? formatNumber(cell.highScore) : "—" }}
                </p>
              </div>
              <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {{ cell.stage > 0 ? t("training.challenge.stage", { stage: cell.stage }) : "—" }}
              </span>
            </div>

            <div class="h-1.5 w-full overflow-hidden rounded-full bg-primary/15">
              <div
                class="h-full rounded-full bg-primary transition-all"
                :style="{ width: `${cell.scorePercent}%` }"
              />
            </div>

            <p
              v-if="cell.unclaimedJewel > 0 || cell.unclaimedShard > 0"
              class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] tabular-nums text-muted-foreground"
            >
              <span class="inline-flex items-center gap-1">
                <LucideGem class="size-3 shrink-0 text-sky-500" />
                {{ t("training.challenge.jewel", { count: formatNumber(cell.unclaimedJewel) }) }}
              </span>
              <span>{{ t("training.challenge.shard", { count: formatNumber(cell.unclaimedShard) }) }}</span>
            </p>
            <p v-else class="text-[11px] text-muted-foreground">
              {{ t("training.challenge.allClaimed") }}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
