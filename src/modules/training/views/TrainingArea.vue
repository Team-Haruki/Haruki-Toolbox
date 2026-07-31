<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideList, LucideRefreshCw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import SimpleSelect from "@/shared/components/SimpleSelect.vue"
import { SEKAI_CARD_ATTRS, SEKAI_CARD_ATTR_COLORS, SEKAI_UNITS, resolveSekaiCharacterColor, type SekaiUnit } from "@/shared/sekai/catalog"
import { resolveCardAttrRoundIconUrl, resolveSekaiGameAssetUrl, resolveUnitLogoUrl } from "@/shared/sekai/data-sources"
import { useTrainingArea } from "@/modules/training/composables/useTrainingArea"
import {
  areaItemIconAssetPath,
  buildAreaItemViews,
  collectUserAreaItemLevels,
  collectUserMaterials,
  formatAreaBonusRate,
  formatCompactQuantity,
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
const dialogItemId = ref<number | null>(null)

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


const characterOptions = computed(() =>
  [...characterMap.value.values()].sort((a, b) => a.id - b.id),
)

const unitFilterOptions = computed(() => [
  { value: "", label: `${t("training.area.filters.unit")}: ${t("training.area.filters.all")}` },
  ...SEKAI_UNITS.map((unit) => ({ value: unit, label: t(`cards.unit.${unit}`) })),
])

const attrFilterOptions = computed(() => [
  { value: "", label: `${t("training.area.filters.attr")}: ${t("training.area.filters.all")}` },
  ...SEKAI_CARD_ATTRS.map((attr) => ({ value: attr, label: t(`cards.attr.${attr}`) })),
])

const characterFilterOptions = computed(() => [
  { value: "0", label: `${t("training.area.filters.character")}: ${t("training.area.filters.all")}` },
  ...characterOptions.value.map((character) => ({
    value: String(character.id),
    label: character.name,
    iconUrl: character.iconUrl,
  })),
])

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

const dialogView = computed(() =>
  dialogItemId.value == null
    ? null
    : itemViews.value.find((view) => view.itemId === dialogItemId.value) ?? null,
)

function handleDialogOpenChange(open: boolean) {
  if (!open) {
    dialogItemId.value = null
  }
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
    return resolveCardAttrRoundIconUrl(target.attr)
  }
  return null
}

function targetUnitColor(view: AreaItemView): string | null {
  if (view.target?.type !== "unit") {
    return null
  }

  return unitColorMap.value.get(view.target.unit as SekaiUnit) ?? null
}

const failedUnitLogos = ref<Set<string>>(new Set())

function markUnitLogoFailed(unit: string) {
  failedUnitLogos.value = new Set(failedUnitLogos.value).add(unit)
}

function targetUnitLogoUrl(view: AreaItemView): string | null {
  if (view.target?.type !== "unit" || failedUnitLogos.value.has(view.target.unit)) {
    return null
  }

  return resolveUnitLogoUrl(view.target.unit)
}

/** Representative color of the boosted target (character/unit/attribute). */
function targetColor(view: AreaItemView): string | null {
  const target = view.target
  if (target == null) {
    return null
  }

  if (target.type === "character") {
    return resolveSekaiCharacterColor(target.characterId)
  }
  if (target.type === "attr") {
    return SEKAI_CARD_ATTR_COLORS[target.attr] ?? null
  }
  return unitColorMap.value.get(target.unit as SekaiUnit) ?? null
}

function maxLevel(view: AreaItemView): number {
  return view.levels[view.levels.length - 1]?.level ?? view.currentLevel
}

function levelPercent(view: AreaItemView): number {
  const max = maxLevel(view)
  return max > 0 ? Math.min((view.currentLevel / max) * 100, 100) : 0
}

