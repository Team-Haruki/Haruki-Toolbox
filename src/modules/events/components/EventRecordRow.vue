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
 * One participation as a table line: banner, name, type, date, then PT and
 * rank in fixed columns. The parent list is the `@container`, draws the
 * border and the dividers, and shows the column captions; below 44rem of
 * list width the type and date fold under the name and the numbers take a
 * second line. World Link chapters open under the row on demand.
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
  <div data-slot="event-record-row">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5">
      <div class="relative aspect-[2/1] w-16 shrink-0 overflow-hidden rounded bg-muted">
        <EventBannerImage :region="region" :assetbundle-name="row.event?.assetbundleName ?? null" :alt="row.name" :preference="preference" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <RouterLink
            v-if="row.event"
            :to="`/events/${row.eventId}`"
            class="min-w-0 truncate text-sm font-medium underline-offset-4 hover:underline"
            :title="row.name"
          >
            {{ row.name }}
          </RouterLink>
          <span v-else class="min-w-0 truncate text-sm font-medium">{{ row.name }}</span>
          <button
            v-if="chapters.length > 0"
            type="button"
            class="inline-flex shrink-0 items-center gap-0.5 rounded-full border px-1.5 py-px text-[11px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground pointer-coarse:min-h-8 pointer-coarse:px-2.5"
            :aria-expanded="chaptersOpen"
            :title="chaptersOpen ? t('eventRecords.worldLink.hideChapters') : t('eventRecords.worldLink.showChapters')"
            @click="chaptersOpen = !chaptersOpen"
          >
            {{ t("eventRecords.worldLink.chapters", { count: chapters.length }) }}
            <LucideChevronDown class="size-3 transition-transform duration-200" :class="chaptersOpen ? 'rotate-180' : ''" />
          </button>
        </div>
        <div class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground @min-[44rem]:hidden">
          <span class="tabular-nums"><b class="font-semibold">#{{ row.eventId }}</b> {{ dateText }}</span>
          <EventTypeBadge :event-type="row.event?.eventType ?? null" size="sm" />
        </div>
      </div>
      <div class="hidden w-24 shrink-0 @min-[44rem]:block">
        <EventTypeBadge :event-type="row.event?.eventType ?? null" size="sm" />
      </div>
      <div class="hidden w-36 shrink-0 text-xs tabular-nums text-muted-foreground @min-[44rem]:block">
        <b class="font-semibold">#{{ row.eventId }}</b> {{ dateText }}
      </div>
      <div class="grid basis-full grid-cols-2 gap-x-4 tabular-nums @min-[44rem]:w-52 @min-[44rem]:shrink-0 @min-[44rem]:basis-auto @min-[44rem]:text-right">
        <div class="flex items-baseline gap-1.5 @min-[44rem]:block">
          <div class="text-[10px] text-muted-foreground @min-[44rem]:hidden">{{ t("eventRecords.table.point") }}</div>
          <div class="text-sm font-semibold">{{ pointText }}</div>
        </div>
        <div class="flex items-baseline gap-1.5 @min-[44rem]:block" :title="rankFromHonor ? t('eventRecords.table.rankFromHonor') : undefined">
          <div class="text-[10px] text-muted-foreground @min-[44rem]:hidden">{{ t("eventRecords.table.rank") }}</div>
          <div class="text-sm font-semibold" :class="rankFromHonor ? 'text-muted-foreground' : ''">{{ rankText }}</div>
        </div>
      </div>
    </div>

    <div v-if="chapters.length > 0 && chaptersOpen" class="grid gap-1 border-t border-border/60 bg-muted/20 p-2 @min-[36rem]:grid-cols-2 @min-[60rem]:grid-cols-3">
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
  </div>
</template>
