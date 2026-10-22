<script setup lang="ts">
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import MissingGameDataNotice from "@/shared/components/MissingGameDataNotice.vue"
import { useUserDataPageState } from "@/shared/sekai/user-snapshot/use-user-data-page-state"

import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useTrainingRefresh } from "@/modules/training/composables/training-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SEKAI_CARD_ATTR_COLORS, resolveSekaiCharacterColor, type SekaiUnit } from "@/shared/sekai/catalog"
import { resolveCardAttrRoundIconUrl, resolveUnitLogoUrl } from "@/shared/sekai/data-sources"
import { useTrainingPower } from "@/modules/training/composables/useTrainingPower"
import {
  buildPowerBonuses,
  collectUserAreaItemLevels,
  formatPowerBonusPercent,
  normalizeUserCharacterRanks,
  normalizeUserMysekaiFixtureBonuses,
  normalizeUserMysekaiGates,
} from "@/modules/training/lib/power-bonus"

const { t } = useI18n()

const {
  selectedAccount,
  suiteStatus,
  suiteData,
  suiteError,
  reloadSuite,
  masterLoading,
  masterError,
  characterMap,
  unitColorMap,
  areaItemLevels,
  characterRanks,
  mysekaiGateLevels,
  reloadMaster,
} = useTrainingPower()

const { isLoading, hasError, isReady, suiteDataMissing, errorMessage, errorDetail } = useUserDataPageState({
  status: suiteStatus,
  error: suiteError,
  masterLoading: masterLoading,
  masterError: masterError,
  account: selectedAccount,
  fallback: () => t("training.power.loadError"),
})


const bonuses = computed(() => buildPowerBonuses({
  userAreaItemLevels: collectUserAreaItemLevels(suiteData.value?.userAreas),
  areaItemLevels: areaItemLevels.value,
  userCharacters: normalizeUserCharacterRanks(suiteData.value?.userCharacters),
  characterRanks: characterRanks.value,
  mysekaiGateLevels: mysekaiGateLevels.value,
  userMysekaiGates: normalizeUserMysekaiGates(suiteData.value?.userMysekaiGates),
  userMysekaiFixtureBonuses: normalizeUserMysekaiFixtureBonuses(
    suiteData.value?.userMysekaiFixtureGameCharacterPerformanceBonuses,
  ),
}))

const characterRows = computed(() => bonuses.value.characters.map((bonus) => {
  const character = characterMap.value.get(bonus.characterId) ?? null
  const unitColor = character?.unit != null ? unitColorMap.value.get(character.unit) ?? null : null
  return {
    ...bonus,
    name: character?.name ?? t("training.power.unknownCharacter"),
    iconUrl: character?.iconUrl ?? null,
    color: resolveSekaiCharacterColor(bonus.characterId) ?? unitColor,
  }
}))

const unitRows = computed(() => bonuses.value.units.map((bonus) => ({
  ...bonus,
  label: t(`training.power.units.${bonus.unit}`),
  color: unitColorMap.value.get(bonus.unit) ?? null,
  logoUrl: resolveUnitLogoUrl(bonus.unit),
})))

const attrRows = computed(() => bonuses.value.attrs.map((bonus) => ({
  ...bonus,
  label: t(`training.power.attrs.${bonus.attr}`),
  iconUrl: resolveCardAttrRoundIconUrl(bonus.attr),
  color: SEKAI_CARD_ATTR_COLORS[bonus.attr] ?? null,
})))

// Units whose emblem image failed to load just drop the image.
const failedUnitLogos = ref<Set<SekaiUnit>>(new Set())

function markUnitLogoFailed(unit: SekaiUnit) {
  const next = new Set(failedUnitLogos.value)
  next.add(unit)
  failedUnitLogos.value = next
}

function formatPercent(value: number): string {
  return formatPowerBonusPercent(value)
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
        {{ t("training.power.noAccountHint") }}
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
          :retry-label="t('training.power.retry')"
          :retrying="isLoading"
          @retry="retry"
        />
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
      <Card v-if="bonuses.allCharacterAreaItem > 0 || bonuses.multiUnitAreaItem > 0">
        <CardHeader class="pb-2">
          <CardTitle class="text-base">{{ t("training.power.sharedAreaTitle") }}</CardTitle>
        </CardHeader>
        <CardContent class="space-y-2 text-sm">
          <p v-if="bonuses.allCharacterAreaItem > 0">
            {{ t("training.power.allCharacterBonus") }}
            <span class="font-semibold tabular-nums">{{ formatPercent(bonuses.allCharacterAreaItem) }}</span>
          </p>
          <p v-if="bonuses.multiUnitAreaItem > 0">
            {{ t("training.power.multiUnitBonus") }}
            <span class="font-semibold tabular-nums">{{ formatPercent(bonuses.multiUnitAreaItem) }}</span>
          </p>
          <p class="text-xs text-muted-foreground">{{ t("training.power.sharedAreaHint") }}</p>
        </CardContent>
      </Card>

      <!-- Character bonuses -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base">{{ t("training.power.charactersTitle") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="row in characterRows"
              :key="row.characterId"
              class="flex items-center gap-2 rounded-md border border-l-4 p-2"
              :style="row.color ? { borderLeftColor: row.color } : {}"
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
                  <span v-if="row.fixture > 0">{{ t("training.power.fixtureBonus") }} {{ formatPercent(row.fixture) }}</span>
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
              <img
                v-if="!failedUnitLogos.has(row.unit)"
                :src="row.logoUrl"
                alt=""
                class="h-5 w-auto max-w-10 shrink-0 object-contain"
                loading="lazy"
                @error="markUnitLogoFailed(row.unit)"
              >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm" :title="row.label">{{ row.label }}</p>
                <p class="flex flex-wrap gap-x-3 text-[11px] tabular-nums text-muted-foreground">
                  <span>{{ t("training.power.areaItemBonus") }} {{ formatPercent(row.areaItem) }}</span>
                  <span v-if="row.gate > 0">{{ t("training.power.gateBonus") }} {{ formatPercent(row.gate) }}</span>
                </p>
              </div>
              <span class="shrink-0 text-sm font-semibold tabular-nums">
                {{ formatPercent(row.total) }}
              </span>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">{{ t("training.power.gateHint") }}</p>
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
              class="flex items-center gap-2 rounded-md border border-l-4 p-2.5"
              :style="row.color ? { borderLeftColor: row.color } : {}"
            >
              <img :src="row.iconUrl" alt="" class="size-5 shrink-0" loading="lazy">
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
