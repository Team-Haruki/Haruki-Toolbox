<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { LucideArrowUpRight, LucideShirt } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import type { SekaiUnit } from "@/shared/sekai/catalog"
import { resolveCostumeThumbnailUrl } from "@/shared/sekai/data-sources"
import CostumeViewer, { type CostumeViewerRecipe } from "@/modules/costumes/components/CostumeViewer.vue"
import { useCostumeRoleData } from "@/modules/costumes/composables/useCostumeRoleData"
import { useCardCostumes } from "@/modules/cards/composables/useCardCostumes"
import type { CardCostumeColor, CardCostumeGroup } from "@/modules/cards/lib/card-detail"

/**
 * Costume groups unlocked by the card, one thumbnail per color, with an
 * inline 3D preview of the clicked color completed by the character's stock
 * head/hair from the 3D runtime role catalog. Hidden when the card unlocks
 * nothing.
 */
const props = defineProps<{
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
  cardId: number | null
  characterId: number | null
  unit: SekaiUnit | null
}>()

const { t } = useI18n()

const region = computed(() => props.region)
const assetEndpoint = computed(() => props.assetEndpoint)
const cardId = computed(() => props.cardId)
const characterId = computed(() => props.characterId)
const roleUnit = computed<string | null>(() => props.unit)

const { groups, loading } = useCardCostumes(region, cardId)
// Stock head/hair come from the 3D runtime role catalog — masterdata default
// ids are not guaranteed to exist in the runtime.
const { data: roleData } = useCostumeRoleData(region, assetEndpoint, characterId, roleUnit)

// The costume master ships name/colorName blank on Nuverse regions (cn/tw/kr);
// the runtime registry carries them, same source the dressup page uses.
const nameById = computed(() => roleData.value?.nameById ?? new Map<number, { name: string; colorName: string }>())

function groupName(group: CardCostumeGroup): string {
  if (group.name) {
    return group.name
  }
  for (const color of group.colors) {
    const name = nameById.value.get(color.costume3dId)?.name
    if (name) {
      return name
    }
  }
  // Absent from both the master and the runtime registry: a slot label reads
  // better than a raw group id.
  const slot = group.colors[0]?.slot
  return slot ? t(`cards.detail.costumeSlot.${slot}`) : `#${group.costume3dGroupId}`
}

function colorLabel(color: CardCostumeColor): string {
  return color.colorName || nameById.value.get(color.costume3dId)?.colorName || ""
}

// Regional mirrors miss some costume thumbnails; the jp mirror is the fallback.
function thumbnailSources(color: CardCostumeColor): (string | null)[] {
  return [
    resolveCostumeThumbnailUrl(props.region, color.assetbundleName, props.assetEndpoint),
    props.region === "jp" ? null : resolveCostumeThumbnailUrl("jp", color.assetbundleName, props.assetEndpoint),
  ]
}

const selectedCostume3dId = ref<number | null>(null)

watch([cardId, region], () => {
  selectedCostume3dId.value = null
})

const selectedColor = computed(() => {
  if (selectedCostume3dId.value == null) {
    return null
  }
  for (const group of groups.value) {
    const color = group.colors.find((candidate) => candidate.costume3dId === selectedCostume3dId.value)
    if (color) {
      return color
    }
  }
  return null
})

// Preview every same-color part of the group together; the character's stock
// parts fill any slot this color does not provide.
const viewerRecipe = computed<CostumeViewerRecipe | null>(() => {
  const selected = selectedColor.value
  const defaults = roleData.value?.defaults
  if (selected == null || props.characterId == null || props.unit == null || defaults == null) {
    return null
  }
  return {
    characterId: props.characterId,
    unit: props.unit,
    bodyCostume3dId: selected.bodyCostume3dId ?? defaults.bodyCostume3dId,
    headCostume3dId: selected.headCostume3dId ?? defaults.headCostume3dId,
    hairCostume3dId: selected.hairCostume3dId ?? defaults.hairCostume3dId,
  }
})

const dressupRoute = computed(() => {
  if (props.characterId == null) {
    return null
  }
  const query: Record<string, string> = { characterId: String(props.characterId) }
  const selected = selectedColor.value
  if (selected?.bodyCostume3dId != null) {
    query.body = String(selected.bodyCostume3dId)
  }
  if (selected?.headCostume3dId != null) {
    query.head = String(selected.headCostume3dId)
  }
  if (selected?.hairCostume3dId != null) {
    query.hair = String(selected.hairCostume3dId)
  }
  return { name: "costumes.dressup", query }
})

function togglePreview(costume3dId: number) {
  selectedCostume3dId.value = selectedCostume3dId.value === costume3dId ? null : costume3dId
}
</script>

<template>
  <CatalogDetailSection
    v-if="loading || groups.length > 0"
    :title="t('cards.detail.costumes')"
    :icon="LucideShirt"
    :description="t('cards.detail.costumePreviewHint')"
    :loading="loading && groups.length === 0"
    content-class="flex flex-col gap-4"
  >
    <template #action>
      <Button v-if="dressupRoute" as-child variant="ghost" size="sm" class="h-7 gap-1 text-xs font-normal text-muted-foreground">
        <RouterLink :to="dressupRoute">
          {{ t("cards.detail.costumeDressup") }}
          <LucideArrowUpRight class="size-3.5" />
        </RouterLink>
      </Button>
    </template>

    <template #skeleton>
      <div class="flex gap-3">
        <Skeleton v-for="index in 4" :key="index" class="size-20 rounded-md" />
      </div>
    </template>

    <div v-for="group in groups" :key="group.costume3dGroupId" class="flex flex-col gap-2">
      <p class="text-sm font-medium">{{ groupName(group) }}</p>
      <div class="flex flex-wrap gap-3">
        <figure v-for="color in group.colors" :key="color.costume3dId" class="flex w-20 flex-col gap-1">
          <button
            type="button"
            :class="[
              'relative block aspect-square w-full overflow-hidden rounded-md border bg-muted/20 transition-shadow',
              selectedCostume3dId === color.costume3dId ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-border',
            ]"
            :aria-pressed="selectedCostume3dId === color.costume3dId"
            :title="t('cards.detail.costumePreviewHint')"
            @click="togglePreview(color.costume3dId)"
          >
            <SekaiAssetImage
              :sources="thumbnailSources(color)"
              :alt="colorLabel(color) || groupName(group)"
              fit="contain"
              placeholder-class="bg-transparent"
            />
          </button>
          <figcaption
            v-if="colorLabel(color)"
            class="truncate text-center text-[11px] text-muted-foreground"
            :title="colorLabel(color)"
          >
            {{ colorLabel(color) }}
          </figcaption>
        </figure>
      </div>
    </div>

    <div v-if="viewerRecipe" class="mx-auto w-full max-w-xl">
      <CostumeViewer :region="region" :preference="assetEndpoint" :recipe="viewerRecipe" :wheel-zoom="false" />
    </div>
  </CatalogDetailSection>
</template>
