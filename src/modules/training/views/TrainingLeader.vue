<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
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
  void reloadSuite("check-remote")
  reloadMaster()
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

    <!-- Error -->
    <Card v-else-if="hasError && !isLoading">
      <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
        <p class="text-sm text-muted-foreground">{{ t("training.leader.loadError") }}</p>
        <p v-if="errorDetail" class="max-w-full truncate font-mono text-xs text-muted-foreground">
          {{ errorDetail }}
        </p>
        <Button variant="outline" size="sm" @click="retry">
          {{ t("training.leader.retry") }}
        </Button>
      </CardContent>
    </Card>

    <!-- Loading skeleton -->
    <template v-else-if="isLoading">
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton v-for="index in 9" :key="index" class="h-20 w-full rounded-lg" />
      </div>
    </template>

    <template v-else-if="isReady">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p v-if="maxPlayCount > 0" class="text-xs tabular-nums text-muted-foreground">
          {{ t("training.leader.limit", { count: formatCount(maxPlayCount) }) }}
        </p>
        <ToggleGroup type="single" variant="segment" size="sm" class="ml-auto" :model-value="sortMode" :aria-label="t('catalog.sort.label')" @update:model-value="handleSortChange">
          <ToggleGroupItem value="total">{{ t("training.leader.sortByTotal") }}</ToggleGroupItem>
          <ToggleGroupItem value="character">{{ t("training.leader.sortByCharacter") }}</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="cell in leaderCells"
          :key="cell.characterId"
          class="border-l-4 py-3"
          :style="cell.color ? { borderLeftColor: cell.color } : {}"
        >
          <CardContent class="flex items-center gap-3 px-4">
            <img
              v-if="cell.iconUrl"
              :src="cell.iconUrl"
              alt=""
              class="size-10 shrink-0 rounded-full"
              loading="lazy"
            >
            <div class="min-w-0 flex-1">
              <div class="flex items-baseline justify-between gap-2">
                <p class="truncate text-sm font-medium" :title="cell.name">{{ cell.name }}</p>
                <p class="shrink-0 text-sm font-semibold tabular-nums">
                  {{ formatCount(cell.playCount + cell.exCount) }}
                </p>
              </div>
              <div class="mt-1.5 grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1">
                <span class="text-center text-[11px] text-muted-foreground">{{ t("training.leader.normalLabel") }}</span>
                <Progress :model-value="cell.percent" :color="cell.color ?? undefined" class="h-1.5" />
                <span class="text-center text-[11px] tabular-nums text-muted-foreground">
                  {{ formatCount(cell.playCount) }}<template v-if="maxPlayCount > 0">/{{ formatCount(maxPlayCount) }}</template>
                </span>

                <span class="text-center text-[11px] text-muted-foreground">{{ t("training.leader.exLevel", { level: cell.exLevel }) }}</span>
                <Progress :model-value="cell.exPercent" :color="cell.color ?? undefined" class="h-1.5" />
                <span class="text-center text-[11px] tabular-nums text-muted-foreground">
                  {{ formatCount(cell.exCount) }}<template v-if="maxExCount > 0">/{{ formatCount(maxExCount) }}</template>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
