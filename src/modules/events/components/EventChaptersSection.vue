<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideBookMarked } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { formatLocalizedDateTime } from "@/lib/date-time"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import CatalogStatusBadge from "@/shared/components/catalog/CatalogStatusBadge.vue"
import { resolveCatalogStatus, type CatalogStatus } from "@/shared/components/catalog/types"
import SekaiCharacterAvatar from "@/shared/components/SekaiCharacterAvatar.vue"
import { resolveSekaiCharacterColor, type CatalogCharacter } from "@/shared/sekai/catalog"
import type { SekaiWorldBloomChapter } from "@/modules/events/lib/event-filter"

/**
 * World Link chapters: one row per chapter with the featured character,
 * its window and a live status pill. The finale (no character) closes the
 * list. Parents hide the section when the event has no chapters.
 */
const props = defineProps<{
  chapters: readonly SekaiWorldBloomChapter[]
  characterMap: ReadonlyMap<number, CatalogCharacter>
  nowMs: number
}>()

const { t } = useI18n()

type ChapterRow = {
  chapter: SekaiWorldBloomChapter
  name: string
  endAt: number | null
  status: CatalogStatus | null
  untilMs: number | null
  color: string | null
}

const rows = computed<ChapterRow[]>(() => props.chapters.map((chapter) => {
  const endAt = chapter.aggregateAt ?? chapter.chapterEndAt
  const character = chapter.gameCharacterId != null ? props.characterMap.get(chapter.gameCharacterId) ?? null : null
  const status = chapter.chapterStartAt != null ? resolveCatalogStatus(chapter.chapterStartAt, endAt, props.nowMs) : null
  return {
    chapter,
    name: chapter.gameCharacterId == null
      ? t("events.detail.chapterFinale")
      : character?.name ?? `#${chapter.gameCharacterId}`,
    endAt,
    status,
    untilMs: status === "upcoming" ? chapter.chapterStartAt : status === "ongoing" ? endAt : null,
    color: resolveSekaiCharacterColor(chapter.gameCharacterId),
  }
}))

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
  <CatalogDetailSection
    :title="t('events.detail.chaptersTitle')"
    :icon="LucideBookMarked"
    :empty="chapters.length === 0"
    :empty-message="t('eventCatalog.chapters.empty')"
    content-class="flex flex-col gap-2"
  >
    <div
      v-for="row in rows"
      :key="row.chapter.id"
      :class="[
        'flex flex-col gap-2 rounded-md border border-border/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between',
        row.status === 'ongoing' ? 'ring-1 ring-emerald-500/50' : '',
      ]"
    >
      <div class="flex min-w-0 items-center gap-3">
        <SekaiCharacterAvatar
          v-if="row.chapter.gameCharacterId != null"
          :character-id="row.chapter.gameCharacterId"
          :name="row.name"
          size="lg"
          :ring-color="row.color"
        />
        <span
          v-else
          class="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-hidden="true"
        >
          <LucideBookMarked class="size-5" />
        </span>
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="truncate text-sm font-medium">{{ row.name }}</span>
            <Badge v-if="row.chapter.isSupplemental" variant="muted" size="sm">{{ t("eventCatalog.chapters.supplemental") }}</Badge>
            <CatalogStatusBadge v-if="row.status" :status="row.status" :until-ms="row.untilMs" size="sm" />
          </div>
          <div class="text-xs text-muted-foreground">
            {{ t("events.detail.chapterLabel", { no: row.chapter.chapterNo ?? "-" }) }}
          </div>
        </div>
      </div>
      <div class="text-xs text-muted-foreground tabular-nums">
        {{ formatAt(row.chapter.chapterStartAt) }} – {{ formatAt(row.endAt) }}
      </div>
    </div>
  </CatalogDetailSection>
</template>
