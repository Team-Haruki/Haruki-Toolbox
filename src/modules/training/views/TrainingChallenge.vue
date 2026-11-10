<script setup lang="ts">
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import MissingGameDataNotice from "@/shared/components/MissingGameDataNotice.vue"
import { useUserDataPageState } from "@/shared/sekai/user-snapshot/use-user-data-page-state"

import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideGem, LucideTrophy } from "lucide-vue-next"
import type { AcceptableValue } from "reka-ui"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import TrainingMeter from "@/modules/training/components/TrainingMeter.vue"
import TrainingTile from "@/modules/training/components/TrainingTile.vue"
import { useTrainingRefresh } from "@/modules/training/composables/training-context"
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
import { resolveSekaiCharacterColor } from "@/shared/sekai/catalog"

const { t, locale } = useI18n()

const {
  selectedAccount,
  accountRegion,
  suiteStatus,
  suiteData,
  suiteError,
  reloadSuite,
  masterLoading,
  masterError,
  characterMap,
  rewardMasters,
  boxRewards,
  stageCaps,
  reloadMaster,
} = useTrainingChallenge()

const sortMode = ref<ChallengeSortMode>("character")

const { isLoading, hasError, isReady, suiteDataMissing, errorMessage, errorDetail } = useUserDataPageState({
  status: suiteStatus,
  error: suiteError,
  masterLoading: masterLoading,
  masterError: masterError,
  account: selectedAccount,
  fallback: () => t("training.challenge.loadError"),
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
  const stageCap = stageCaps.value.get(cell.characterId) ?? 0
  return {
    ...cell,
    name: character?.name ?? t("training.challenge.unknownCharacter"),
    iconUrl: character?.iconUrl ?? null,
    color: resolveSekaiCharacterColor(cell.characterId),
    scorePercent: displayMax.value > 0 ? Math.min((cell.highScore / displayMax.value) * 100, 100) : 0,
    stageCap,
    // EX stages can push the player past the master cap; clamp the bar only.
    stagePercent: stageCap > 0 ? Math.min((cell.stage / stageCap) * 100, 100) : 0,
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

/** Everything still claimable across the roster, for the toolbar. */
const unclaimedTotal = computed(() => cells.value.reduce(
  (total, cell) => ({ jewel: total.jewel + cell.unclaimedJewel, shard: total.shard + cell.unclaimedShard }),
  { jewel: 0, shard: 0 },
))

function formatNumber(value: number): string {
  return numberFormatter.value.format(value)
}

function handleSortChange(value: AcceptableValue | AcceptableValue[] | undefined) {
  if (typeof value === "string" && (CHALLENGE_SORT_MODES as readonly string[]).includes(value)) {
    sortMode.value = value as ChallengeSortMode
  }
}

function refresh() {
  reloadMaster()
  return reloadSuite("check-remote")
}

useTrainingRefresh(refresh)

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

    <Card v-else-if="suiteDataMissing">
      <CardContent class="py-10">
        <MissingGameDataNotice :granted="selectedAccount?.ownership === 'granted'" />
      </CardContent>
    </Card>

    <!-- Error -->
    <Card v-else-if="hasError && !isLoading">
      <CardContent>
        <LoadErrorState
          :description="errorMessage"
          :detail="errorDetail"
          :retry-label="t('training.challenge.retry')"
          :retrying="isLoading"
          @retry="retry"
        />
      </CardContent>
    </Card>

    <!-- Loading skeleton -->
    <template v-else-if="isLoading">
      <Skeleton class="h-8 w-full rounded-lg" />
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton v-for="index in 12" :key="index" class="h-24 w-full rounded-lg" />
      </div>
    </template>

    <template v-else-if="isReady">
      <!-- Toolbar: the headline figures on the left, the sort on the right. -->
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <p v-if="summary.top" class="inline-flex items-center gap-1.5">
          <LucideTrophy class="size-4 shrink-0 text-amber-500" />
          {{ t("training.challenge.summary", { name: summary.top.name, score: formatNumber(summary.top.highScore) }) }}
        </p>
        <p v-else>{{ t("training.challenge.empty") }}</p>
        <p>{{ t("training.challenge.charactersWithData", { count: summary.withDataCount, total: cells.length }) }}</p>
        <p v-if="unclaimedTotal.jewel > 0 || unclaimedTotal.shard > 0" class="inline-flex flex-wrap items-center gap-x-2.5" data-testid="challenge-unclaimed-total">
          {{ t("training.challenge.unclaimedLabel") }}
          <span class="inline-flex items-center gap-x-2.5 tabular-nums text-emerald-600 dark:text-emerald-400">
            <span v-if="unclaimedTotal.jewel > 0" class="inline-flex items-center gap-1">
              <LucideGem class="size-3.5 shrink-0" />
              {{ t("training.challenge.jewel", { count: formatNumber(unclaimedTotal.jewel) }) }}
            </span>
            <span v-if="unclaimedTotal.shard > 0">{{ t("training.challenge.shard", { count: formatNumber(unclaimedTotal.shard) }) }}</span>
          </span>
        </p>
        <ToggleGroup type="single" variant="segment" size="sm" class="ml-auto" :model-value="sortMode" :aria-label="t('catalog.sort.label')" @update:model-value="handleSortChange">
          <ToggleGroupItem value="character">{{ t("training.challenge.sortByCharacter") }}</ToggleGroupItem>
          <ToggleGroupItem value="score">{{ t("training.challenge.sortByScore") }}</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <!-- Four across on a wide page: sorted by character, a row is a unit. -->
      <div class="@container">
        <div class="grid grid-cols-1 gap-2 @min-[30rem]:grid-cols-2 @min-[46rem]:grid-cols-3 @min-[64rem]:grid-cols-4" data-testid="challenge-grid">
          <TrainingTile
            v-for="cell in sortedCells"
            :key="cell.characterId"
            :name="cell.name"
            :icon-url="cell.iconUrl"
            :color="cell.color"
            :value="cell.highScore > 0 ? formatNumber(cell.highScore) : '—'"
            :dimmed="!cell.hasData"
          >
            <div class="mt-1.5 grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1">
              <TrainingMeter :label="t('training.challenge.scoreLabel')" :percent="cell.scorePercent" :color="cell.color" />
              <TrainingMeter
                :label="t('training.challenge.stageLabel')"
                :percent="cell.stagePercent"
                :color="cell.color"
                :value="cell.stage > 0 ? (cell.stageCap > 0 ? `${cell.stage}/${cell.stageCap}` : String(cell.stage)) : '—'"
              />
            </div>
            <!-- Green is "still to claim", as on the music progress page. -->
            <p
              v-if="cell.unclaimedJewel > 0 || cell.unclaimedShard > 0"
              class="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] tabular-nums text-emerald-600 dark:text-emerald-400"
              :title="t('training.challenge.unclaimedLabel')"
            >
              <span class="sr-only">{{ t("training.challenge.unclaimedLabel") }}</span>
              <span v-if="cell.unclaimedJewel > 0" class="inline-flex items-center gap-1">
                <LucideGem class="size-3 shrink-0" />
                {{ t("training.challenge.jewel", { count: formatNumber(cell.unclaimedJewel) }) }}
              </span>
              <span v-if="cell.unclaimedShard > 0">
                {{ t("training.challenge.shard", { count: formatNumber(cell.unclaimedShard) }) }}
              </span>
            </p>
            <p v-else class="mt-1.5 text-[11px] text-muted-foreground/70">
              {{ t("training.challenge.allClaimed") }}
            </p>
          </TrainingTile>
        </div>
      </div>
    </template>
  </div>
</template>
