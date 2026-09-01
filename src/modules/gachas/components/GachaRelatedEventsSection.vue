<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucideCalendarRange } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { Badge } from "@/components/ui/badge"
import { formatLocalizedDate } from "@/lib/date-time"
import { resolveCatalogStatus } from "@/shared/components/catalog/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import CatalogStatusBadge from "@/shared/components/catalog/CatalogStatusBadge.vue"
import { EventBannerImage, EventTypeBadge } from "@/modules/events"
import type { GachaRelatedEvent } from "@/modules/gachas/lib/gacha-related"

defineProps<{
  events: readonly GachaRelatedEvent[]
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
  loading: boolean
  nowMs: number
}>()

const { t } = useI18n()

function formatDate(value: number | null): string {
  return formatLocalizedDate(value, { year: "numeric", month: "2-digit", day: "2-digit" }, t("gachas.common.dateFallback"))
}
</script>

<template>
  <CatalogDetailSection
    :title="t('gachaCatalog.related.title')"
    :icon="LucideCalendarRange"
    :loading="loading"
    :empty="events.length === 0"
    :empty-message="t('gachaCatalog.related.empty')"
    content-class="flex flex-col gap-2"
  >
    <RouterLink
      v-for="entry in events"
      :key="entry.event.id"
      :to="{ name: 'events.detail', params: { eventId: entry.event.id } }"
      class="flex items-center gap-3 rounded-md border bg-muted/20 p-2 outline-none transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-accent/30"
    >
      <div class="relative aspect-[2/1] w-24 shrink-0 overflow-hidden rounded-md bg-muted sm:w-32">
        <EventBannerImage
          :region="region"
          :assetbundle-name="entry.event.assetbundleName"
          :alt="entry.event.name"
          :preference="assetEndpoint"
        />
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <p class="line-clamp-2 text-sm font-medium leading-snug">{{ entry.event.name }}</p>
        <div class="flex flex-wrap items-center gap-1.5">
          <EventTypeBadge :event-type="entry.event.eventType" />
          <CatalogStatusBadge :status="resolveCatalogStatus(entry.event.startAt, entry.event.aggregateAt, nowMs)" size="sm" />
          <Badge v-if="entry.reason === 'pickup'" variant="sky" size="sm">
            {{ t("gachaCatalog.related.pickup", { count: entry.sharedCardIds.length }) }}
          </Badge>
          <Badge v-else variant="muted" size="sm">{{ t("gachaCatalog.related.period") }}</Badge>
        </div>
        <p class="text-xs text-muted-foreground tabular-nums">
          {{ formatDate(entry.event.startAt) }} – {{ formatDate(entry.event.aggregateAt) }}
        </p>
      </div>
    </RouterLink>
  </CatalogDetailSection>
</template>
