<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucideCalendarRange } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { Badge } from "@/components/ui/badge"
import { formatLocalizedDate } from "@/lib/date-time"
import { resolveCatalogStatus } from "@/shared/components/catalog/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import CatalogStatusBadge from "@/shared/components/catalog/CatalogStatusBadge.vue"
import { EventBannerImage, EventTypeBadge } from "@/modules/events"
import type { GachaRelatedEvent } from "@/modules/gachas/lib/gacha-related"

defineProps<{
  events: readonly GachaRelatedEvent[]
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
  nowMs: number
}>()

const { t } = useI18n()

function formatDate(value: number | null): string {
  return formatLocalizedDate(value, "date", t("gachas.common.dateFallback"))
}
</script>

<template>
  <div v-if="events.length > 0" class="@container flex min-w-0 flex-col gap-2" data-testid="gacha-related-events">
    <p class="flex items-center gap-1.5 text-sm text-muted-foreground">
      <LucideCalendarRange class="size-4 shrink-0" aria-hidden="true" />
      {{ t("gachaCatalog.related.title") }}
    </p>
    <ul class="grid gap-1.5 @min-[44rem]:grid-cols-2">
      <li v-for="entry in events" :key="entry.event.id" class="min-w-0">
        <RouterLink
          :to="{ name: 'events.detail', params: { eventId: entry.event.id } }"
          class="flex h-full items-center gap-2.5 rounded-lg border bg-background/70 p-1.5 pr-2 outline-none transition-colors hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-accent/30"
          :title="entry.event.name"
        >
          <!-- The banner's own proportions (488 × 208): nothing is cropped. -->
          <div class="relative aspect-[488/208] w-24 shrink-0 overflow-hidden rounded-md bg-muted">
            <EventBannerImage
              :region="region"
              :assetbundle-name="entry.event.assetbundleName"
              :alt="entry.event.name"
              :preference="assetEndpoint"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ entry.event.name }}</p>
            <div class="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
              <CatalogStatusBadge :status="resolveCatalogStatus(entry.event.startAt, entry.event.aggregateAt, nowMs)" size="sm" class="max-w-full overflow-hidden" />
              <EventTypeBadge :event-type="entry.event.eventType" />
              <Badge v-if="entry.reason === 'pickup'" variant="sky" size="sm">
                {{ t("gachaCatalog.related.pickup", { count: entry.sharedCardIds.length }) }}
              </Badge>
              <Badge v-else variant="muted" size="sm">{{ t("gachaCatalog.related.period") }}</Badge>
            </div>
            <p class="mt-0.5 truncate text-[11px] text-muted-foreground tabular-nums">
              {{ formatDate(entry.event.startAt) }} – {{ formatDate(entry.event.aggregateAt) }}
            </p>
          </div>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
