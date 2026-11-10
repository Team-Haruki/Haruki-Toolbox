<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { RouterLink } from "vue-router"
import { LucideChevronDown } from "lucide-vue-next"
import MusicJacket from "@/modules/music-library/components/MusicJacket.vue"
import { MUSIC_PROGRESS_STATUS_COLORS, type MusicProgressLevelRow, type MusicProgressStatus } from "@/modules/music-library/lib/music-progress"

export type MusicProgressSongView = {
  musicId: number
  title: string
  jacketUrl: string | null
  status: MusicProgressStatus
}

/**
 * One play level of the selected difficulty: a collapsible one-line row —
 * level, song count, status bar, then the four counts in fixed columns (each
 * marked with its status color, so rows line up down the list) — and the
 * (filtered) song list underneath. The parent draws the list's border and
 * the dividers between rows.
 */
defineProps<{
  row: MusicProgressLevelRow
  label: string
  color: string
  expanded: boolean
  /** Songs after the page's status filter; `matchCount` is their number. */
  songs: readonly MusicProgressSongView[]
  matchCount: number
  filterActive: boolean
  rewardsText: string | null
  hasRemaining: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const { t } = useI18n()

const STATUS_COLORS = MUSIC_PROGRESS_STATUS_COLORS

function segments(row: MusicProgressLevelRow) {
  return [
    { key: "allPerfect", count: row.allPerfect, color: STATUS_COLORS.allPerfect },
    { key: "fullCombo", count: row.fullComboOnly, color: STATUS_COLORS.fullCombo },
    { key: "clear", count: row.clearOnly, color: STATUS_COLORS.clear },
    { key: "unplayed", count: row.unplayed, color: STATUS_COLORS.unplayed },
  ].filter((segment) => segment.count > 0)
}

function counts(row: MusicProgressLevelRow) {
  return [
    { key: "allPerfect", count: row.allPerfect, color: STATUS_COLORS.allPerfect },
    { key: "fullCombo", count: row.fullComboOnly, color: STATUS_COLORS.fullCombo },
    { key: "clear", count: row.clearOnly, color: STATUS_COLORS.clear },
    { key: "unplayed", count: row.unplayed, color: STATUS_COLORS.unplayed },
  ]
}

function chipStyle(status: MusicProgressStatus): Record<string, string> {
  return status === "unplayed" ? {} : { backgroundColor: STATUS_COLORS[status], color: "#fff", borderColor: "transparent" }
}
</script>

<template>
  <!-- Sized by the list's own width, not the viewport: beside the sidebar on a
       tablet the list is phone-narrow even though the screen is not. -->
  <div :class="['@container', filterActive && matchCount === 0 ? 'opacity-60' : '']" data-slot="music-progress-level">
    <button
      type="button"
      class="flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 text-left outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 dark:hover:bg-accent/30"
      :aria-expanded="expanded"
      @click="emit('toggle')"
    >
      <LucideChevronDown
        class="size-4 shrink-0 text-muted-foreground transition-transform duration-200"
        :class="expanded ? '' : '-rotate-90'"
      />
      <span
        class="inline-flex w-14 shrink-0 items-center justify-center rounded px-2 py-0.5 text-xs font-semibold text-white"
        :style="{ backgroundColor: color }"
      >
        {{ label }}
      </span>
      <span :class="['shrink-0 text-xs tabular-nums text-muted-foreground', filterActive ? 'w-28' : 'w-16']">
        {{ filterActive ? t("musicProgress.matchCount", { count: matchCount, total: row.total }) : t("musicProgress.songCount", { count: row.total }) }}
      </span>
      <span class="flex h-2 min-w-16 flex-1 gap-px overflow-hidden rounded-full bg-muted">
        <span
          v-for="segment in segments(row)"
          :key="segment.key"
          class="h-full"
          :style="{ backgroundColor: segment.color, width: `${(segment.count / row.total) * 100}%`, opacity: segment.key === 'unplayed' ? 0.35 : 1 }"
          :title="`${t(`musicProgress.legend.${segment.key}`)}: ${segment.count}`"
        />
      </span>
      <!-- Narrow list: the counts and the rewards share a second line under
           the bar; a wide one keeps everything on one line. -->
      <span class="flex basis-full flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs tabular-nums @min-[40rem]:basis-auto @min-[40rem]:flex-nowrap">
        <span class="flex items-center gap-x-2.5 @min-[40rem]:gap-x-1">
          <span
            v-for="item in counts(row)"
            :key="item.key"
            :class="['inline-flex items-center justify-end gap-1 @min-[40rem]:w-11', item.count === 0 ? 'text-muted-foreground/50' : '']"
            :title="t(`musicProgress.legend.${item.key}`)"
          >
            <span class="size-2 shrink-0 rounded-full" :style="{ backgroundColor: item.color, opacity: item.key === 'unplayed' ? 0.5 : 1 }" aria-hidden="true" />
            <span class="sr-only">{{ t(`musicProgress.legend.${item.key}`) }}</span>
            {{ item.count }}
          </span>
        </span>
        <span
          v-if="rewardsText"
          :class="[
            'ml-auto text-right @min-[40rem]:w-40',
            hasRemaining ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/70',
          ]"
        >
          {{ rewardsText }}
        </span>
      </span>
    </button>

    <div v-if="expanded" class="border-t border-border/60 bg-muted/20 p-2.5">
      <p v-if="songs.length === 0" class="py-2 text-center text-xs text-muted-foreground">
        {{ t("musicProgress.noMatches") }}
      </p>
      <div v-else class="grid gap-1.5 grid-cols-[repeat(auto-fill,minmax(min(13rem,100%),1fr))]">
        <RouterLink
          v-for="song in songs"
          :key="song.musicId"
          :to="`/music/${song.musicId}`"
          class="flex items-center gap-2 rounded-md border bg-card p-1 pr-2 outline-none transition-colors hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:hover:bg-accent/30"
        >
          <MusicJacket :url="song.jacketUrl" :alt="song.title" class="size-8 shrink-0 rounded" />
          <span class="min-w-0 flex-1 truncate text-xs" :title="song.title">{{ song.title }}</span>
          <span
            class="inline-flex min-w-10 shrink-0 items-center justify-center rounded border px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground"
            :style="chipStyle(song.status)"
          >
            {{ t(`musicProgress.status.${song.status}`) }}
          </span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
