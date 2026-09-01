<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import type { SekaiRegion } from "@/types"
import { Badge } from "@/components/ui/badge"
import { buildCatalogCardThumbnail, type CatalogMasterCard } from "@/shared/sekai/catalog"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import SekaiCardThumbnail from "@/shared/components/SekaiCardThumbnail.vue"
import { formatGachaPercent } from "@/modules/gachas/lib/gacha-rates"

/**
 * Square card tile shared by the pickup strip, the pool grid and the
 * simulator results: thumbnail, name, character and the per-pull rate.
 */
const props = withDefaults(defineProps<{
  card: CatalogMasterCard
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
  characterName?: string | null
  rate?: number | null
  rateDigits?: number
  unreleased?: boolean
  blurUnreleased?: boolean
  /** Corner badge on the thumbnail (NEW, PICK UP…). */
  cornerBadge?: string | null
  wish?: boolean
  guaranteed?: boolean
}>(), {
  characterName: null,
  rate: null,
  rateDigits: 3,
  unreleased: false,
  blurUnreleased: false,
  cornerBadge: null,
  wish: false,
  guaranteed: false,
})

const { t } = useI18n()

const thumbnail = computed(() => buildCatalogCardThumbnail(props.card, props.region, props.assetEndpoint))
const blur = computed(() => props.unreleased && props.blurUnreleased)
const title = computed(() => props.card.prefix ?? `#${props.card.id}`)
</script>

<template>
  <RouterLink
    :to="{ name: 'cards.detail', params: { cardId: card.id } }"
    class="group flex min-w-0 flex-col gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
    data-slot="gacha-card-tile"
  >
    <div :class="['relative', blur ? 'overflow-hidden rounded-md' : '']">
      <SekaiCardThumbnail
        :thumbnail="thumbnail"
        :unreleased="unreleased && !blurUnreleased"
        :title="title"
        :corner-badge="cornerBadge"
        :class="blur ? 'scale-105 blur-md' : 'transition-transform group-hover:scale-[1.02]'"
      />
      <span
        v-if="blur"
        class="absolute right-1 top-1 rounded bg-red-600 px-1 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm"
      >
        {{ t("sekaiUnreleased.badge") }}
      </span>
    </div>
    <span class="line-clamp-2 text-[11px] leading-tight group-hover:underline">{{ title }}</span>
    <span v-if="characterName" class="truncate text-[11px] leading-tight text-muted-foreground">{{ characterName }}</span>
    <span v-if="rate != null" class="text-[11px] font-medium leading-tight text-primary tabular-nums">
      {{ formatGachaPercent(rate, rateDigits) }}
    </span>
    <span v-if="wish || guaranteed" class="flex flex-wrap gap-1">
      <Badge v-if="wish" variant="fuchsia" size="sm">{{ t("gachaCatalog.pool.wish") }}</Badge>
      <Badge v-if="guaranteed" variant="amber" size="sm">{{ t("gachaCatalog.simulator.guaranteed") }}</Badge>
    </span>
  </RouterLink>
</template>
