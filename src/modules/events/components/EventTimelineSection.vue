<script setup lang="ts">
import { computed, type Component } from "vue"
import { useI18n } from "vue-i18n"
import {
  LucideCalendarCheck,
  LucideCalendarClock,
  LucideCalendarX,
  LucideGift,
  LucideTrophy,
} from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import CatalogCountdown from "@/shared/components/catalog/CatalogCountdown.vue"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import CatalogInfoList from "@/shared/components/catalog/CatalogInfoList.vue"
import CatalogInfoRow from "@/shared/components/catalog/CatalogInfoRow.vue"
import CatalogTimeZoneHint from "@/shared/components/catalog/CatalogTimeZoneHint.vue"
import CatalogZonedTime from "@/shared/components/catalog/CatalogZonedTime.vue"
import type { CatalogStatus } from "@/shared/components/catalog/types"
import type { SekaiEventItem } from "@/modules/events/lib/event-filter"
import {
  buildEventTimeline,
  resolveEventCountdownTarget,
  type EventTimelineRowKey,
} from "@/modules/events/lib/event-timeline"

const props = defineProps<{
  event: SekaiEventItem
  status: CatalogStatus
  nowMs: number
  /** The server the event belongs to; its zone is shown next to local times. */
  region: SekaiRegion
}>()

const { t } = useI18n()

const ICONS: Record<EventTimelineRowKey, Component> = {
  start: LucideCalendarClock,
  aggregate: LucideCalendarCheck,
  rankingAnnounce: LucideTrophy,
  distributionStart: LucideGift,
  closed: LucideCalendarX,
}

const LABEL_KEYS: Record<EventTimelineRowKey, string> = {
  start: "events.detail.timeline.start",
  aggregate: "events.detail.timeline.aggregate",
  rankingAnnounce: "eventCatalog.timeline.rankingAnnounce",
  distributionStart: "eventCatalog.timeline.distributionStart",
  closed: "events.detail.timeline.closed",
}

const rows = computed(() => buildEventTimeline(props.event, props.nowMs))
const countdown = computed(() => resolveEventCountdownTarget(props.event, props.status))

const dateTimeFormat: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
}
</script>

<template>
  <CatalogDetailSection :title="t('events.detail.timelineTitle')" :icon="LucideCalendarClock" content-class="flex flex-col gap-4">
    <template #action>
      <CatalogTimeZoneHint :region="region" />
    </template>
    <CatalogCountdown
      v-if="countdown"
      :target-ms="countdown.targetMs"
      :start-ms="countdown.startMs"
      :label="t(countdown.kind === 'start' ? 'catalog.countdown.toStart' : 'catalog.countdown.toAggregate')"
    />
    <CatalogInfoList>
      <CatalogInfoRow
        v-for="row in rows"
        :key="row.key"
        :label="t(LABEL_KEYS[row.key])"
        :icon="ICONS[row.key]"
        :value-class="row.reached ? 'text-muted-foreground' : ''"
      >
        <CatalogZonedTime
          :value="row.at"
          :region="region"
          :options="dateTimeFormat"
          :fallback="t('events.common.dateFallback')"
        />
      </CatalogInfoRow>
    </CatalogInfoList>
  </CatalogDetailSection>
</template>
