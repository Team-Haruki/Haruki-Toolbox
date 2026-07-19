<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideHeart, LucideRefreshCw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { useTrainingBonds } from "@/modules/training/composables/useTrainingBonds"
import {
  bondLevelProgressPercent,
  buildBondEntries,
  normalizeUserBonds,
} from "@/modules/training/lib/bonds"
import { normalizeUserCharacterRanks } from "@/modules/training/lib/power-bonus"

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
  bondMasters,
  bondLevelTable,
  styleMap,
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

const uploadTimeText = computed(() => {
  if (uploadTime.value == null) {
    return null
  }

  return new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeStyle: "short" })
    .format(uploadTime.value)
})

const numberFormatter = computed(() => new Intl.NumberFormat(locale.value))

const filterOptions = computed(() => {
  const options: { value: string; label: string }[] = []
  for (const [id, character] of characterMap.value) {
    options.push({ value: String(id), label: character.name })
  }
  options.sort((a, b) => Number(a.value) - Number(b.value))
  return options
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
  return {
    ...entry,
    name1: character1?.name ?? t("training.bonds.unknownCharacter"),
    name2: character2?.name ?? t("training.bonds.unknownCharacter"),
    iconUrl1: character1?.iconUrl ?? null,
    iconUrl2: character2?.iconUrl ?? null,
    progressPercent: bondLevelProgressPercent(entry),
    atMaxLevel: entry.bondLevel > 0 && entry.bondLevel >= bondsResult.value.maxLevel,
  }
}))

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
        <CardTitle class="flex flex-wrap items-center justify-between gap-2 text-base">
          <span>{{ t("training.bonds.title") }}</span>
          <span class="flex flex-wrap items-center gap-2">
            <label class="text-xs font-normal text-muted-foreground" for="training-bonds-filter">
              {{ t("training.bonds.filterLabel") }}
            </label>
            <NativeSelect id="training-bonds-filter" v-model="filterValue" class="h-8 text-xs">
              <NativeSelectOption value="">{{ t("training.bonds.filterAll") }}</NativeSelectOption>
              <NativeSelectOption
                v-for="option in filterOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </NativeSelectOption>
            </NativeSelect>
            <Button variant="ghost" size="sm" class="h-7 gap-1 text-xs text-muted-foreground" @click="refresh">
              <LucideRefreshCw class="size-3.5" />
              {{ t("training.bonds.refresh") }}
            </Button>
          </span>
        </CardTitle>
        <p v-if="uploadTimeText" class="text-xs text-muted-foreground">
          {{ t("training.bonds.dataAsOf", { time: uploadTimeText }) }}
        </p>
      </CardHeader>
      <CardContent class="flex flex-col gap-3">
        <p class="text-sm text-muted-foreground">
          {{ t("training.bonds.count", { count: bondRows.length }) }}
        </p>

        <p v-if="bondRows.length === 0" class="py-4 text-center text-sm text-muted-foreground">
          {{ t("training.bonds.empty") }}
        </p>

        <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div
            v-for="row in bondRows"
            :key="`${row.groupId}:${row.charaId1}:${row.charaId2}`"
            :class="[
              'flex flex-col gap-2 rounded-md border p-2.5',
              row.hasBond ? '' : 'opacity-50',
            ]"
          >
            <div class="flex items-center gap-2">
              <div class="flex shrink-0 items-center gap-1.5">
                <span
                  class="rounded-full p-0.5"
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
                <LucideHeart class="size-3.5 shrink-0 text-rose-400" />
                <span
                  class="rounded-full p-0.5"
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
              <div class="min-w-0 flex-1">
                <p class="truncate text-xs" :title="`${row.name1} × ${row.name2}`">
                  {{ row.name1 }} × {{ row.name2 }}
                </p>
                <p class="flex flex-wrap gap-x-3 text-[11px] tabular-nums text-muted-foreground">
                  <span>{{ t("training.bonds.charaRank", { rank: row.charaRank1 }) }}</span>
                  <span>{{ t("training.bonds.charaRank", { rank: row.charaRank2 }) }}</span>
                </p>
              </div>
              <span v-if="row.hasBond" class="shrink-0 text-sm font-semibold tabular-nums">
                {{ t("training.bonds.level", { level: row.bondLevel }) }}
              </span>
              <span v-else class="shrink-0 text-xs text-muted-foreground">
                {{ t("training.bonds.notOwned") }}
              </span>
            </div>

            <template v-if="row.hasBond">
              <div v-if="row.progressPercent != null" class="flex flex-col gap-1">
                <div class="h-1.5 w-full overflow-hidden rounded-full bg-primary/15">
                  <div
                    class="h-full rounded-full bg-primary transition-all"
                    :style="{ width: `${row.progressPercent}%` }"
                  />
                </div>
                <p v-if="row.needExp != null" class="text-[11px] tabular-nums text-muted-foreground">
                  {{ t("training.bonds.needExp", { exp: formatNumber(row.needExp) }) }}
                </p>
              </div>
              <p v-else-if="row.atMaxLevel" class="text-[11px] font-medium text-amber-500">
                {{ t("training.bonds.maxLevel") }}
              </p>
            </template>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
