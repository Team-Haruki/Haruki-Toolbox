<script setup lang="ts">
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import MissingGameDataNotice from "@/shared/components/MissingGameDataNotice.vue"
import { useUserDataPageState } from "@/shared/sekai/user-snapshot/use-user-data-page-state"

import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideCheck, LucideChevronRight, LucideHeart } from "lucide-vue-next"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import CatalogCharacterPicker from "@/shared/components/catalog/CatalogCharacterPicker.vue"
import { useTrainingRefresh } from "@/modules/training/composables/training-context"
import { useTrainingBonds } from "@/modules/training/composables/useTrainingBonds"
import {
  bondLevelProgressPercent,
  buildBondEntries,
  normalizeUserBonds,
  type BondRewardItem,
} from "@/modules/training/lib/bonds"
import { normalizeUserCharacterRanks } from "@/modules/training/lib/power-bonus"
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
  characterMap,
  bondMasters,
  bondLevelTable,
  styleMap,
  bondsRewardsByGroup,
  materialNames,
  reloadMaster,
} = useTrainingBonds()

/** Selected base characters; a pair shows when either side is selected. */
const filterCharacterIds = ref<number[]>([])

const { isLoading, hasError, isReady, suiteDataMissing, errorMessage, errorDetail } = useUserDataPageState({
  status: suiteStatus,
  error: suiteError,
  masterLoading: masterLoading,
  masterError: masterError,
  account: selectedAccount,
  fallback: () => t("training.bonds.loadError"),
})


const numberFormatter = computed(() => new Intl.NumberFormat(locale.value))

const characterOptions = computed(() => [...characterMap.value.values()].sort((a, b) => a.id - b.id))

const bondsResult = computed(() => buildBondEntries({
  userBonds: normalizeUserBonds(suiteData.value?.userBonds),
  bondMasters: bondMasters.value,
  levelTable: bondLevelTable.value,
  styleMap: styleMap.value,
  userCharacters: normalizeUserCharacterRanks(suiteData.value?.userCharacters),
  filterCharacterId: null,
}))

const filteredEntries = computed(() => {
  const ids = filterCharacterIds.value
  if (ids.length === 0) {
    return bondsResult.value.entries
  }

  return bondsResult.value.entries.filter((entry) => ids.includes(entry.baseCharaId1) || ids.includes(entry.baseCharaId2))
})

const bondRows = computed(() => filteredEntries.value.map((entry) => {
  const character1 = characterMap.value.get(entry.baseCharaId1) ?? null
  const character2 = characterMap.value.get(entry.baseCharaId2) ?? null
  const color1 = resolveSekaiCharacterColor(entry.baseCharaId1)
  const color2 = resolveSekaiCharacterColor(entry.baseCharaId2)
  return {
    ...entry,
    key: `${entry.groupId}:${entry.charaId1}:${entry.charaId2}`,
    name1: character1?.name ?? t("training.bonds.unknownCharacter"),
    name2: character2?.name ?? t("training.bonds.unknownCharacter"),
    iconUrl1: character1?.iconUrl ?? null,
    iconUrl2: character2?.iconUrl ?? null,
    barTrackStyle: color1 && color2
      ? { background: `linear-gradient(to right, color-mix(in srgb, ${color1} 15%, transparent), color-mix(in srgb, ${color2} 15%, transparent))` }
      : undefined,
    barFillStyle: color1 && color2
      ? { background: `linear-gradient(to right, ${color1}, ${color2})` }
      : undefined,
    progressPercent: bondLevelProgressPercent(entry),
    atMaxLevel: entry.bondLevel > 0 && entry.bondLevel >= bondsResult.value.maxLevel,
    rewardRanks: bondsRewardsByGroup.value.get(entry.groupId) ?? [],
  }
}))

const dialogRowKey = ref<string | null>(null)

const dialogRow = computed(() =>
  dialogRowKey.value == null
    ? null
    : bondRows.value.find((row) => row.key === dialogRowKey.value) ?? null,
)

function handleDialogOpenChange(open: boolean) {
  if (!open) {
    dialogRowKey.value = null
  }
}

