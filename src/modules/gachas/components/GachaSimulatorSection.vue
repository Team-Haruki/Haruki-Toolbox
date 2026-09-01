<script setup lang="ts">
import { computed, toRef } from "vue"
import { useI18n } from "vue-i18n"
import { LucideDices, LucideRotateCcw } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { Button } from "@/components/ui/button"
import type { CatalogCharacter, CatalogMasterCard } from "@/shared/sekai/catalog"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { isUnreleasedContent } from "@/shared/sekai/unreleased"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import CatalogEntityGrid from "@/shared/components/catalog/CatalogEntityGrid.vue"
import GachaCardTile from "@/modules/gachas/components/GachaCardTile.vue"
import { useGachaSimulator } from "@/modules/gachas/composables/useGachaSimulator"
import {
  resolveGachaBehaviorTypeLabel,
  resolveGachaCostResourceLabel,
  resolveGachaRarityLabel,
} from "@/modules/gachas/lib/gacha-labels"
import { resolveGachaRarityToneClass } from "@/modules/gachas/lib/gacha-rates"
import type { GachaSimulatorModel, GachaSimulatorPull } from "@/modules/gachas/lib/gacha-simulator"

/**
 * Fan-made pull simulator over the record's own lottery rows. The results
 * grid only exists after the first pull; everything is local and resets
 * with the gacha.
 */
const props = defineProps<{
  model: GachaSimulatorModel | null
  cardsById: ReadonlyMap<number, CatalogMasterCard>
  characterMap: ReadonlyMap<number, CatalogCharacter>
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
  blurUnreleased: boolean
  nowMs: number
  loading: boolean
}>()

const { t, te } = useI18n()
const ctx = { t, te }

const simulator = useGachaSimulator(toRef(props, "model"))

function costLabel(pull: GachaSimulatorPull | null): string {
  if (!pull || !pull.costResourceType || pull.costResourceQuantity == null) {
    return t("gachaCatalog.simulator.free")
  }
  return `${pull.costResourceQuantity} ${resolveGachaCostResourceLabel(ctx, pull.costResourceType)}`
}

const spentEntries = computed(() => [...simulator.spent.value.entries()]
  .map(([resourceType, quantity]) => ({
    resourceType,
    label: `${quantity} ${resolveGachaCostResourceLabel(ctx, resourceType)}`,
  })))

const lastPullLabel = computed(() => {
  const pull = simulator.lastPull.value
  return pull ? resolveGachaBehaviorTypeLabel(ctx, pull.behaviorType) : ""
})

const results = computed(() => simulator.lastBatch.value.map((draw) => {
  const card = props.cardsById.get(draw.cardId) ?? null
  return {
    key: draw.key,
    draw,
    card,
    characterName: card?.characterId != null ? props.characterMap.get(card.characterId)?.name ?? null : null,
    unreleased: card ? isUnreleasedContent(card.releaseAt, props.nowMs) : false,
  }
}))

const guaranteeNote = computed(() => {
  const rarity = props.model?.ten?.guaranteeRarity
  return rarity ? t("gachas.detail.guaranteedNote", { rarity: resolveGachaRarityLabel(ctx, rarity) }) : null
})
</script>

<template>
  <CatalogDetailSection
    :title="t('gachaCatalog.simulator.title')"
    :icon="LucideDices"
    :description="t('gachaCatalog.simulator.description')"
    :loading="loading"
    :empty="!simulator.canPull.value"
    :empty-message="t('gachaCatalog.simulator.unavailable')"
    content-class="flex flex-col gap-4"
  >
    <template #action>
      <Button
        variant="ghost"
        size="sm"
        class="h-7 gap-1 px-2 text-xs font-normal text-muted-foreground"
        :disabled="!simulator.hasPulled.value"
        @click="simulator.reset()"
      >
        <LucideRotateCcw class="size-3.5" />
        {{ t("gachaCatalog.simulator.reset") }}
      </Button>
    </template>

    <div class="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" class="h-auto flex-col gap-0 px-4 py-1.5" @click="simulator.pullSingle()">
        <span class="text-sm font-semibold">{{ t("gachaCatalog.simulator.pullSingle") }}</span>
        <span class="text-[11px] font-normal text-muted-foreground tabular-nums">{{ costLabel(model?.single ?? null) }}</span>
      </Button>
      <Button size="sm" class="h-auto flex-col gap-0 px-4 py-1.5" @click="simulator.pullTen()">
        <span class="text-sm font-semibold">{{ t("gachaCatalog.simulator.pullTen") }}</span>
        <span class="text-[11px] font-normal opacity-80 tabular-nums">{{ costLabel(model?.ten ?? null) }}</span>
      </Button>
      <p v-if="guaranteeNote" class="basis-full text-xs text-muted-foreground sm:basis-auto sm:pl-2">{{ guaranteeNote }}</p>
    </div>

    <div
      v-if="simulator.hasPulled.value"
      class="flex flex-col gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs"
      aria-live="polite"
    >
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span class="font-medium tabular-nums">{{ t("gachaCatalog.simulator.pulls", { count: simulator.drawCount.value }) }}</span>
        <span v-if="spentEntries.length > 0" class="inline-flex flex-wrap items-center gap-x-2 text-muted-foreground">
          <span>{{ t("gachaCatalog.simulator.spent") }}</span>
          <span v-for="entry in spentEntries" :key="entry.resourceType" class="text-foreground tabular-nums">{{ entry.label }}</span>
        </span>
      </div>
      <ul class="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
        <li v-for="entry in simulator.tally.value" :key="entry.rarity" class="inline-flex items-center gap-1.5">
          <span :class="['size-2.5 rounded-full', resolveGachaRarityToneClass(entry.rarity)]" aria-hidden="true" />
          <span>{{ resolveGachaRarityLabel(ctx, entry.rarity) }}</span>
          <span class="font-medium text-foreground tabular-nums">×{{ entry.count }}</span>
        </li>
      </ul>
    </div>

    <div v-if="simulator.hasPulled.value" class="flex flex-col gap-2">
      <p class="text-xs text-muted-foreground">
        {{ t("gachaCatalog.simulator.lastBatch") }}
        <span v-if="lastPullLabel"> · {{ lastPullLabel }}</span>
      </p>
      <CatalogEntityGrid columns="cards">
        <template v-for="entry in results" :key="entry.key">
          <GachaCardTile
            v-if="entry.card"
            :card="entry.card"
            :region="region"
            :asset-endpoint="assetEndpoint"
            :character-name="entry.characterName"
            :unreleased="entry.unreleased"
            :blur-unreleased="blurUnreleased"
            :corner-badge="entry.draw.isNew ? t('gachaCatalog.simulator.new') : null"
            :guaranteed="entry.draw.guaranteed"
          />
          <div
            v-else
            class="flex aspect-square items-center justify-center rounded-md bg-muted font-mono text-xs text-muted-foreground ring-1 ring-border"
          >
            #{{ entry.draw.cardId }}
          </div>
        </template>
      </CatalogEntityGrid>
    </div>
    <p v-else class="text-sm text-muted-foreground">{{ t("gachaCatalog.simulator.idle") }}</p>

    <p class="text-xs text-muted-foreground/80">{{ t("gachaCatalog.simulator.disclaimer") }}</p>
  </CatalogDetailSection>
</template>
