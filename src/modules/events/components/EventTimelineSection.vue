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
import { formatLocalizedDateTime } from "@/lib/date-time"
import CatalogCountdown from "@/shared/components/catalog/CatalogCountdown.vue"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import CatalogInfoList from "@/shared/components/catalog/CatalogInfoList.vue"
import CatalogInfoRow from "@/shared/components/catalog/CatalogInfoRow.vue"
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

function formatAt(value: number | null) {
  return formatLocalizedDateTime(value, dateTimeFormat, t("events.common.dateFallback"))
}
</script>

<template>
  <CatalogDetailSection :title="t('events.detail.timelineTitle')" :icon="LucideCalendarClock" content-class="flex flex-col gap-4">
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
        <span class="tabular-nums">{{ formatAt(row.at) }}</span>
      </CatalogInfoRow>
    </CatalogInfoList>
  </CatalogDetailSection>
</template>
