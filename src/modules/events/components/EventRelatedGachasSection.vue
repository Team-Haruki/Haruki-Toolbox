<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideTicket } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatLocalizedDate } from "@/lib/date-time"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import CatalogStatusBadge from "@/shared/components/catalog/CatalogStatusBadge.vue"
import { resolveCatalogStatus } from "@/shared/components/catalog/types"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import { resolveSekaiGachaTypeLabel } from "@/shared/sekai/labels"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import type { CatalogGachaSummary } from "@/modules/gachas"
import { buildGachaImageCandidates } from "@/modules/gachas/lib/gacha-catalog"
import type { RelatedGachasResult } from "@/modules/events/lib/event-related-gachas"

/**
 * Gachas related to the event (pickup ∩ event cards, else period overlap).
 * Collapsible and closed by default; the summary shows the match count.
 */
const props = withDefaults(defineProps<{
  result: RelatedGachasResult<CatalogGachaSummary>
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
  bannerAliasMap?: ReadonlyMap<number, number> | null
  nowMs: number
  loading?: boolean
}>(), {
  bannerAliasMap: null,
  loading: false,
})

const { t, te } = useI18n()

const dateFormat: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit" }

const rows = computed(() => props.result.gachas.map((gacha) => {
  const status = resolveCatalogStatus(gacha.startAt, gacha.endAt, props.nowMs)
  const fallback = t("events.common.dateFallback")
  return {
    gacha,
    sources: buildGachaImageCandidates(gacha, props.region, props.assetEndpoint, props.bannerAliasMap?.get(gacha.id) ?? null),
    typeLabel: resolveSekaiGachaTypeLabel({ t, te }, gacha.gachaType),
    status,
    untilMs: status === "upcoming" ? gacha.startAt : status === "ongoing" ? gacha.endAt : null,
    period: `${formatLocalizedDate(gacha.startAt, dateFormat, fallback)} – ${formatLocalizedDate(gacha.endAt, dateFormat, fallback)}`,
  }
}))

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
  <CatalogDetailSection
    :title="t('eventCatalog.gachas.title')"
    :icon="LucideTicket"
    :description="description"
    collapsible
    :default-open="false"
    :loading="loading"
    :empty="result.gachas.length === 0"
    :empty-message="t('eventCatalog.gachas.empty')"
    content-class="flex flex-col gap-2"
  >
    <template #summary>
      {{ t("eventCatalog.gachas.count", { count: result.gachas.length }) }}
    </template>
    <template #skeleton>
      <div class="flex items-center gap-3">
        <Skeleton class="aspect-[2/1] w-28 rounded-md" />
        <div class="flex flex-1 flex-col gap-2">
          <Skeleton class="h-4 w-1/2" />
          <Skeleton class="h-3 w-1/3" />
        </div>
      </div>
    </template>
    <RouterLink
      v-for="row in rows"
      :key="row.gacha.id"
      :to="`/gachas/${row.gacha.id}`"
      class="group flex items-center gap-3 rounded-md border bg-muted/20 p-2 transition-colors hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none dark:hover:bg-accent/30"
    >
      <div class="relative aspect-[2/1] w-28 shrink-0 overflow-hidden rounded-md bg-muted sm:w-36">
        <SekaiAssetImage :sources="row.sources" :alt="row.gacha.name" fit="contain" :placeholder-icon="LucideTicket" />
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <p class="truncate text-sm font-medium group-hover:text-primary">{{ row.gacha.name }}</p>
        <div class="flex flex-wrap items-center gap-1">
          <Badge variant="muted" size="sm">{{ row.typeLabel }}</Badge>
          <CatalogStatusBadge :status="row.status" :until-ms="row.untilMs" size="sm" />
        </div>
        <p class="text-[11px] text-muted-foreground tabular-nums">
          <span class="font-mono">#{{ row.gacha.id }}</span> · {{ row.period }}
        </p>
      </div>
    </RouterLink>
  </CatalogDetailSection>
</template>
