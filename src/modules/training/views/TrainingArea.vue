<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideChevronDown, LucideChevronUp, LucideRefreshCw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { SEKAI_CARD_ATTRS, SEKAI_UNITS, type SekaiUnit } from "@/shared/sekai/catalog"
import { resolveCardAttrIconUrl, resolveSekaiGameAssetUrl } from "@/shared/sekai/data-sources"
import { useTrainingArea } from "@/modules/training/composables/useTrainingArea"
import {
  areaItemIconAssetPath,
  buildAreaItemViews,
  collectUserAreaItemLevels,
  collectUserMaterials,
  materialIconAssetPath,
  type AreaItemFilter,
  type AreaItemLevelView,
  type AreaItemView,
} from "@/modules/training/lib/area-items"

const { t, locale } = useI18n()

const {
  accountRegion,
  suiteStatus,
  suiteData,
  uploadTime,
  suiteError,
  reloadSuite,
  masterLoading,
  masterError,
  assetEndpoint,
  areaItems,
  areaItemLevels,
  shopItems,
  shopDetails,
  characterMap,
  unitColorMap,
  reloadMaster,
} = useTrainingArea()

const filterUnit = ref("")
const filterAttr = ref("")
const filterCharacterId = ref(0)
const filterTree = ref(false)
const filterFlower = ref(false)
const expandedItems = ref(new Set<number>())

const nowMs = Date.now()

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

const characterOptions = computed(() =>
  [...characterMap.value.values()].sort((a, b) => a.id - b.id),
)

const filter = computed<AreaItemFilter>(() => ({
  unit: filterUnit.value,
  attr: filterAttr.value,
  characterId: filterCharacterId.value,
  tree: filterTree.value,
  flower: filterFlower.value,
}))

const itemViews = computed<AreaItemView[]>(() => {
  if (suiteStatus.value !== "ready") {
    return []
  }

  return buildAreaItemViews({
    areaItems: areaItems.value,
    areaItemLevels: areaItemLevels.value,
    shopItems: shopItems.value,
    shopDetails: shopDetails.value,
    userAreaLevels: collectUserAreaItemLevels(suiteData.value?.userAreas),
    userMaterials: collectUserMaterials(suiteData.value?.userMaterials, suiteData.value?.userGamedata),
    filter: filter.value,
    nowMs,
  })
})

function upgradeRows(view: AreaItemView): AreaItemLevelView[] {
  return view.levels.filter((row) => row.level > view.currentLevel)
}

function nextRow(view: AreaItemView): AreaItemLevelView | null {
  return upgradeRows(view)[0] ?? null
}

function isExpanded(itemId: number): boolean {
  return expandedItems.value.has(itemId)
}

function toggleExpanded(itemId: number) {
  const next = new Set(expandedItems.value)
  if (next.has(itemId)) {
    next.delete(itemId)
  } else {
    next.add(itemId)
  }
  expandedItems.value = next
}

function itemIconUrl(view: AreaItemView): string | null {
  if (!view.assetbundleName || accountRegion.value == null) {
    return null
  }

  return resolveSekaiGameAssetUrl(accountRegion.value, areaItemIconAssetPath(view.assetbundleName), assetEndpoint.value)
}

function materialIconUrl(resourceType: string, materialId: number): string | null {
  if (accountRegion.value == null) {
    return null
  }

  const path = materialIconAssetPath(resourceType, materialId)
  return path == null ? null : resolveSekaiGameAssetUrl(accountRegion.value, path, assetEndpoint.value)
}

function targetLabel(view: AreaItemView): string | null {
  const target = view.target
  if (target == null) {
    return null
  }

  if (target.type === "character") {
    return characterMap.value.get(target.characterId)?.name ?? null
  }
  if (target.type === "unit") {
    return t(`cards.unit.${target.unit}`)
  }
  return t(`cards.attr.${target.attr}`)
}

