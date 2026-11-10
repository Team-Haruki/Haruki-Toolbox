<script setup lang="ts">
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import MissingGameDataNotice from "@/shared/components/MissingGameDataNotice.vue"
import { useUserDataPageState } from "@/shared/sekai/user-snapshot/use-user-data-page-state"

import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import TrainingCharacterStrip, { type TrainingCharacterStripRow } from "@/modules/training/components/TrainingCharacterStrip.vue"
import { useTrainingRefresh } from "@/modules/training/composables/training-context"
import { resolveSekaiCharacterColor } from "@/shared/sekai/catalog"
import { useTrainingMissions } from "@/modules/training/composables/useTrainingMissions"
import {
  buildCharacterMissionSummary,
  type CharacterMissionRowView,
} from "@/modules/training/lib/character-missions"

const { t, locale } = useI18n()

const {
  selectedAccount,
  suiteStatus,
  suiteData,
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

const { isLoading, hasError, isReady, suiteDataMissing, errorMessage, errorDetail } = useUserDataPageState({
  status: suiteStatus,
  error: suiteError,
  masterLoading: masterLoading,
  masterError: masterError,
  account: selectedAccount,
  fallback: () => t("training.missions.loadError"),
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
const selectedColor = computed(() => resolveSekaiCharacterColor(selectedCharacterId.value))

const rosterRows = computed<TrainingCharacterStripRow[]>(() =>
  CHARACTER_IDS.map((characterId) => ({
    characterId,
    name: characterName(characterId),
    iconUrl: characterMap.value.get(characterId)?.iconUrl ?? null,
    color: resolveSekaiCharacterColor(characterId),
  })),
)

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

function formatNumber(value: number): string {
  return numberFormatter.value.format(value)
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
        {{ t("training.missions.noAccountHint") }}
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
          :retry-label="t('training.missions.retry')"
          :retrying="isLoading"
          @retry="retry"
        />
      </CardContent>
    </Card>

    <!-- Loading skeleton -->
    <template v-else-if="isLoading">
      <Skeleton class="h-16 w-full rounded-xl" />
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton v-for="index in 9" :key="index" class="h-14 w-full rounded-lg" />
      </div>
    </template>

    <template v-else-if="isReady">
      <TrainingCharacterStrip
        :rows="rosterRows"
        :active-id="selectedCharacterId"
        :label="t('training.missions.character')"
        @select="selectedCharacterId = $event"
      />

      <!-- Who is selected, their level and the three experience figures: one line. -->
      <div
        class="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border border-l-4 bg-card px-4 py-3"
        :style="selectedColor ? { borderLeftColor: selectedColor } : {}"
        data-testid="missions-summary"
      >
        <div class="flex min-w-0 items-center gap-3">
          <img
            v-if="selectedCharacter?.iconUrl"
            :src="selectedCharacter.iconUrl"
            alt=""
            class="size-10 shrink-0 rounded-full"
            loading="lazy"
          >
          <p class="min-w-0 truncate text-base font-medium" :title="characterName(selectedCharacterId)">
            {{ characterName(selectedCharacterId) }}
          </p>
          <span
            v-if="summary"
            class="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-primary"
            :style="selectedColor
              ? { backgroundColor: `color-mix(in srgb, ${selectedColor} 15%, transparent)`, color: selectedColor }
              : {}"
          >
            {{ t("training.missions.rank", { rank: summary.currentLevel }) }}
          </span>
        </div>

        <dl v-if="summary" class="flex flex-wrap gap-x-8 gap-y-2 sm:ml-auto">
          <div class="flex flex-col gap-0.5">
            <dt class="text-[11px] text-muted-foreground">{{ t("training.missions.currentExp") }}</dt>
            <dd class="text-sm font-semibold leading-tight tabular-nums">{{ formatNumber(summary.currentExp) }}</dd>
          </div>
          <div class="flex flex-col gap-0.5">
            <dt class="text-[11px] text-muted-foreground">{{ t("training.missions.pendingExp") }}</dt>
            <dd class="text-sm font-semibold leading-tight tabular-nums">{{ formatNumber(summary.pendingExp) }}</dd>
          </div>
          <div class="flex flex-col gap-0.5">
            <dt class="text-[11px] text-muted-foreground">{{ t("training.missions.projected") }}</dt>
            <dd class="text-sm font-semibold leading-tight tabular-nums">
              {{ t("training.missions.projectedValue", { level: summary.finalLevel, exp: formatNumber(summary.finalExp) }) }}
            </dd>
          </div>
        </dl>
      </div>

      <p v-if="!summary" class="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
        {{ t("training.missions.empty") }}
      </p>

      <template v-else>
        <!-- Mission groups: a heading and a grid each, no card around them. -->
        <section
          v-for="group in ([
            { key: 'basic', title: t('training.missions.basicGroup'), rows: summary.basicRows },
            { key: 'achievement', title: t('training.missions.achievementGroup'), rows: summary.achievementRows },
          ] as const)"
          :key="group.key"
          class="flex flex-col gap-2"
          :data-testid="`missions-${group.key}`"
        >
          <h2 class="text-sm font-semibold">{{ group.title }}</h2>
          <p v-if="group.rows.length === 0" class="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
            {{ t("training.missions.empty") }}
          </p>
          <div v-else class="@container">
            <div class="grid grid-cols-1 gap-2 @min-[40rem]:grid-cols-2 @min-[64rem]:grid-cols-3">
              <div
                v-for="row in group.rows"
                :key="row.missionId"
                class="flex flex-col gap-1.5 rounded-lg border bg-card px-2.5 py-2"
              >
                <div class="flex items-baseline justify-between gap-2">
                  <p class="min-w-0 truncate text-xs font-medium" :title="missionTitle(row)">
                    {{ missionTitle(row) }}
                  </p>
                  <p class="shrink-0 text-xs font-semibold tabular-nums">
                    {{ missionProgressText(row) }}
                  </p>
                </div>
                <Progress :model-value="row.ratio * 100" :color="selectedColor ?? undefined" class="h-1.5" />
                <p v-if="row.isEx && row.currentRound != null" class="text-[11px] tabular-nums text-muted-foreground">
                  {{ t("training.missions.exRound", { round: row.currentRound }) }}
                  <template v-if="row.currentRoundNeed != null">
                    · {{ formatNumber(row.currentRoundProgress ?? 0) }}/{{ formatNumber(row.currentRoundNeed) }}
                  </template>
                </p>
              </div>
            </div>
          </div>
        </section>
      </template>
    </template>
  </div>
</template>
