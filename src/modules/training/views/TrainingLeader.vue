<script setup lang="ts">
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import MissingGameDataNotice from "@/shared/components/MissingGameDataNotice.vue"
import { useUserDataPageState } from "@/shared/sekai/user-snapshot/use-user-data-page-state"

import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import TrainingMeter from "@/modules/training/components/TrainingMeter.vue"
import TrainingTile from "@/modules/training/components/TrainingTile.vue"
import { useTrainingRefresh } from "@/modules/training/composables/training-context"
import { useTrainingLeader } from "@/modules/training/composables/useTrainingLeader"
import {
  LEADER_SORT_MODES,
  buildLeaderCounts,
  sortLeaderCounts,
  type LeaderSortMode,
} from "@/modules/training/lib/leader-count"
import { resolveSekaiCharacterColor } from "@/shared/sekai/catalog"

const { t, locale } = useI18n()

const {
  selectedAccount,
  suiteStatus,
  suiteData,
  suiteError,
  reloadSuite,
  masterLoading,
  masterError,
  parameterGroups,
  characterMap,
  reloadMaster,
} = useTrainingLeader()

const sortMode = ref<LeaderSortMode>("total")

const { isLoading, hasError, isReady, suiteDataMissing, errorMessage, errorDetail } = useUserDataPageState({
  status: suiteStatus,
  error: suiteError,
  masterLoading: masterLoading,
  masterError: masterError,
  account: selectedAccount,
  fallback: () => t("training.leader.loadError"),
})


const numberFormatter = computed(() => new Intl.NumberFormat(locale.value))

const leaderResult = computed(() => {
  if (suiteStatus.value !== "ready") {
    return null
  }

  return buildLeaderCounts({
    userCharacterMissionV2s: suiteData.value?.userCharacterMissionV2s,
    userCharacterLiveUsageCounts: suiteData.value?.userCharacterLiveUsageCounts,
    userCharacterMissionV2Statuses: suiteData.value?.userCharacterMissionV2Statuses,
    parameterGroups: parameterGroups.value,
  })
})

const leaderCells = computed(() => {
  const result = leaderResult.value
  if (result == null) {
    return []
  }

  const sorted = sortLeaderCounts([...result.leaders], sortMode.value)
  return sorted.map((leader) => {
    const character = characterMap.value.get(leader.characterId) ?? null
    const percent = result.maxPlayCount > 0
      ? Math.min(100, (leader.playCount / result.maxPlayCount) * 100)
      : 0
    const exPercent = result.maxExCount > 0
      ? Math.min(100, (leader.exCount / result.maxExCount) * 100)
      : 0
    return {
      ...leader,
      name: character?.name ?? t("training.leader.unknownCharacter"),
      iconUrl: character?.iconUrl ?? null,
      color: resolveSekaiCharacterColor(leader.characterId),
      percent,
      exPercent,
    }
  })
})

const maxPlayCount = computed(() => leaderResult.value?.maxPlayCount ?? 0)
const maxExCount = computed(() => leaderResult.value?.maxExCount ?? 0)

function formatCount(value: number): string {
  return numberFormatter.value.format(value)
}

function handleSortChange(value: AcceptableValue | AcceptableValue[] | undefined) {
  if (typeof value === "string" && (LEADER_SORT_MODES as readonly string[]).includes(value)) {
    sortMode.value = value as LeaderSortMode
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
  <div class="flex w-full flex-col gap-4">
    <!-- No account selected -->
    <Card v-if="suiteStatus === 'idle'">
      <CardContent class="py-12 text-center text-sm text-muted-foreground">
        {{ t("training.leader.noAccountHint") }}
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
          :retry-label="t('training.leader.retry')"
          :retrying="isLoading"
          @retry="retry"
        />
      </CardContent>
    </Card>

    <!-- Loading skeleton -->
    <template v-else-if="isLoading">
      <Skeleton class="h-8 w-full rounded-lg" />
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton v-for="index in 12" :key="index" class="h-20 w-full rounded-lg" />
      </div>
    </template>

    <template v-else-if="isReady">
      <!-- The two caps are the same for every character: say them once here
           instead of "/60,000" on every bar. -->
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <p v-if="maxPlayCount > 0" class="tabular-nums">{{ t("training.leader.limit", { count: formatCount(maxPlayCount) }) }}</p>
        <p v-if="maxExCount > 0" class="tabular-nums">{{ t("training.leader.exLimit", { count: formatCount(maxExCount) }) }}</p>
        <ToggleGroup type="single" variant="segment" size="sm" class="ml-auto" :model-value="sortMode" :aria-label="t('catalog.sort.label')" @update:model-value="handleSortChange">
          <ToggleGroupItem value="total">{{ t("training.leader.sortByTotal") }}</ToggleGroupItem>
          <ToggleGroupItem value="character">{{ t("training.leader.sortByCharacter") }}</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div class="@container">
        <div class="grid grid-cols-1 gap-2 @min-[30rem]:grid-cols-2 @min-[46rem]:grid-cols-3 @min-[64rem]:grid-cols-4" data-testid="leader-grid">
          <TrainingTile
            v-for="cell in leaderCells"
            :key="cell.characterId"
            :name="cell.name"
            :icon-url="cell.iconUrl"
            :color="cell.color"
            :value="formatCount(cell.playCount + cell.exCount)"
          >
            <div class="mt-1.5 grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1">
              <TrainingMeter :label="t('training.leader.normalLabel')" :percent="cell.percent" :color="cell.color" :value="formatCount(cell.playCount)" />
              <TrainingMeter :label="t('training.leader.exLevel', { level: cell.exLevel })" :percent="cell.exPercent" :color="cell.color" :value="formatCount(cell.exCount)" />
            </div>
          </TrainingTile>
        </div>
      </div>
    </template>
  </div>
</template>
