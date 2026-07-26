<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import type { AcceptableValue } from "reka-ui"
import { LucideRefreshCcw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import CatalogFilterPanel from "@/shared/components/catalog/CatalogFilterPanel.vue"
import CatalogSearchField from "@/shared/components/catalog/CatalogSearchField.vue"
import CatalogSelectField from "@/shared/components/catalog/CatalogSelectField.vue"
import type { CatalogFieldOption } from "@/shared/components/catalog/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { formatLocalizedDate } from "@/lib/date-time"
import { resolveSekaiRegionLabel, SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import { SEKAI_CARD_ATTRS } from "@/shared/sekai/catalog"
import { resolveCardAttrIconUrl } from "@/shared/sekai/data-sources"
import { useSettingsStore } from "@/shared/stores/settings"
import { SEKAI_CATALOG_REGION_FOLLOW_VALUE, useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import { useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import EventBannerImage from "../components/EventBannerImage.vue"
import EventStatusBadge from "../components/EventStatusBadge.vue"
import EventTypeBadge from "../components/EventTypeBadge.vue"
import { useEventCatalog } from "../composables/useEventCatalog"
import {
  collectEventYears,
  excludeUnreleasedEvents,
  filterEvents,
  isEventUnreleased,
  isSekaiEventType,
  resolveEventStatus,
  SEKAI_EVENT_TYPES,
  type SekaiEventItem,
} from "../lib/event-filter"

const { t, locale } = useI18n()
const router = useRouter()
const settingsStore = useSettingsStore()

const { region, selectorValue: regionSelectorValue, updateSelectorValue: updateRegionSelector } = useEffectiveCatalogRegion()
const { hideUnreleased, blurUnreleased } = useUnreleasedContentDisplay()
const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)

const { events, bonusAttrMap, loading, error, reload } = useEventCatalog(region)

const search = ref("")
const typeFilter = ref<string | null>(null)
const attrFilter = ref<string | null>(null)
const yearFilter = ref<string | null>(null)

function resetFilters() {
  search.value = ""
  typeFilter.value = null
  attrFilter.value = null
  yearFilter.value = null
}

const nowMs = ref(Date.now())
const nowTimer = setInterval(() => {
  nowMs.value = Date.now()
}, 30_000)

onBeforeUnmount(() => {
  clearInterval(nowTimer)
})

const years = computed(() => collectEventYears(events.value))

const typeFieldOptions = computed<CatalogFieldOption[]>(() =>
  SEKAI_EVENT_TYPES.map((eventType) => ({ value: eventType, label: t(`events.type.${eventType}`) })),
)

const attrFieldOptions = computed<CatalogFieldOption[]>(() =>
  SEKAI_CARD_ATTRS.map((attr) => ({
    value: attr,
    label: t(`events.attr.${attr}`),
    iconUrl: resolveCardAttrIconUrl(attr),
  })),
)

const yearFieldOptions = computed<CatalogFieldOption[]>(() =>
  years.value.map((year) => ({ value: String(year), label: String(year) })),
)

const filteredEvents = computed(() => {
  const year = yearFilter.value != null ? Number(yearFilter.value) : null
  const visibleEvents = hideUnreleased.value
    ? excludeUnreleasedEvents(events.value, nowMs.value)
    : events.value
  return filterEvents(
    visibleEvents,
    {
      search: search.value,
      eventType: typeFilter.value != null && isSekaiEventType(typeFilter.value) ? typeFilter.value : null,
      bonusAttr: attrFilter.value,
      year: year != null && Number.isFinite(year) ? year : null,
    },
    bonusAttrMap.value,
  )
})

const ongoingIds = computed(() => {
  const ids = new Set<number>()
  for (const event of filteredEvents.value) {
    if (resolveEventStatus(event, nowMs.value) === "ongoing") {
      ids.add(event.id)
    }
  }
  return ids
})

// Ongoing events are pinned to the top; the rest keep their startAt-desc order.
const displayEvents = computed(() => {
  const ongoing = filteredEvents.value.filter((event) => ongoingIds.value.has(event.id))
  const others = filteredEvents.value.filter((event) => !ongoingIds.value.has(event.id))
  return [...ongoing, ...others]
})

function updateRegion(value: AcceptableValue) {
  updateRegionSelector(value)
}

function formatEventDate(value: number | null) {
  return formatLocalizedDate(value, { year: "numeric", month: "2-digit", day: "2-digit" }, t("events.common.dateFallback"))
}

function openEventDetail(eventId: number) {
  void router.push({ name: "events.detail", params: { eventId: String(eventId) } })
}

function handleEventKeydown(keyboardEvent: KeyboardEvent, eventId: number) {
  if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
    keyboardEvent.preventDefault()
    openEventDetail(eventId)
  }
}

function eventStatus(event: SekaiEventItem) {
  return resolveEventStatus(event, nowMs.value)
}

function eventUnreleased(event: SekaiEventItem) {
  return isEventUnreleased(event, nowMs.value)
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t("events.list.title") }}</h1>
        <p class="text-sm text-muted-foreground">{{ t("events.list.description") }}</p>
      </div>
    </div>

    <!-- Region + search -->
    <div class="grid gap-3 sm:grid-cols-[12rem_1fr]">
      <div class="grid gap-1.5">
        <Label class="text-xs text-muted-foreground">{{ t("events.list.regionLabel") }}</Label>
        <Select :key="locale" :model-value="regionSelectorValue" @update:model-value="updateRegion">
          <SelectTrigger class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="SEKAI_CATALOG_REGION_FOLLOW_VALUE">
              {{ t("sekaiRegion.followAccount") }}
            </SelectItem>
            <SelectItem v-for="option in SEKAI_REGION_OPTIONS" :key="option.value" :value="option.value">
              {{ resolveSekaiRegionLabel(option.value, t) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <CatalogSearchField
        v-model="search"
        :label="t('events.list.searchLabel')"
        :placeholder="t('events.list.searchPlaceholder')"
      />
    </div>

    <!-- Filters -->
    <CatalogFilterPanel
      :title="t('events.list.filtersTitle')"
      :count-label="t('events.list.resultsCount', { count: filteredEvents.length })"
      :reset-label="t('events.list.resetFilters')"
      @reset="resetFilters"
    >
      <CatalogSelectField
        :key="`type-${locale}`"
        v-model="typeFilter"
        :label="t('events.list.typeLabel')"
        :all-label="t('events.list.allTypes')"
        :options="typeFieldOptions"
      />
      <CatalogSelectField
        :key="`attr-${locale}`"
        v-model="attrFilter"
        :label="t('events.list.attrLabel')"
        :all-label="t('events.list.allAttrs')"
        :options="attrFieldOptions"
      />
      <CatalogSelectField
        :key="`year-${locale}`"
        v-model="yearFilter"
        :label="t('events.list.yearLabel')"
        :all-label="t('events.list.allYears')"
        :options="yearFieldOptions"
      />
    </CatalogFilterPanel>

    <!-- Loading -->
    <template v-if="loading">
      <Skeleton v-for="index in 6" :key="index" class="h-28 w-full" />
    </template>

    <!-- Error -->
    <Card v-else-if="error">
      <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
        <p class="text-sm text-muted-foreground">{{ t("events.list.loadFailed") }}</p>
        <Button variant="outline" size="sm" @click="reload">
          <LucideRefreshCcw class="mr-1 h-4 w-4" /> {{ t("events.list.retry") }}
        </Button>
      </CardContent>
    </Card>

    <!-- Events -->
    <template v-else-if="displayEvents.length > 0">
      <Card
        v-for="event in displayEvents"
        :key="event.id"
        :class="[
          'cursor-pointer overflow-hidden py-0 transition-shadow hover:shadow-md',
          ongoingIds.has(event.id) ? 'ring-2 ring-emerald-500/60' : '',
        ]"
        role="button"
        tabindex="0"
        :aria-label="event.name"
        @click="openEventDetail(event.id)"
        @keydown="handleEventKeydown($event, event.id)"
      >
        <CardContent class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div class="relative aspect-[2/1] w-full shrink-0 overflow-hidden rounded-md bg-muted sm:w-44">
            <EventBannerImage
              :region="region"
              :assetbundle-name="event.assetbundleName"
              :alt="event.name"
              :preference="assetEndpoint"
              :class="eventUnreleased(event) && blurUnreleased ? 'blur-md scale-105' : ''"
            />
            <span
              v-if="eventUnreleased(event)"
              class="absolute right-1 top-1 rounded bg-red-600 px-1 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm"
            >
              {{ t("sekaiUnreleased.badge") }}
            </span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="min-w-0 flex-1 truncate text-base font-semibold">{{ event.name }}</h3>
            </div>
            <div class="mt-1 text-xs text-muted-foreground">{{ t("events.common.idLabel", { id: event.id }) }}</div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <EventTypeBadge :event-type="event.eventType" />
              <EventStatusBadge :status="eventStatus(event)" />
            </div>
            <div class="mt-2 text-xs text-muted-foreground">
              {{ formatEventDate(event.startAt) }} – {{ formatEventDate(event.aggregateAt) }}
            </div>
          </div>
        </CardContent>
      </Card>
    </template>

    <!-- Empty -->
    <Card v-else>
      <CardContent class="py-12 text-center text-muted-foreground">
        {{ t("events.list.empty") }}
      </CardContent>
    </Card>
  </div>
</template>
