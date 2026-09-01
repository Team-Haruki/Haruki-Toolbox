<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucideCalendarRange, LucideChevronRight } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { Badge } from "@/components/ui/badge"
import { formatLocalizedDate } from "@/lib/date-time"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import { resolveSekaiEventTypeLabel } from "@/shared/sekai/labels"
import { resolveEventBannerUrl, resolveEventLogoUrl } from "@/modules/events"
import type { CardRelatedEvent } from "@/modules/cards/lib/card-detail"

/**
 * Events the card was featured in: banner row, type badge, bonus rates when
 * the dump carries them (`leaderBonusRate` is absent on en) and a story badge.
 */
const props = defineProps<{
  events: readonly CardRelatedEvent[]
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
  loading: boolean
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
  const format = (value: number | null) => formatLocalizedDate(value, { dateStyle: "medium" }, "?")
  return `${format(row.event.startAt)} – ${format(row.event.aggregateAt)}`
}
</script>

<template>
  <CatalogDetailSection
    :title="t('cardCatalog.detail.relatedEvents.title')"
    :icon="LucideCalendarRange"
    :loading="loading && events.length === 0"
    :empty="!loading && events.length === 0"
    :empty-message="t('cardCatalog.detail.relatedEvents.empty')"
  >
    <ul class="flex flex-col gap-2">
      <li v-for="row in events" :key="row.event.id">
        <RouterLink
          :to="{ name: 'events.detail', params: { eventId: row.event.id } }"
          class="flex items-center gap-3 rounded-md border bg-muted/20 p-2.5 transition-colors hover:bg-accent/50 dark:hover:bg-accent/30"
        >
          <div class="relative aspect-[2/1] w-28 shrink-0 overflow-hidden rounded-md bg-muted sm:w-36">
            <SekaiAssetImage :sources="bannerSources(row)" :alt="row.event.name" />
          </div>
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <p class="truncate text-sm font-medium">{{ row.event.name }}</p>
            <div class="flex flex-wrap items-center gap-1">
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
            <p class="text-xs text-muted-foreground tabular-nums">{{ period(row) }}</p>
          </div>
          <LucideChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </RouterLink>
      </li>
    </ul>
  </CatalogDetailSection>
</template>
