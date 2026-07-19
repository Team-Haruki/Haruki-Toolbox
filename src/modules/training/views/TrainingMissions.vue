<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideRefreshCw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useTrainingMissions } from "@/modules/training/composables/useTrainingMissions"
import {
  buildCharacterMissionSummary,
  type CharacterMissionRowView,
} from "@/modules/training/lib/character-missions"

const { t, locale } = useI18n()

const {
  suiteStatus,
  suiteData,
  uploadTime,
  suiteError,
  reloadSuite,
  masterLoading,
  masterError,
  missionMasters,
  parameterGroups,
  characterLevels,
  characterMap,
  reloadMaster,
} = useTrainingMissions()

const CHARACTER_IDS = Array.from({ length: 26 }, (_, index) => index + 1)

const selectedCharacterId = ref(1)

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

const summary = computed(() => {
  if (suiteStatus.value !== "ready") {
    return null
  }

  return buildCharacterMissionSummary(selectedCharacterId.value, {
    missions: missionMasters.value,
    parameterGroups: parameterGroups.value,
    characterLevels: characterLevels.value,
    userCharacters: suiteData.value?.userCharacters,
    userCharacterMissionV2s: suiteData.value?.userCharacterMissionV2s,
    userCharacterMissionV2Statuses: suiteData.value?.userCharacterMissionV2Statuses,
  })
})

const selectedCharacter = computed(() => characterMap.value.get(selectedCharacterId.value) ?? null)

function characterName(characterId: number): string {
  return characterMap.value.get(characterId)?.name ?? t("training.missions.unknownCharacter", { id: characterId })
}

function missionTitle(row: CharacterMissionRowView): string {
  return t(`training.missions.types.${row.missionType}`)
}

function missionProgressText(row: CharacterMissionRowView): string {
  const current = numberFormatter.value.format(row.current)
  if (row.upper == null) {
    return current
  }

  return `${current} / ${numberFormatter.value.format(row.upper)}`
}

function handleCharacterChange(value: unknown) {
  const parsed = typeof value === "string" ? Number(value) : Number.NaN
  if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 26) {
    selectedCharacterId.value = parsed
  }
}

