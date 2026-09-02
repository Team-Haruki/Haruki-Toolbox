<script setup lang="ts">
import { ref } from "vue"
import { RouterLink } from "vue-router"
import { useI18n } from "vue-i18n"
import { LucideChevronDown } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import EventBannerImage from "@/modules/events/components/EventBannerImage.vue"
import EventTypeBadge from "@/modules/events/components/EventTypeBadge.vue"
import type { EventRecordTableRow } from "@/modules/events/lib/event-records"

export type EventRecordChapterView = {
  key: string
  name: string
  iconUrl: string | null
  chapterLabel: string | null
  pointText: string
  rankText: string
  rankFromHonor: boolean
}

/**
 * One participation: banner, name and date, then PT and rank. World Link
 * chapters fold underneath and open on demand, so a long history stays one
 * line per event.
 */
defineProps<{
  row: EventRecordTableRow
  region: SekaiRegion
  preference: SekaiAssetEndpointPreference
  dateText: string
  pointText: string
  rankText: string
  /** The rank shown is a tier ceiling read off the event honor, not an exact rank. */
  rankFromHonor: boolean
  chapters: readonly EventRecordChapterView[]
}>()

const { t } = useI18n()

const chaptersOpen = ref(false)
</script>

<template>
  <div class="rounded-md border">
    <!-- Phones: numbers drop to a second line so the event name keeps its width. -->
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2 p-2 sm:flex-nowrap sm:px-3">
      <div class="relative aspect-[2/1] w-20 shrink-0 overflow-hidden rounded-md bg-muted sm:w-24">
        <EventBannerImage :region="region" :assetbundle-name="row.event?.assetbundleName ?? null" :alt="row.name" :preference="preference" />
      </div>
      <div class="min-w-0 flex-1">
        <RouterLink
          v-if="row.event"
          :to="`/events/${row.eventId}`"
          class="block truncate text-sm font-medium underline-offset-4 hover:underline"
          :title="row.name"
        >
          {{ row.name }}
        </RouterLink>
        <span v-else class="block truncate text-sm font-medium">{{ row.name }}</span>
        <div class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span><b class="font-semibold">#{{ row.eventId }}</b> {{ dateText }}</span>
          <EventTypeBadge :event-type="row.event?.eventType ?? null" size="sm" />
        </div>
      </div>
      <div class="grid basis-full grid-cols-2 gap-x-4 tabular-nums sm:w-56 sm:shrink-0 sm:basis-auto sm:gap-x-6 sm:text-right">
        <div class="flex items-baseline gap-1.5 sm:block">
          <div class="text-[10px] text-muted-foreground sm:hidden">{{ t("eventRecords.table.point") }}</div>
          <div class="text-sm font-semibold">{{ pointText }}</div>
        </div>
        <div class="flex items-baseline gap-1.5 sm:block" :title="rankFromHonor ? t('eventRecords.table.rankFromHonor') : undefined">
          <div class="text-[10px] text-muted-foreground sm:hidden">{{ t("eventRecords.table.rank") }}</div>
          <div class="text-sm font-semibold" :class="rankFromHonor ? 'text-muted-foreground' : ''">{{ rankText }}</div>
        </div>
      </div>
    </div>

    <template v-if="chapters.length > 0">
      <button
        type="button"
        class="flex w-full items-center gap-1.5 border-t px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted/40"
        :aria-expanded="chaptersOpen"
        @click="chaptersOpen = !chaptersOpen"
      >
        <LucideChevronDown class="size-3.5 transition-transform duration-200" :class="chaptersOpen ? '' : '-rotate-90'" />
        {{ t("eventRecords.worldLink.chapters", { count: chapters.length }) }}
        <span class="ml-auto">{{ chaptersOpen ? t("eventRecords.worldLink.hideChapters") : t("eventRecords.worldLink.showChapters") }}</span>
      </button>
      <div v-if="chaptersOpen" class="grid gap-1 border-t bg-muted/20 p-2 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="chapter in chapters"
          :key="chapter.key"
          class="flex items-center gap-2 rounded-md bg-background/80 px-2 py-1.5 text-xs"
        >
          <img v-if="chapter.iconUrl" :src="chapter.iconUrl" :alt="chapter.name" class="size-6 shrink-0 rounded-full ring-1 ring-border" loading="lazy" decoding="async">
          <span v-else class="size-6 shrink-0 rounded-full bg-muted" />
          <span class="min-w-0 flex-1 truncate">
            {{ chapter.name }}
            <span v-if="chapter.chapterLabel" class="text-muted-foreground"> · {{ chapter.chapterLabel }}</span>
          </span>
          <span class="shrink-0 tabular-nums">{{ chapter.pointText }}</span>
          <span
            class="w-14 shrink-0 text-right tabular-nums"
            :class="chapter.rankFromHonor ? 'text-muted-foreground' : ''"
            :title="chapter.rankFromHonor ? t('eventRecords.table.rankFromHonor') : undefined"
          >
            {{ chapter.rankText }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
