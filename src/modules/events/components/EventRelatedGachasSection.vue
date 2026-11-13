<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { LucideTicket } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { Badge } from "@/components/ui/badge"
import { formatLocalizedDateRange } from "@/lib/date-time"
import CatalogErrorState from "@/shared/components/catalog/CatalogErrorState.vue"
import CatalogStatusBadge from "@/shared/components/catalog/CatalogStatusBadge.vue"
import { resolveCatalogStatus } from "@/shared/components/catalog/types"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import { resolveSekaiGachaTypeLabel } from "@/shared/sekai/labels"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import type { CatalogGachaSummary } from "@/modules/gachas"
import { buildGachaImageCandidates } from "@/modules/gachas/lib/gacha-catalog"
import type { RelatedGachasResult } from "@/modules/events/lib/event-related-gachas"

/** How many gachas show before "show more" (three rows of two on a wide screen). */
const COLLAPSED_LIMIT = 6

/**
 * Gachas related to the event (pickup ∩ event cards, else period overlap),
 * as slim links for the event header: the first few, the rest behind "show
 * more". Renders nothing while loading or when there are none.
 */
const props = withDefaults(defineProps<{
  result: RelatedGachasResult<CatalogGachaSummary>
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
  bannerAliasMap?: ReadonlyMap<number, number> | null
  nowMs: number
  /** Gachas index failure; renders an error state with retry. */
  error?: string | null
  retrying?: boolean
}>(), {
  bannerAliasMap: null,
  error: null,
  retrying: false,
})

const emit = defineEmits<{ retry: [] }>()

const { t, te } = useI18n()

const rows = computed(() => props.result.gachas.map((gacha) => {
  const status = resolveCatalogStatus(gacha.startAt, gacha.endAt, props.nowMs)
  const fallback = t("events.common.dateFallback")
  return {
    gacha,
    sources: buildGachaImageCandidates(gacha, props.region, props.assetEndpoint, props.bannerAliasMap?.get(gacha.id) ?? null),
    typeLabel: resolveSekaiGachaTypeLabel({ t, te }, gacha.gachaType),
    status,
    untilMs: status === "upcoming" ? gacha.startAt : status === "ongoing" ? gacha.endAt : null,
    period: formatLocalizedDateRange(gacha.startAt, gacha.endAt, "date", fallback),
  }
}))

const expanded = ref(false)
watch(() => props.result, () => {
  expanded.value = false
})
// One fewer when folded, so the "show more" tile completes the last row.
const visibleRows = computed(() => (
  expanded.value || rows.value.length <= COLLAPSED_LIMIT ? rows.value : rows.value.slice(0, COLLAPSED_LIMIT - 1)
))
const hiddenCount = computed(() => rows.value.length - visibleRows.value.length)

const description = computed(() => {
  switch (props.result.matchedBy) {
    case "pickup":
      return t("eventCatalog.gachas.byPickup")
    case "period":
      return t("eventCatalog.gachas.byPeriod")
    default:
      return null
  }
})
</script>

<template>
  <div v-if="error || result.gachas.length > 0" class="@container flex min-w-0 flex-col gap-2" data-testid="event-related-gachas">
    <!-- How the list was matched is a tooltip: only the curious need it. -->
    <p class="flex items-center gap-1.5 text-sm text-muted-foreground" :title="description && !error ? description : undefined">
      <LucideTicket class="size-4 shrink-0 self-center" aria-hidden="true" />
      {{ t("eventCatalog.gachas.title") }}
      <span v-if="!error" class="tabular-nums">{{ result.gachas.length }}</span>
    </p>
    <CatalogErrorState
      v-if="error"
      :message="t('catalog.detail.loadError')"
      :detail="error"
      :retrying="retrying"
      @retry="emit('retry')"
    />
    <!-- Two to a line only when each link keeps room for its status tag
         ("ongoing · 4 d 13 h left" must never spill out of its tile). -->
    <ul v-else class="grid gap-1.5 @min-[44rem]:grid-cols-2">
      <li v-for="row in visibleRows" :key="row.gacha.id" class="min-w-0">
        <RouterLink
          :to="`/gachas/${row.gacha.id}`"
          class="flex h-full items-center gap-2.5 rounded-lg border bg-background/70 p-1.5 pr-2 outline-none transition-colors hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-accent/30"
          :title="row.gacha.name"
        >
          <div class="relative aspect-[488/208] w-24 shrink-0 overflow-hidden rounded-md bg-muted">
            <SekaiAssetImage :sources="row.sources" :alt="row.gacha.name" fit="contain" :placeholder-icon="LucideTicket" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ row.gacha.name }}</p>
            <div class="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
              <CatalogStatusBadge :status="row.status" :until-ms="row.untilMs" size="sm" class="max-w-full overflow-hidden" />
              <Badge variant="muted" size="sm">{{ row.typeLabel }}</Badge>
            </div>
            <p class="mt-0.5 truncate text-[11px] text-muted-foreground tabular-nums">{{ row.period }}</p>
          </div>
        </RouterLink>
      </li>
      <li v-if="hiddenCount > 0 || expanded" class="flex min-w-0">
        <button
          type="button"
          class="flex min-h-12 w-full items-center justify-center rounded-lg border border-dashed px-3 text-xs text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          :aria-expanded="expanded"
          @click="expanded = !expanded"
        >
          {{ expanded ? t("eventCatalog.gachas.showLess") : t("eventCatalog.gachas.showMore", { count: hiddenCount }) }}
        </button>
      </li>
    </ul>
  </div>
</template>
