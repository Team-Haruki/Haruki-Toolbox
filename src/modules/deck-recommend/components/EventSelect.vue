<script setup lang="ts">
import { computed, ref, toRef, watch } from "vue"
import { useI18n } from "vue-i18n"
import { ChevronsUpDown } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import CatalogFilterPanel from "@/shared/components/catalog/CatalogFilterPanel.vue"
import CatalogSearchField from "@/shared/components/catalog/CatalogSearchField.vue"
import CatalogSelectField from "@/shared/components/catalog/CatalogSelectField.vue"
import type { CatalogFieldOption } from "@/shared/components/catalog/types"
import { formatLocalizedDate } from "@/lib/date-time"
import { SEKAI_CARD_ATTRS } from "@/shared/sekai/catalog"
import { resolveCardAttrRoundIconUrl } from "@/shared/sekai/data-sources"
import { useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import { useSettingsStore } from "@/shared/stores/settings"
import {
  EventBannerImage,
  EventStatusBadge,
  EventTypeBadge,
  SEKAI_EVENT_TYPES,
  collectEventYears,
  filterEvents,
  isEventUnreleased,
  isSekaiEventType,
  resolveEventStatus,
  useEventCatalog,
  type SekaiEventItem,
} from "@/modules/events"

const props = defineProps<{
  modelValue: string | null
  eventType?: string | null
  region: SekaiRegion
  disabled?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: string | null]
  "update:eventType": [value: string | null]
}>()

const { t } = useI18n()
const settingsStore = useSettingsStore()
const regionRef = toRef(props, "region")
const { blurUnreleased } = useUnreleasedContentDisplay()
const { events, bonusAttrMap, loading } = useEventCatalog(regionRef)
const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)

const open = ref(false)
// Refreshed when the dialog opens so status badges stay current without a timer.
const nowMs = ref(Date.now())

const search = ref("")
const typeFilter = ref<string | null>(null)
const attrFilter = ref<string | null>(null)
const yearFilter = ref<string | null>(null)

const eventById = computed(() => new Map(events.value.map((event) => [event.id, event])))
const selectedEvent = computed(() => {
  const id = props.modelValue != null ? Number(props.modelValue) : null
  return id != null && Number.isFinite(id) ? eventById.value.get(id) ?? null : null
})

const typeFieldOptions = computed<CatalogFieldOption[]>(() =>
  SEKAI_EVENT_TYPES.map((eventType) => ({ value: eventType, label: t(`events.type.${eventType}`) })),
)

const attrFieldOptions = computed<CatalogFieldOption[]>(() =>
  SEKAI_CARD_ATTRS.map((attr) => ({
    value: attr,
    label: t(`events.attr.${attr}`),
    iconUrl: resolveCardAttrRoundIconUrl(attr),
  })),
)

const yearFieldOptions = computed<CatalogFieldOption[]>(() =>
  collectEventYears(events.value).map((year) => ({ value: String(year), label: String(year) })),
)

// Unreleased (upcoming) events stay listed: deck building for the next event
// is a primary use case here, unlike the catalog list.
const filteredEvents = computed(() => {
  const year = yearFilter.value != null ? Number(yearFilter.value) : null
  return filterEvents(
    events.value,
    {
      search: search.value,
      eventType: typeFilter.value != null && isSekaiEventType(typeFilter.value) ? typeFilter.value : null,
      bonusAttr: attrFilter.value,
      year: year != null && Number.isFinite(year) ? year : null,
    },
    bonusAttrMap.value,
  )
})

// Ongoing events are pinned to the top; the rest keep their startAt-desc order.
const displayEvents = computed(() => {
  const ongoing = filteredEvents.value.filter((event) => resolveEventStatus(event, nowMs.value) === "ongoing")
  const others = filteredEvents.value.filter((event) => resolveEventStatus(event, nowMs.value) !== "ongoing")
  return [...ongoing, ...others]
})

watch(open, (isOpen) => {
  if (isOpen) {
    nowMs.value = Date.now()
  }
})

// Default to the ongoing event, falling back to the most recent one.
watch(
  events,
  (nextEvents) => {
    if (props.modelValue || nextEvents.length === 0) {
      return
    }

    const defaultEvent = nextEvents.find((event) => resolveEventStatus(event) === "ongoing")
      ?? nextEvents[0]
    emit("update:modelValue", defaultEvent != null ? String(defaultEvent.id) : null)
    emit("update:eventType", defaultEvent?.eventType ?? null)
  },
  { immediate: true },
)

watch(
  selectedEvent,
  (event) => {
    emit("update:eventType", event?.eventType ?? null)
  },
  { immediate: true },
)

function selectEvent(event: SekaiEventItem) {
  emit("update:modelValue", String(event.id))
  open.value = false
}

