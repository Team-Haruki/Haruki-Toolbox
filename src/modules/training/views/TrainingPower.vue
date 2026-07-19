<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideRefreshCw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useTrainingPower } from "@/modules/training/composables/useTrainingPower"
import {
  buildPowerBonuses,
  collectUserAreaItemLevels,
  formatPowerBonusPercent,
  normalizeUserCharacterRanks,
} from "@/modules/training/lib/power-bonus"

const { t, locale } = useI18n()

const {
  suiteStatus,
  suiteData,
  uploadTime,
  suiteError,
  reloadSuite,
  masterLoading,
  masterError,
  characterMap,
  unitColorMap,
  areaItemLevels,
  characterRanks,
  reloadMaster,
} = useTrainingPower()

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

const bonuses = computed(() => buildPowerBonuses({
  userAreaItemLevels: collectUserAreaItemLevels(suiteData.value?.userAreas),
  areaItemLevels: areaItemLevels.value,
  userCharacters: normalizeUserCharacterRanks(suiteData.value?.userCharacters),
  characterRanks: characterRanks.value,
}))

const characterRows = computed(() => bonuses.value.characters.map((bonus) => {
  const character = characterMap.value.get(bonus.characterId) ?? null
  const unitColor = character?.unit != null ? unitColorMap.value.get(character.unit) ?? null : null
  return {
    ...bonus,
    name: character?.name ?? t("training.power.unknownCharacter"),
    iconUrl: character?.iconUrl ?? null,
    unitColor,
  }
}))

const unitRows = computed(() => bonuses.value.units.map((bonus) => ({
  ...bonus,
  label: t(`training.power.units.${bonus.unit}`),
  color: unitColorMap.value.get(bonus.unit) ?? null,
})))

const attrRows = computed(() => bonuses.value.attrs.map((bonus) => ({
  ...bonus,
  label: t(`training.power.attrs.${bonus.attr}`),
})))

function formatPercent(value: number): string {
  return formatPowerBonusPercent(value)
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
        {{ t("training.power.noAccountHint") }}
      </CardContent>
    </Card>

    <!-- Error -->
    <Card v-else-if="hasError && !isLoading">
      <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
        <p class="text-sm text-muted-foreground">{{ t("training.power.loadError") }}</p>
        <p v-if="errorDetail" class="max-w-full truncate font-mono text-xs text-muted-foreground">
          {{ errorDetail }}
        </p>
        <Button variant="outline" size="sm" @click="retry">
          {{ t("training.power.retry") }}
        </Button>
      </CardContent>
    </Card>

    <!-- Loading skeleton -->
    <template v-else-if="isLoading">
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <Skeleton v-for="index in 8" :key="index" class="h-20 w-full rounded-lg" />
      </div>
      <Skeleton class="h-48 w-full rounded-lg" />
      <Skeleton class="h-40 w-full rounded-lg" />
    </template>

    <template v-else-if="isReady">
      <!-- Character bonuses -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="flex flex-wrap items-center justify-between gap-2 text-base">
            <span>{{ t("training.power.charactersTitle") }}</span>
            <Button variant="ghost" size="sm" class="h-7 gap-1 text-xs text-muted-foreground" @click="refresh">
              <LucideRefreshCw class="size-3.5" />
              {{ t("training.power.refresh") }}
            </Button>
          </CardTitle>
          <p v-if="uploadTimeText" class="text-xs text-muted-foreground">
            {{ t("training.power.dataAsOf", { time: uploadTimeText }) }}
          </p>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="row in characterRows"
              :key="row.characterId"
              class="flex items-center gap-2 rounded-md border border-l-4 p-2"
              :style="row.unitColor ? { borderLeftColor: row.unitColor } : {}"
            >
              <img
                v-if="row.iconUrl"
                :src="row.iconUrl"
                alt=""
                class="size-9 shrink-0 rounded-full"
                loading="lazy"
              >
              <div class="min-w-0 flex-1">
                <p class="truncate text-xs" :title="row.name">{{ row.name }}</p>
                <p class="flex flex-wrap gap-x-3 text-[11px] tabular-nums text-muted-foreground">
                  <span>{{ t("training.power.rankBonus") }} {{ formatPercent(row.rank) }}</span>
                  <span>{{ t("training.power.areaItemBonus") }} {{ formatPercent(row.areaItem) }}</span>
                </p>
              </div>
              <span class="shrink-0 text-sm font-semibold tabular-nums">
                {{ formatPercent(row.total) }}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Unit bonuses -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base">{{ t("training.power.unitsTitle") }}</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col gap-3">
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="row in unitRows"
              :key="row.unit"
              class="flex items-center gap-2 rounded-md border border-l-4 p-2.5"
              :style="row.color ? { borderLeftColor: row.color } : {}"
            >
              <p class="min-w-0 flex-1 truncate text-sm" :title="row.label">{{ row.label }}</p>
              <span class="shrink-0 text-sm font-semibold tabular-nums">
                {{ formatPercent(row.total) }}
              </span>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">{{ t("training.power.mysekaiNote") }}</p>
        </CardContent>
      </Card>

      <!-- Attribute bonuses -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base">{{ t("training.power.attrsTitle") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="row in attrRows"
              :key="row.attr"
              class="flex items-center gap-2 rounded-md border p-2.5"
            >
              <p class="min-w-0 flex-1 truncate text-sm" :title="row.label">{{ row.label }}</p>
              <span class="shrink-0 text-sm font-semibold tabular-nums">
                {{ formatPercent(row.total) }}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
