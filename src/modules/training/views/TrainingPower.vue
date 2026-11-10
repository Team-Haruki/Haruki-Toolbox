<script setup lang="ts">
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import MissingGameDataNotice from "@/shared/components/MissingGameDataNotice.vue"
import { useUserDataPageState } from "@/shared/sekai/user-snapshot/use-user-data-page-state"

import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { useTrainingRefresh } from "@/modules/training/composables/training-context"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import TrainingBonusTable, { type TrainingBonusRow } from "@/modules/training/components/TrainingBonusTable.vue"
import { SEKAI_CARD_ATTR_COLORS, resolveSekaiCharacterColor } from "@/shared/sekai/catalog"
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

function formatPercent(value: number): string {
  return formatPowerBonusPercent(value)
}

/** A source that contributes nothing shows as a blank cell, not "0.0%". */
function cell(value: number): string | null {
  return value > 0 ? formatPercent(value) : null
}

// --- Tables -------------------------------------------------------------------
const characterColumns = computed(() => [
  t("training.power.rankBonus"),
  t("training.power.areaItemBonus"),
  t("training.power.fixtureBonus"),
])

/** Characters 1–12 are the first three units; the other half takes the rest. */
const FIRST_TABLE_LAST_CHARACTER_ID = 12

const characterTables = computed<TrainingBonusRow[][]>(() => {
  const rows = characterRows.value.map((row) => ({
    key: row.characterId,
    name: row.name,
    iconUrl: row.iconUrl,
    color: row.color,
    values: [cell(row.rank), cell(row.areaItem), cell(row.fixture)],
    total: formatPercent(row.total),
    characterId: row.characterId,
  }))
  return [
    rows.filter((row) => row.characterId <= FIRST_TABLE_LAST_CHARACTER_ID),
    rows.filter((row) => row.characterId > FIRST_TABLE_LAST_CHARACTER_ID),
  ].filter((table) => table.length > 0)
})

const unitColumns = computed(() => [t("training.power.areaItemBonus"), t("training.power.gateBonus")])

const unitTableRows = computed<TrainingBonusRow[]>(() => unitRows.value.map((row) => ({
  key: row.unit,
  name: row.label,
  iconUrl: row.logoUrl,
  color: row.color,
  values: [cell(row.areaItem), cell(row.gate)],
  total: formatPercent(row.total),
})))

const attrTableRows = computed<TrainingBonusRow[]>(() => attrRows.value.map((row) => ({
  key: row.attr,
  name: row.label,
  iconUrl: row.iconUrl,
  color: row.color,
  values: [],
  total: formatPercent(row.total),
})))

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
      <Skeleton class="h-14 w-full rounded-xl" />
      <div class="grid gap-3 lg:grid-cols-2">
        <Skeleton class="h-96 w-full rounded-xl" />
        <Skeleton class="h-96 w-full rounded-xl" />
      </div>
    </template>

    <template v-else-if="isReady">
      <!-- Two shared bonuses and what they mean: a strip, not a card. -->
      <div
        v-if="bonuses.allCharacterAreaItem > 0 || bonuses.multiUnitAreaItem > 0"
        class="flex flex-wrap items-center gap-x-8 gap-y-2 rounded-xl border bg-muted/20 px-4 py-2.5"
        data-testid="power-shared"
      >
        <dl class="flex flex-wrap gap-x-8 gap-y-2">
          <div v-if="bonuses.allCharacterAreaItem > 0" class="flex flex-col gap-0.5">
            <dt class="text-[11px] text-muted-foreground">{{ t("training.power.allCharacterBonus") }}</dt>
            <dd class="text-base font-semibold leading-tight tabular-nums">{{ formatPercent(bonuses.allCharacterAreaItem) }}</dd>
          </div>
          <div v-if="bonuses.multiUnitAreaItem > 0" class="flex flex-col gap-0.5">
            <dt class="text-[11px] text-muted-foreground">{{ t("training.power.multiUnitBonus") }}</dt>
            <dd class="text-base font-semibold leading-tight tabular-nums">{{ formatPercent(bonuses.multiUnitAreaItem) }}</dd>
          </div>
        </dl>
        <p class="min-w-0 flex-1 basis-64 text-xs text-muted-foreground">{{ t("training.power.sharedAreaHint") }}</p>
      </div>

      <!-- Characters: two tables side by side on a wide page, split at the
           unit boundary (Leo/need – Vivid BAD SQUAD | the rest). -->
      <section class="flex flex-col gap-2" data-testid="power-characters">
        <h2 class="text-sm font-semibold">{{ t("training.power.charactersTitle") }}</h2>
        <div class="grid items-start gap-3 lg:grid-cols-2">
          <TrainingBonusTable
            v-for="(rows, index) in characterTables"
            :key="index"
            :name-label="t('training.power.characterColumn')"
            :total-label="t('training.power.total')"
            :columns="characterColumns"
            :rows="rows"
            icon="round"
          />
        </div>
      </section>

      <div class="grid items-start gap-4 lg:grid-cols-2">
        <section class="flex flex-col gap-2" data-testid="power-units">
          <h2 class="text-sm font-semibold">{{ t("training.power.unitsTitle") }}</h2>
          <TrainingBonusTable
            :name-label="t('training.power.unitColumn')"
            :total-label="t('training.power.total')"
            :columns="unitColumns"
            :rows="unitTableRows"
            icon="logo"
          />
          <p class="text-xs text-muted-foreground">{{ t("training.power.gateHint") }}</p>
        </section>

        <section class="flex flex-col gap-2" data-testid="power-attrs">
          <h2 class="text-sm font-semibold">{{ t("training.power.attrsTitle") }}</h2>
          <TrainingBonusTable
            :name-label="t('training.power.attrColumn')"
            :total-label="t('training.power.total')"
            :columns="[]"
            :rows="attrTableRows"
            icon="logo"
          />
        </section>
      </div>
    </template>
  </div>
</template>