function rewardLabel(item: BondRewardItem): string {
  if (item.type === "jewel") {
    return t("training.bonds.rewards.jewel", { count: item.quantity })
  }
  if (item.type === "material") {
    const name = item.resourceId != null ? materialNames.value.get(item.resourceId) ?? null : null
    return name != null
      ? t("training.bonds.rewards.material", { name, count: item.quantity })
      : t("training.bonds.rewards.materialFallback", { count: item.quantity })
  }
  if (item.type === "bonds_honor") {
    return t("training.bonds.rewards.bondsHonor", { level: item.level ?? 1 })
  }
  if (item.type === "bonds_honor_word") {
    return t("training.bonds.rewards.bondsHonorWord")
  }
  if (item.type === "stamp") {
    return t("training.bonds.rewards.stamp")
  }
  if (item.type === "boost_item") {
    return t("training.bonds.rewards.boostItem", { count: item.quantity })
  }
  if (item.type === "cut_in_voice") {
    return t("training.bonds.rewards.cutInVoice")
  }
  return t("training.bonds.rewards.other")
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
  <div class="flex flex-col gap-4">
    <!-- No account selected -->
    <Card v-if="suiteStatus === 'idle'">
      <CardContent class="py-12 text-center text-sm text-muted-foreground">
        {{ t("training.bonds.noAccountHint") }}
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
          :retry-label="t('training.bonds.retry')"
          :retrying="isLoading"
          @retry="retry"
        />
      </CardContent>
    </Card>

    <!-- Loading skeleton -->
    <template v-else-if="isLoading">
      <Skeleton class="h-10 w-full rounded-lg" />
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton v-for="index in 12" :key="index" class="h-14 w-full rounded-lg" />
      </div>
    </template>

    <template v-else-if="isReady">
      <CatalogCharacterPicker
        v-if="characterOptions.length > 0"
        v-model="filterCharacterIds"
        :characters="characterOptions"
        :label="t('training.bonds.filterLabel')"
        size="sm"
      >
        <span class="ml-auto text-xs tabular-nums text-muted-foreground">
          {{ t("training.bonds.count", { count: bondRows.length }) }}
        </span>
      </CatalogCharacterPicker>

      <p v-if="bondRows.length === 0" class="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
        {{ t("training.bonds.empty") }}
      </p>

      <!-- Two lines per pair (names and level, ranks and what the next level
           needs) with the progress drawn along the bottom edge: a few
           hundred pairs stay scannable. -->
      <div v-else class="@container">
        <div class="grid grid-cols-1 gap-2 @min-[44rem]:grid-cols-2 @min-[70rem]:grid-cols-3" data-testid="bonds-grid">
          <div
            v-for="row in bondRows"
            :key="row.key"
            :class="['relative flex items-center gap-2.5 overflow-hidden rounded-lg border bg-card py-2 pr-1.5 pl-2.5', row.hasBond ? 'pb-2.5' : 'opacity-50']"
            data-slot="bond-tile"
          >
            <span class="flex shrink-0 -space-x-2">
              <span class="rounded-full p-0.5 ring-2 ring-card" :style="row.colorCode1 ? { backgroundColor: row.colorCode1 } : {}">
                <img v-if="row.iconUrl1" :src="row.iconUrl1" alt="" class="size-8 rounded-full" loading="lazy" decoding="async">
              </span>
              <span class="rounded-full p-0.5 ring-2 ring-card" :style="row.colorCode2 ? { backgroundColor: row.colorCode2 } : {}">
                <img v-if="row.iconUrl2" :src="row.iconUrl2" alt="" class="size-8 rounded-full" loading="lazy" decoding="async">
              </span>
            </span>

            <div class="min-w-0 flex-1">
              <div class="flex items-baseline justify-between gap-2">
                <p class="min-w-0 truncate text-xs font-medium" :title="`${row.name1} × ${row.name2}`">
                  {{ row.name1 }} <span class="text-muted-foreground">×</span> {{ row.name2 }}
                </p>
                <p v-if="row.hasBond" class="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
                  <LucideHeart class="size-3.5 shrink-0 self-center text-rose-400" />
                  {{ t("training.bonds.level", { level: row.bondLevel }) }}
                </p>
                <p v-else class="shrink-0 text-xs text-muted-foreground">{{ t("training.bonds.notOwned") }}</p>
              </div>
              <div class="mt-0.5 flex items-baseline justify-between gap-2 text-[11px] tabular-nums text-muted-foreground">
                <span class="shrink-0">{{ t("training.bonds.charaRank", { rank: row.charaRank1 }) }} · {{ row.charaRank2 }}</span>
                <span v-if="row.hasBond && row.needExp != null && row.progressPercent != null" class="min-w-0 truncate">
                  {{ t("training.bonds.needExp", { exp: formatNumber(row.needExp) }) }}
                </span>
                <span v-else-if="row.hasBond && row.atMaxLevel" class="shrink-0 font-medium text-amber-500">
                  {{ t("training.bonds.maxLevel") }}
                </span>
              </div>
            </div>

            <button
              v-if="row.rewardRanks.length > 0"
              type="button"
              class="inline-flex shrink-0 items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground pointer-coarse:min-h-10 pointer-coarse:min-w-10"
              :aria-label="t('training.bonds.showRewards')"
              :title="t('training.bonds.showRewards')"
              @click="dialogRowKey = row.key"
            >
              <LucideChevronRight class="size-4" />
            </button>

            <span
              v-if="row.hasBond && row.progressPercent != null"
              class="absolute inset-x-0 bottom-0 h-1 bg-primary/15"
              :style="row.barTrackStyle"
              aria-hidden="true"
            >
              <span class="block h-full bg-primary transition-all" :style="[{ width: `${row.progressPercent}%` }, row.barFillStyle ?? {}]" />
            </span>
          </div>
        </div>
      </div>

      <!-- Per-level rewards dialog -->
      <Dialog :open="dialogRow != null" @update:open="handleDialogOpenChange">
        <DialogContent class="max-h-[85vh] gap-3 overflow-y-auto sm:max-w-xl" :description="t('training.bonds.rewardsTitle')">
          <!-- `pr-8` keeps the level out from under the close button. -->
          <DialogHeader v-if="dialogRow">
            <DialogTitle class="flex items-center gap-2 pr-8 text-base">
              <img
                v-if="dialogRow.iconUrl1"
                :src="dialogRow.iconUrl1"
                alt=""
                class="size-8 shrink-0 rounded-full"
                loading="lazy"
              >
              <img
                v-if="dialogRow.iconUrl2"
                :src="dialogRow.iconUrl2"
                alt=""
                class="size-8 shrink-0 rounded-full"
                loading="lazy"
              >
              <span class="truncate">{{ dialogRow.name1 }} × {{ dialogRow.name2 }}</span>
              <span v-if="dialogRow.hasBond" class="ml-auto inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
                <LucideHeart class="size-3.5 text-rose-400" />
                {{ t("training.bonds.level", { level: dialogRow.bondLevel }) }}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div v-if="dialogRow" class="flex flex-col gap-1">
            <p class="text-[11px] font-medium text-muted-foreground">
              {{ t("training.bonds.rewardsTitle") }}
            </p>
            <div
              v-for="rankRow in dialogRow.rewardRanks"
              :key="rankRow.rank"
              :class="[
                'flex flex-wrap items-center gap-x-2 gap-y-1 text-xs',
                rankRow.rank <= dialogRow.bondLevel ? 'opacity-50' : '',
              ]"
            >
              <span class="w-11 shrink-0 font-semibold tabular-nums">
                Lv.{{ rankRow.rank }}
              </span>
              <LucideCheck
                v-if="rankRow.rank <= dialogRow.bondLevel"
                class="size-3.5 shrink-0 text-emerald-500"
              />
              <span
                v-for="(item, index) in rankRow.items"
                :key="index"
                class="rounded-full border bg-muted/30 px-2 py-0.5"
              >
                {{ rewardLabel(item) }}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </template>
  </div>
</template>