function targetIconUrl(view: AreaItemView): string | null {
  const target = view.target
  if (target == null) {
    return null
  }

  if (target.type === "character") {
    return characterMap.value.get(target.characterId)?.iconUrl ?? null
  }
  if (target.type === "attr") {
    return resolveCardAttrIconUrl(target.attr)
  }
  return null
}

function targetUnitColor(view: AreaItemView): string | null {
  if (view.target?.type !== "unit") {
    return null
  }

  return unitColorMap.value.get(view.target.unit as SekaiUnit) ?? null
}

function formatQuantity(value: number): string {
  return numberFormatter.value.format(value)
}

function handleCharacterFilterChange(value: unknown) {
  filterCharacterId.value = typeof value === "string" ? Number(value) || 0 : 0
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
        <h2 class="text-xl font-bold">{{ t("training.area.title") }}</h2>
        <p class="text-sm text-muted-foreground">{{ t("training.area.description") }}</p>
      </div>
      <div class="flex flex-col items-start gap-1 sm:items-end">
        <Button variant="ghost" size="sm" class="h-7 gap-1 text-xs text-muted-foreground" @click="refresh">
          <LucideRefreshCw class="size-3.5" />
          {{ t("training.area.refresh") }}
        </Button>
        <p v-if="uploadTimeText" class="text-xs text-muted-foreground">
          {{ t("training.area.dataAsOf", { time: uploadTimeText }) }}
        </p>
      </div>
    </div>

    <!-- No account selected -->
    <Card v-if="suiteStatus === 'idle'">
      <CardContent class="py-12 text-center text-sm text-muted-foreground">
        {{ t("training.area.noAccountHint") }}
      </CardContent>
    </Card>

    <!-- Error -->
    <Card v-else-if="hasError && !isLoading">
      <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
        <p class="text-sm text-muted-foreground">{{ t("training.area.loadError") }}</p>
        <p v-if="errorDetail" class="max-w-full truncate font-mono text-xs text-muted-foreground">
          {{ errorDetail }}
        </p>
        <Button variant="outline" size="sm" @click="retry">
          {{ t("training.area.retry") }}
        </Button>
      </CardContent>
    </Card>

    <!-- Loading skeleton -->
    <template v-else-if="isLoading">
      <Skeleton class="h-10 w-full rounded-lg" />
      <div class="flex flex-col gap-2">
        <Skeleton v-for="index in 6" :key="index" class="h-20 w-full rounded-lg" />
      </div>
    </template>

    <template v-else-if="isReady">
      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-2">
        <NativeSelect v-model="filterUnit" class="text-xs" :aria-label="t('training.area.filters.unit')">
          <NativeSelectOption value="">{{ t("training.area.filters.unit") }}: {{ t("training.area.filters.all") }}</NativeSelectOption>
          <NativeSelectOption v-for="unit in SEKAI_UNITS" :key="unit" :value="unit">
            {{ t(`cards.unit.${unit}`) }}
          </NativeSelectOption>
        </NativeSelect>
        <NativeSelect v-model="filterAttr" class="text-xs" :aria-label="t('training.area.filters.attr')">
          <NativeSelectOption value="">{{ t("training.area.filters.attr") }}: {{ t("training.area.filters.all") }}</NativeSelectOption>
          <NativeSelectOption v-for="attr in SEKAI_CARD_ATTRS" :key="attr" :value="attr">
            {{ t(`cards.attr.${attr}`) }}
          </NativeSelectOption>
        </NativeSelect>
        <NativeSelect
          :model-value="String(filterCharacterId)"
          class="text-xs"
          :aria-label="t('training.area.filters.character')"
          @update:model-value="handleCharacterFilterChange"
        >
          <NativeSelectOption value="0">{{ t("training.area.filters.character") }}: {{ t("training.area.filters.all") }}</NativeSelectOption>
          <NativeSelectOption v-for="character in characterOptions" :key="character.id" :value="String(character.id)">
            {{ character.name }}
          </NativeSelectOption>
        </NativeSelect>
        <Button
          :variant="filterTree ? 'default' : 'outline'"
          size="sm"
          class="h-9 text-xs"
          @click="filterTree = !filterTree"
        >
          {{ t("training.area.filters.tree") }}
        </Button>
        <Button
          :variant="filterFlower ? 'default' : 'outline'"
          size="sm"
          class="h-9 text-xs"
          @click="filterFlower = !filterFlower"
        >
          {{ t("training.area.filters.flower") }}
        </Button>
      </div>

      <Card v-if="itemViews.length === 0">
        <CardContent class="py-10 text-center text-sm text-muted-foreground">
          {{ t("training.area.empty") }}
        </CardContent>
      </Card>

      <div v-else class="flex flex-col gap-2">
        <Card v-for="view in itemViews" :key="view.itemId" class="py-3">
          <CardContent class="flex flex-col gap-2 px-4">
            <!-- Item header -->
            <div class="flex flex-wrap items-center gap-3">
              <img
                v-if="itemIconUrl(view)"
                :src="itemIconUrl(view)!"
                alt=""
                class="size-10 shrink-0 rounded-md object-contain"
                loading="lazy"
              >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium" :title="view.name">{{ view.name }}</p>
                <div class="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span class="font-semibold tabular-nums text-foreground">
                    {{ t("training.area.level", { level: view.currentLevel }) }}
                  </span>
                  <span v-if="targetLabel(view)" class="inline-flex items-center gap-1">
                    <img
                      v-if="targetIconUrl(view)"
                      :src="targetIconUrl(view)!"
                      alt=""
                      class="size-4 rounded-full"
                      loading="lazy"
                    >
                    <span
                      v-else-if="targetUnitColor(view)"
                      class="inline-block size-2.5 rounded-full"
                      :style="{ backgroundColor: targetUnitColor(view)! }"
                    />
                    {{ targetLabel(view) }}
                  </span>
                </div>
              </div>
              <Button
                v-if="upgradeRows(view).length > 1"
                variant="ghost"
                size="sm"
                class="h-7 gap-1 text-xs text-muted-foreground"
                @click="toggleExpanded(view.itemId)"
              >
                <component :is="isExpanded(view.itemId) ? LucideChevronUp : LucideChevronDown" class="size-3.5" />
                {{ isExpanded(view.itemId) ? t("training.area.hideAll") : t("training.area.showAll") }}
              </Button>
            </div>

            <!-- Fully upgraded -->
            <p v-if="!nextRow(view)" class="text-xs text-muted-foreground">
              {{ t("training.area.maxed") }}
            </p>

            <!-- Level rows -->
            <div v-else class="flex flex-col gap-1.5">
              <div
                v-for="row in (isExpanded(view.itemId) ? upgradeRows(view) : [nextRow(view)!])"
                :key="row.level"
                class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-2.5 py-1.5"
              >
                <span class="min-w-12 text-xs font-semibold tabular-nums">
                  {{ t("training.area.level", { level: row.level }) }}
                </span>
                <span v-if="row.bonus > 0" class="text-xs tabular-nums text-muted-foreground">
                  {{ t("training.area.bonus", { bonus: row.bonus }) }}
                </span>
                <span v-if="row.materials.length === 0" class="text-xs text-muted-foreground">
                  {{ t("training.area.notInShop") }}
                </span>
                <template v-else>
                  <span
                    v-for="material in row.materials"
                    :key="material.materialId"
                    class="inline-flex items-center gap-1 text-xs tabular-nums"
                  >
                    <img
                      v-if="materialIconUrl(material.resourceType, material.materialId)"
                      :src="materialIconUrl(material.resourceType, material.materialId)!"
                      alt=""
                      class="size-5 object-contain"
                      loading="lazy"
                    >
                    <span
                      :class="material.isEnough
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'"
                    >
                      {{ formatQuantity(material.haveQuantity) }}/{{ formatQuantity(material.sumQuantity) }}
                    </span>
                  </span>
                  <span
                    v-if="row.canUpgrade"
                    class="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
                  >
                    {{ t("training.area.canUpgrade") }}
                  </span>
                </template>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