function formatNumber(value: number): string {
  return numberFormatter.value.format(value)
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
  <div class="flex w-full flex-col gap-4">
    <!-- Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-xl font-bold">{{ t("training.missions.title") }}</h2>
        <p class="text-sm text-muted-foreground">{{ t("training.missions.description") }}</p>
      </div>
      <div class="flex flex-col items-start gap-1 sm:items-end">
        <Button variant="ghost" size="sm" class="h-7 gap-1 text-xs text-muted-foreground" @click="refresh">
          <LucideRefreshCw class="size-3.5" />
          {{ t("training.missions.refresh") }}
        </Button>
        <p v-if="uploadTimeText" class="text-xs text-muted-foreground">
          {{ t("training.missions.dataAsOf", { time: uploadTimeText }) }}
        </p>
      </div>
    </div>

    <!-- No account selected -->
    <Card v-if="suiteStatus === 'idle'">
      <CardContent class="py-12 text-center text-sm text-muted-foreground">
        {{ t("training.missions.noAccountHint") }}
      </CardContent>
    </Card>

    <!-- Error -->
    <Card v-else-if="hasError && !isLoading">
      <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
        <p class="text-sm text-muted-foreground">{{ t("training.missions.loadError") }}</p>
        <p v-if="errorDetail" class="max-w-full truncate font-mono text-xs text-muted-foreground">
          {{ errorDetail }}
        </p>
        <Button variant="outline" size="sm" @click="retry">
          {{ t("training.missions.retry") }}
        </Button>
      </CardContent>
    </Card>

    <!-- Loading skeleton -->
    <template v-else-if="isLoading">
      <Skeleton class="h-24 w-full rounded-lg" />
      <div class="grid grid-cols-1 gap-2 lg:grid-cols-2">
        <Skeleton v-for="index in 8" :key="index" class="h-14 w-full rounded-lg" />
      </div>
    </template>

    <template v-else-if="isReady">
      <!-- Character selector + rank summary -->
      <Card>
        <CardContent class="flex flex-col gap-3 px-4">
          <div class="flex flex-wrap items-center gap-3">
            <img
              v-if="selectedCharacter?.iconUrl"
              :src="selectedCharacter.iconUrl"
              alt=""
              class="size-10 shrink-0 rounded-full"
              loading="lazy"
            >
            <NativeSelect
              :model-value="String(selectedCharacterId)"
              class="text-sm"
              :aria-label="t('training.missions.character')"
              @update:model-value="handleCharacterChange"
            >
              <NativeSelectOption v-for="characterId in CHARACTER_IDS" :key="characterId" :value="String(characterId)">
                {{ characterName(characterId) }}
              </NativeSelectOption>
            </NativeSelect>
            <span
              v-if="summary"
              class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary"
            >
              {{ t("training.missions.rank", { rank: summary.currentLevel }) }}
            </span>
          </div>

          <div v-if="summary" class="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
            <div class="rounded-md border p-2.5">
              <p class="text-muted-foreground">{{ t("training.missions.currentExp") }}</p>
              <p class="text-sm font-semibold tabular-nums">{{ formatNumber(summary.currentExp) }}</p>
            </div>
            <div class="rounded-md border p-2.5">
              <p class="text-muted-foreground">{{ t("training.missions.pendingExp") }}</p>
              <p class="text-sm font-semibold tabular-nums">{{ formatNumber(summary.pendingExp) }}</p>
            </div>
            <div class="rounded-md border p-2.5">
              <p class="text-muted-foreground">{{ t("training.missions.projected") }}</p>
              <p class="text-sm font-semibold tabular-nums">
                {{ t("training.missions.projectedValue", { level: summary.finalLevel, exp: formatNumber(summary.finalExp) }) }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card v-if="!summary">
        <CardContent class="py-10 text-center text-sm text-muted-foreground">
          {{ t("training.missions.empty") }}
        </CardContent>
      </Card>

      <template v-else>
        <!-- Mission groups -->
        <Card v-for="group in ([
          { key: 'basic', title: t('training.missions.basicGroup'), rows: summary.basicRows },
          { key: 'achievement', title: t('training.missions.achievementGroup'), rows: summary.achievementRows },
        ] as const)" :key="group.key">
          <CardHeader class="pb-2">
            <CardTitle class="text-base">{{ group.title }}</CardTitle>
          </CardHeader>
          <CardContent>
            <p v-if="group.rows.length === 0" class="py-4 text-center text-sm text-muted-foreground">
              {{ t("training.missions.empty") }}
            </p>
            <div v-else class="grid grid-cols-1 gap-2 lg:grid-cols-2">
              <div
                v-for="row in group.rows"
                :key="row.missionId"
                class="flex flex-col gap-1.5 rounded-md border p-2.5"
              >
                <div class="flex items-baseline justify-between gap-2">
                  <p class="min-w-0 truncate text-xs font-medium" :title="missionTitle(row)">
                    {{ missionTitle(row) }}
                  </p>
                  <p class="shrink-0 text-xs font-semibold tabular-nums">
                    {{ missionProgressText(row) }}
                  </p>
                </div>
                <Progress :model-value="row.ratio * 100" class="h-1.5" />
                <p v-if="row.isEx && row.currentRound != null" class="text-[11px] tabular-nums text-muted-foreground">
                  {{ t("training.missions.exRound", { round: row.currentRound }) }}
                  <template v-if="row.currentRoundNeed != null">
                    · {{ formatNumber(row.currentRoundProgress ?? 0) }}/{{ formatNumber(row.currentRoundNeed) }}
                  </template>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </template>
    </template>
  </div>
</template>
