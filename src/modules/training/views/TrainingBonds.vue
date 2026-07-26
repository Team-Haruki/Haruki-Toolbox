<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideCheck, LucideChevronRight, LucideHeart, LucideRefreshCw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import SimpleSelect from "@/shared/components/SimpleSelect.vue"
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

/** "" means no filter; otherwise a base character id as string. */
const filterValue = ref("")

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

const filterOptions = computed(() => {
  const options: { value: string; label: string; iconUrl?: string | null }[] = [
    { value: "", label: t("training.bonds.filterAll") },
  ]
  const characterEntries: { value: string; label: string; iconUrl?: string | null }[] = []
  for (const [id, character] of characterMap.value) {
    characterEntries.push({ value: String(id), label: character.name, iconUrl: character.iconUrl })
  }
  characterEntries.sort((a, b) => Number(a.value) - Number(b.value))
  return [...options, ...characterEntries]
})

const filterCharacterId = computed(() => {
  const parsed = Number(filterValue.value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
})

const bondsResult = computed(() => buildBondEntries({
  userBonds: normalizeUserBonds(suiteData.value?.userBonds),
  bondMasters: bondMasters.value,
  levelTable: bondLevelTable.value,
  styleMap: styleMap.value,
  userCharacters: normalizeUserCharacterRanks(suiteData.value?.userCharacters),
  filterCharacterId: filterCharacterId.value,
}))

const bondRows = computed(() => bondsResult.value.entries.map((entry) => {
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
    <!-- Header -->
    <div>
      <h2 class="text-xl font-bold">{{ t("training.bonds.title") }}</h2>
      <p class="text-sm text-muted-foreground">{{ t("training.bonds.description") }}</p>
    </div>

    <!-- No account selected -->
    <Card v-if="suiteStatus === 'idle'">
      <CardContent class="py-12 text-center text-sm text-muted-foreground">
        {{ t("training.bonds.noAccountHint") }}
      </CardContent>
    </Card>

    <!-- Error -->
    <Card v-else-if="hasError && !isLoading">
      <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
        <p class="text-sm text-muted-foreground">{{ t("training.bonds.loadError") }}</p>
        <p v-if="errorDetail" class="max-w-full truncate font-mono text-xs text-muted-foreground">
          {{ errorDetail }}
        </p>
        <Button variant="outline" size="sm" @click="retry">
          {{ t("training.bonds.retry") }}
        </Button>
      </CardContent>
    </Card>

    <!-- Loading skeleton -->
    <template v-else-if="isLoading">
      <Skeleton class="h-12 w-full rounded-lg" />
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Skeleton v-for="index in 8" :key="index" class="h-24 w-full rounded-lg" />
      </div>
    </template>

    <Card v-else-if="isReady">
      <CardHeader class="pb-2">
        <CardTitle class="flex flex-wrap items-center justify-end gap-2 text-base">
          <span class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-normal text-muted-foreground">
              {{ t("training.bonds.filterLabel") }}
            </span>
            <SimpleSelect
              v-model="filterValue"
              :options="filterOptions"
              size="sm"
              trigger-class="text-xs"
              :aria-label="t('training.bonds.filterLabel')"
            />
            <Button variant="ghost" size="sm" class="h-7 gap-1 text-xs text-muted-foreground" @click="refresh">
              <LucideRefreshCw class="size-3.5" />
              {{ t("training.bonds.refresh") }}
            </Button>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-3">
        <p class="text-sm text-muted-foreground">
          {{ t("training.bonds.count", { count: bondRows.length }) }}
        </p>

        <p v-if="bondRows.length === 0" class="py-4 text-center text-sm text-muted-foreground">
          {{ t("training.bonds.empty") }}
        </p>

        <div v-else class="grid grid-cols-1 items-start gap-2 xl:grid-cols-2">
          <div
            v-for="row in bondRows"
            :key="row.key"
            :class="['rounded-md border', row.hasBond ? '' : 'opacity-50']"
          >
            <div class="flex items-center gap-3 p-2.5">
              <!-- Left character with their rank -->
              <div class="flex w-32 shrink-0 items-center gap-2 sm:w-44">
                <span
                  class="shrink-0 rounded-full p-0.5"
                  :style="row.colorCode1 ? { backgroundColor: row.colorCode1 } : {}"
                >
                  <img
                    v-if="row.iconUrl1"
                    :src="row.iconUrl1"
                    alt=""
                    class="size-9 rounded-full"
                    loading="lazy"
                  >
                </span>
                <div class="min-w-0">
                  <p class="truncate text-xs" :title="row.name1">{{ row.name1 }}</p>
                  <p class="text-[11px] tabular-nums text-muted-foreground">
                    {{ t("training.bonds.charaRank", { rank: row.charaRank1 }) }}
                  </p>
                </div>
              </div>

              <!-- Bond level + progress in the middle -->
              <div class="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div class="flex items-center gap-1.5">
                  <LucideHeart class="size-3.5 shrink-0 text-rose-400" />
                  <span v-if="row.hasBond" class="text-sm font-semibold tabular-nums">
                    {{ t("training.bonds.level", { level: row.bondLevel }) }}
                  </span>
                  <span v-else class="text-xs text-muted-foreground">
                    {{ t("training.bonds.notOwned") }}
                  </span>
                </div>
                <template v-if="row.hasBond">
                  <div v-if="row.progressPercent != null" class="w-full max-w-56">
                    <div class="h-1.5 w-full overflow-hidden rounded-full bg-primary/15" :style="row.barTrackStyle">
                      <div
                        class="h-full rounded-full bg-primary transition-all"
                        :style="[{ width: `${row.progressPercent}%` }, row.barFillStyle ?? {}]"
                      />
                    </div>
                    <p v-if="row.needExp != null" class="mt-0.5 text-center text-[11px] tabular-nums text-muted-foreground">
                      {{ t("training.bonds.needExp", { exp: formatNumber(row.needExp) }) }}
                    </p>
                  </div>
                  <p v-else-if="row.atMaxLevel" class="text-[11px] font-medium text-amber-500">
                    {{ t("training.bonds.maxLevel") }}
                  </p>
                </template>
              </div>

              <!-- Right character mirrored with their rank -->
              <div class="flex w-32 shrink-0 items-center justify-end gap-2 sm:w-44">
                <div class="min-w-0 text-right">
                  <p class="truncate text-xs" :title="row.name2">{{ row.name2 }}</p>
                  <p class="text-[11px] tabular-nums text-muted-foreground">
                    {{ t("training.bonds.charaRank", { rank: row.charaRank2 }) }}
                  </p>
                </div>
                <span
                  class="shrink-0 rounded-full p-0.5"
                  :style="row.colorCode2 ? { backgroundColor: row.colorCode2 } : {}"
                >
                  <img
                    v-if="row.iconUrl2"
                    :src="row.iconUrl2"
                    alt=""
                    class="size-9 rounded-full"
                    loading="lazy"
                  >
                </span>
              </div>

              <button
                v-if="row.rewardRanks.length > 0"
                type="button"
                class="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                :aria-label="t('training.bonds.showRewards')"
                :title="t('training.bonds.showRewards')"
                @click="dialogRowKey = row.key"
              >
                <LucideChevronRight class="size-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Per-level rewards dialog -->
        <Dialog :open="dialogRow != null" @update:open="handleDialogOpenChange">
          <DialogContent class="max-h-[85vh] gap-3 overflow-y-auto sm:max-w-xl">
            <DialogHeader v-if="dialogRow">
              <DialogTitle class="flex items-center gap-2 text-base">
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
      </CardContent>
    </Card>
  </div>
</template>
