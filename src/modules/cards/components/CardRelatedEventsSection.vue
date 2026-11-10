<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucideCalendarRange, LucideChevronRight } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { Badge } from "@/components/ui/badge"
import { formatLocalizedDateRange } from "@/lib/date-time"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import { resolveSekaiEventTypeLabel } from "@/shared/sekai/labels"
import { resolveEventBannerUrl, resolveEventLogoUrl } from "@/modules/events"
import type { CardRelatedEvent } from "@/modules/cards/lib/card-detail"

/**
 * Events the card was featured in, one slim link each for the card header:
 * banner, period, type badge, bonus rates when the dump carries them
 * (`leaderBonusRate` is absent on en) and a story badge. Renders nothing for
 * a card without events.
 */
const props = defineProps<{
  events: readonly CardRelatedEvent[]
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
}>()

const { t, te } = useI18n()

function bannerSources(row: CardRelatedEvent): (string | null)[] {
  return [
    resolveEventBannerUrl(props.region, row.event.assetbundleName, props.assetEndpoint),
    resolveEventLogoUrl(props.region, row.event.assetbundleName, props.assetEndpoint),
  ]
}

function typeLabel(row: CardRelatedEvent): string | null {
  return row.event.eventType ? resolveSekaiEventTypeLabel({ t, te }, row.event.eventType) : null
}

function period(row: CardRelatedEvent): string {
  return formatLocalizedDateRange(row.event.startAt, row.event.aggregateAt, "date", "?")
}
</script>

<template>
  <div v-if="events.length > 0" class="flex min-w-0 flex-col gap-1.5" data-testid="card-related-events">
    <p class="flex items-center gap-1.5 text-sm text-muted-foreground">
      <LucideCalendarRange class="size-4 shrink-0" aria-hidden="true" />
      {{ t("cardCatalog.detail.relatedEvents.title") }}
    </p>
    <ul class="flex flex-col gap-1.5">
      <li v-for="row in events" :key="row.event.id">
        <RouterLink
          :to="{ name: 'events.detail', params: { eventId: row.event.id } }"
          class="flex items-center gap-2.5 rounded-lg border bg-background/70 p-1.5 pr-2 outline-none transition-colors hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-accent/30"
        >
          <!-- The banner's own proportions (488 × 208): nothing is cropped. -->
          <div class="relative aspect-[488/208] w-24 shrink-0 overflow-hidden rounded-md bg-muted">
            <SekaiAssetImage :sources="bannerSources(row)" :alt="row.event.name" fit="contain" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ row.event.name }}</p>
            <div class="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
              <span class="tabular-nums">{{ period(row) }}</span>
              <Badge v-if="typeLabel(row)" variant="muted" size="sm">{{ typeLabel(row) }}</Badge>
              <Badge v-if="row.bonusRate != null" variant="emerald" size="sm" class="tabular-nums">
                {{ t("cardCatalog.detail.relatedEvents.cardBonus", { value: row.bonusRate }) }}
              </Badge>
              <Badge v-if="row.leaderBonusRate != null" variant="sky" size="sm" class="tabular-nums">
                {{ t("cardCatalog.detail.relatedEvents.leaderBonus", { value: row.leaderBonusRate }) }}
              </Badge>
              <Badge v-if="row.hasStory" variant="violet" size="sm">
                {{ t("cardCatalog.detail.relatedEvents.story") }}
              </Badge>
            </div>
          </div>
          <LucideChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