function resetFilters() {
  search.value = ""
  typeFilter.value = null
  attrFilter.value = null
  yearFilter.value = null
}

function formatEventDate(value: number | null) {
  return formatLocalizedDate(
    value,
    { year: "numeric", month: "2-digit", day: "2-digit" },
    t("events.common.dateFallback"),
  )
}
</script>

<template>
  <div>
    <Button
      type="button"
      variant="outline"
      class="h-auto min-h-9 w-full justify-between gap-2 px-2.5 py-1.5 font-normal"
      :disabled="props.disabled || loading"
      @click="open = true"
    >
      <span v-if="selectedEvent" class="flex min-w-0 items-center gap-2">
        <span class="h-9 w-[4.5rem] shrink-0 overflow-hidden rounded bg-muted">
          <EventBannerImage
            :region="props.region"
            :assetbundle-name="selectedEvent.assetbundleName"
            :alt="selectedEvent.name"
            :preference="assetEndpoint"
          />
        </span>
        <span class="min-w-0 text-left">
          <span class="block truncate text-sm">{{ selectedEvent.name }}</span>
          <span class="block text-xs text-muted-foreground">#{{ selectedEvent.id }}</span>
        </span>
      </span>
      <span v-else class="truncate text-sm text-muted-foreground">
        {{ loading ? t("deckRecommend.select.loading") : t("deckRecommend.form.eventPlaceholder") }}
      </span>
      <ChevronsUpDown class="size-4 shrink-0 text-muted-foreground" />
    </Button>

    <Dialog v-model:open="open">
      <DialogContent class="flex max-h-[85vh] flex-col gap-3 overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{{ t("deckRecommend.picker.eventDialogTitle") }}</DialogTitle>
        </DialogHeader>

        <CatalogSearchField
          v-model="search"
          :label="t('events.list.searchLabel')"
          :placeholder="t('events.list.searchPlaceholder')"
        />

        <CatalogFilterPanel
          :title="t('events.list.filtersTitle')"
          :count-label="t('events.list.resultsCount', { count: filteredEvents.length })"
          :reset-label="t('events.list.resetFilters')"
          @reset="resetFilters"
        >
          <CatalogSelectField
            v-model="typeFilter"
            :label="t('events.list.typeLabel')"
            :all-label="t('events.list.allTypes')"
            :options="typeFieldOptions"
          />
          <CatalogSelectField
            v-model="attrFilter"
            :label="t('events.list.attrLabel')"
            :all-label="t('events.list.allAttrs')"
            :options="attrFieldOptions"
          />
          <CatalogSelectField
            v-model="yearFilter"
            :label="t('events.list.yearLabel')"
            :all-label="t('events.list.allYears')"
            :options="yearFieldOptions"
          />
        </CatalogFilterPanel>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <div v-if="displayEvents.length > 0" class="grid gap-2">
            <button
              v-for="event in displayEvents"
              :key="event.id"
              type="button"
              :class="[
                'flex items-center gap-3 rounded-lg border bg-card p-2.5 text-left transition-colors [content-visibility:auto] [contain-intrinsic-size:auto_104px] hover:bg-accent/50 dark:hover:bg-accent/30',
                selectedEvent?.id === event.id ? 'ring-2 ring-primary' : '',
              ]"
              @click="selectEvent(event)"
            >
              <span class="relative aspect-[2/1] w-28 shrink-0 overflow-hidden rounded-md bg-muted sm:w-36">
                <EventBannerImage
                  :region="props.region"
                  :assetbundle-name="event.assetbundleName"
                  :alt="event.name"
                  :preference="assetEndpoint"
                  :class="isEventUnreleased(event, nowMs) && blurUnreleased ? 'blur-md scale-105' : ''"
                />
                <span
                  v-if="isEventUnreleased(event, nowMs)"
                  class="absolute right-1 top-1 rounded bg-red-600 px-1 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm"
                >
                  {{ t("sekaiUnreleased.badge") }}
                </span>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium">{{ event.name }}</span>
                <span class="mt-0.5 block text-xs text-muted-foreground">
                  {{ t("events.common.idLabel", { id: event.id }) }}
                </span>
                <span class="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <EventTypeBadge :event-type="event.eventType" />
                  <EventStatusBadge :status="resolveEventStatus(event, nowMs)" />
                </span>
                <span class="mt-1 block text-xs text-muted-foreground">
                  {{ formatEventDate(event.startAt) }} – {{ formatEventDate(event.aggregateAt) }}
                </span>
              </span>
            </button>
          </div>
          <div
            v-else
            class="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground"
          >
            {{ loading ? t("deckRecommend.select.loading") : t("events.list.empty") }}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
