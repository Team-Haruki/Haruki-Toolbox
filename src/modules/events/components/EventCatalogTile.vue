<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import type { SekaiRegion } from "@/types"
import { formatLocalizedDate } from "@/lib/date-time"
import CatalogStatusBadge from "@/shared/components/catalog/CatalogStatusBadge.vue"
import type { CatalogStatus } from "@/shared/components/catalog/types"
import SekaiAttrIcon from "@/shared/components/SekaiAttrIcon.vue"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import EventBannerImage from "@/modules/events/components/EventBannerImage.vue"
import EventTypeBadge from "@/modules/events/components/EventTypeBadge.vue"
import type { SekaiEventItem } from "@/modules/events/lib/event-filter"
import { resolveEventCatalogStatus, resolveEventStatusUntil } from "@/modules/events/lib/event-list"

/**
 * One event in the list: a 2:1 banner tile (`grid`) or a compact row
 * (`list`). Both link to the detail page.
 */
const props = withDefaults(defineProps<{
  event: SekaiEventItem
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
  nowMs: number
  view?: "grid" | "list"
  unreleased?: boolean
  blur?: boolean
  bonusAttrs?: readonly string[]
}>(), {
  view: "grid",
  unreleased: false,
  blur: false,
  bonusAttrs: () => [],
})

const { t } = useI18n()

const status = computed<CatalogStatus>(() => resolveEventCatalogStatus(props.event, props.nowMs))
const untilMs = computed(() => resolveEventStatusUntil(props.event, status.value))

const dateFormat: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit" }
const period = computed(() => {
  const fallback = t("events.common.dateFallback")
  return `${formatLocalizedDate(props.event.startAt, dateFormat, fallback)} – ${formatLocalizedDate(props.event.aggregateAt, dateFormat, fallback)}`
})

const to = computed(() => ({ name: "events.detail", params: { eventId: String(props.event.id) } }))
</script>

<template>
  <RouterLink
    v-if="view === 'grid'"
    :to="to"
    :class="[
      'group flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-xs transition-shadow hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
      status === 'ongoing' ? 'ring-1 ring-emerald-500/50' : '',
    ]"
    :aria-label="event.name"
    data-slot="event-tile"
  >
    <div class="relative aspect-[2/1] w-full overflow-hidden bg-muted">
      <EventBannerImage
        :region="region"
        :assetbundle-name="event.assetbundleName"
        :alt="event.name"
        :preference="assetEndpoint"
        :blur="unreleased && blur"
      />
      <span
        v-if="unreleased"
        class="absolute top-1 right-1 rounded bg-red-600 px-1 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm"
      >
        {{ t("sekaiUnreleased.badge") }}
      </span>
    </div>
    <div class="flex flex-1 flex-col gap-1.5 p-2.5">
      <p class="line-clamp-2 min-h-[2.5rem] text-sm leading-5 font-medium group-hover:text-primary">{{ event.name }}</p>
      <div class="flex flex-wrap items-center gap-1">
        <EventTypeBadge :event-type="event.eventType" size="sm" />
        <CatalogStatusBadge :status="status" :until-ms="untilMs" size="sm" />
      </div>
      <div class="mt-auto flex items-center justify-between gap-2 text-[11px] text-muted-foreground tabular-nums">
        <span class="truncate">{{ period }}</span>
        <span v-if="bonusAttrs.length > 0" class="flex shrink-0 items-center gap-0.5">
          <SekaiAttrIcon v-for="attr in bonusAttrs" :key="attr" :attr="attr" size="xs" />
        </span>
      </div>
    </div>
  </RouterLink>

  <RouterLink
    v-else
    :to="to"
    :class="[
      'group flex items-center gap-3 rounded-lg border bg-card p-2 text-card-foreground shadow-xs transition-colors hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none dark:hover:bg-accent/20',
      status === 'ongoing' ? 'ring-1 ring-emerald-500/50' : '',
    ]"
    :aria-label="event.name"
    data-slot="event-row"
  >
    <div class="relative aspect-[2/1] w-24 shrink-0 overflow-hidden rounded-md bg-muted">
      <EventBannerImage
        :region="region"
        :assetbundle-name="event.assetbundleName"
        :alt="event.name"
        :preference="assetEndpoint"
        :blur="unreleased && blur"
      />
      <span
        v-if="unreleased"
        class="absolute top-0.5 right-0.5 rounded bg-red-600 px-1 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm"
      >
        {{ t("sekaiUnreleased.badge") }}
      </span>
    </div>
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <p class="truncate text-sm font-medium group-hover:text-primary">{{ event.name }}</p>
      <div class="flex flex-wrap items-center gap-1">
        <EventTypeBadge :event-type="event.eventType" size="sm" />
        <CatalogStatusBadge :status="status" :until-ms="untilMs" size="sm" />
        <span v-if="bonusAttrs.length > 0" class="ml-1 flex items-center gap-0.5">
          <SekaiAttrIcon v-for="attr in bonusAttrs" :key="attr" :attr="attr" size="xs" />
        </span>
      </div>
      <p class="text-[11px] text-muted-foreground tabular-nums">
        <span class="font-mono">#{{ event.id }}</span> · {{ period }}
      </p>
    </div>
  </RouterLink>
</template>