function formatQuantity(value: number): string {
  return formatCompactQuantity(value, locale.value)
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
        <SimpleSelect
          v-model="filterUnit"
          :options="unitFilterOptions"
          trigger-class="text-xs"
          :aria-label="t('training.area.filters.unit')"
        />
        <SimpleSelect
          v-model="filterAttr"
          :options="attrFilterOptions"
          trigger-class="text-xs"
          :aria-label="t('training.area.filters.attr')"
        />
        <SimpleSelect
          :model-value="String(filterCharacterId)"
          :options="characterFilterOptions"
          trigger-class="text-xs"
          :aria-label="t('training.area.filters.character')"
          @update:model-value="handleCharacterFilterChange"
        />
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

      <div v-else class="grid grid-cols-1 gap-2 lg:grid-cols-2 2xl:grid-cols-3">
        <Card
          v-for="view in itemViews"
          :key="view.itemId"
          class="flex flex-col border-l-4 py-3"
          :style="targetColor(view) ? { borderLeftColor: targetColor(view)! } : {}"
        >
          <CardContent class="flex flex-1 flex-col gap-2 px-4">
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
                  <span v-if="targetLabel(view)" class="inline-flex items-center gap-1">
                    <img
                      v-if="targetIconUrl(view)"
                      :src="targetIconUrl(view)!"
                      alt=""
                      class="size-4 rounded-full"
                      loading="lazy"
                    >
                    <img
                      v-else-if="targetUnitLogoUrl(view)"
                      :src="targetUnitLogoUrl(view)!"
                      alt=""
                      class="h-4 w-auto max-w-9 object-contain"
                      loading="lazy"
                      @error="view.target?.type === 'unit' && markUnitLogoFailed(view.target.unit)"
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
              <span class="shrink-0 text-sm font-semibold tabular-nums">
                {{ t("training.area.bonus", { bonus: formatAreaBonusRate(view.currentBonus) }) }}
              </span>
              <Button
                v-if="upgradeRows(view).length > 1"
                variant="ghost"
                size="sm"
                class="h-7 gap-1 text-xs text-muted-foreground"
                @click="dialogItemId = view.itemId"
              >
                <LucideList class="size-3.5" />
                {{ t("training.area.showAll") }}
              </Button>
            </div>

            <!-- Level progress -->
            <div class="flex items-center gap-2">
              <span class="shrink-0 text-[11px] font-semibold tabular-nums">
                {{ t("training.area.level", { level: view.currentLevel }) }}/{{ maxLevel(view) }}
              </span>
              <div
                class="h-1.5 flex-1 overflow-hidden rounded-full bg-primary/15"
                :style="targetColor(view) ? { backgroundColor: `color-mix(in srgb, ${targetColor(view)} 15%, transparent)` } : undefined"
              >
                <div
                  class="h-full rounded-full bg-primary transition-all"
                  :style="{ width: `${levelPercent(view)}%`, ...(targetColor(view) ? { backgroundColor: targetColor(view)! } : {}) }"
                />
              </div>
            </div>

            <!-- Fully upgraded: same box shape as the next-level row below. -->
            <div
              v-if="!nextRow(view)"
              class="flex min-h-14 flex-1 items-center justify-center rounded-md border border-dashed px-2.5 py-1.5"
            >
              <p class="text-xs text-muted-foreground">{{ t("training.area.maxed") }}</p>
            </div>

            <!-- Next level -->
            <div
              v-for="row in nextRow(view) ? [nextRow(view)!] : []"
              :key="row.level"
              class="flex-1 rounded-md border px-2.5 py-1.5"
            >
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span class="text-xs text-muted-foreground">
                  {{ t("training.area.nextLevel") }}
                  <span class="font-semibold tabular-nums text-foreground">
                    {{ t("training.area.level", { level: row.level }) }}
                  </span>
                </span>
                <span v-if="row.bonus > 0" class="text-xs text-muted-foreground">
                  {{ t("training.area.nextBonus") }}
                  <span class="font-semibold tabular-nums text-foreground">
                    {{ t("training.area.bonus", { bonus: formatAreaBonusRate(row.bonus) }) }}
                  </span>
                </span>
                <span
                  v-if="row.canUpgrade"
                  class="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
                >
                  {{ t("training.area.canUpgrade") }}
                </span>
              </div>
              <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span v-if="row.materials.length === 0" class="text-xs text-muted-foreground">
                  {{ t("training.area.notInShop") }}
                </span>
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
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- All upgrade levels dialog -->
      <Dialog :open="dialogView != null" @update:open="handleDialogOpenChange">
        <DialogContent class="max-h-[85vh] gap-3 overflow-y-auto sm:max-w-xl">
          <DialogHeader v-if="dialogView">
            <DialogTitle class="flex items-center gap-2 text-base">
              <img
                v-if="itemIconUrl(dialogView)"
                :src="itemIconUrl(dialogView)!"
                alt=""
                class="size-8 shrink-0 rounded-md object-contain"
                loading="lazy"
              >
              <span class="truncate">{{ dialogView.name }}</span>
              <span class="ml-auto shrink-0 text-sm font-semibold tabular-nums">
                {{ t("training.area.level", { level: dialogView.currentLevel }) }}/{{ maxLevel(dialogView) }}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div v-if="dialogView" class="flex flex-col gap-1.5">
            <div
              v-for="row in upgradeRows(dialogView)"
              :key="row.level"
              class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-2.5 py-1.5"
            >
              <span class="w-11 shrink-0 text-xs font-semibold tabular-nums">
                {{ t("training.area.level", { level: row.level }) }}
              </span>
              <span class="w-12 shrink-0 text-xs tabular-nums text-muted-foreground">
                {{ row.bonus > 0 ? t("training.area.bonus", { bonus: formatAreaBonusRate(row.bonus) }) : "" }}
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
        </DialogContent>
      </Dialog>
    </template>
  </div>
</template>
