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
 * One play level of the selected difficulty: a collapsible row with the
 * status bar and counts, and the (filtered) song list underneath.
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

function chipStyle(status: MusicProgressStatus): Record<string, string> {
  return status === "unplayed" ? {} : { backgroundColor: STATUS_COLORS[status], color: "#fff", borderColor: "transparent" }
}
</script>

<template>
  <div class="rounded-md border" :class="filterActive && matchCount === 0 ? 'opacity-60' : ''">
    <button
      type="button"
      class="flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 rounded-md p-3 text-left transition-colors hover:bg-accent/50 dark:hover:bg-accent/30"
      :aria-expanded="expanded"
      @click="emit('toggle')"
    >
      <LucideChevronDown
        class="size-4 shrink-0 text-muted-foreground transition-transform duration-200"
        :class="expanded ? '' : '-rotate-90'"
      />
      <span
        class="inline-flex w-16 shrink-0 items-center justify-center rounded px-2 py-0.5 text-xs font-semibold text-white"
        :style="{ backgroundColor: color }"
      >
        {{ label }}
      </span>
      <span class="shrink-0 text-xs tabular-nums text-muted-foreground sm:w-20">
        {{ filterActive ? t("musicProgress.matchCount", { count: matchCount, total: row.total }) : t("musicProgress.songCount", { count: row.total }) }}
      </span>
      <!-- Phones: pill line, bar, counts, rewards; wider screens: one line. -->
      <span class="order-3 basis-full text-xs tabular-nums text-muted-foreground sm:w-48 sm:basis-auto sm:text-right">
        AP {{ row.allPerfect }} · FC {{ row.fullComboOnly }} · CL {{ row.clearOnly }} · — {{ row.unplayed }}
      </span>
      <span class="order-2 flex h-2.5 basis-full gap-px overflow-hidden rounded-full bg-muted sm:min-w-32 sm:flex-1 sm:basis-auto">
        <span
          v-for="segment in segments(row)"
          :key="segment.key"
          class="h-full"
          :style="{ backgroundColor: segment.color, width: `${(segment.count / row.total) * 100}%`, opacity: segment.key === 'unplayed' ? 0.35 : 1 }"
          :title="`${t(`musicProgress.legend.${segment.key}`)}: ${segment.count}`"
        />
      </span>
      <span
        v-if="rewardsText"
        :class="[
          'order-4 basis-full text-xs tabular-nums sm:w-44 sm:basis-auto sm:text-right',
          hasRemaining ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/70',
        ]"
      >
        {{ rewardsText }}
      </span>
    </button>

    <div v-if="expanded" class="border-t p-3">
      <p v-if="songs.length === 0" class="py-2 text-center text-xs text-muted-foreground">
        {{ t("musicProgress.noMatches") }}
      </p>
      <div v-else class="grid grid-cols-1 gap-1.5 sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
        <RouterLink
          v-for="song in songs"
          :key="song.musicId"
          :to="`/music/${song.musicId}`"
          class="flex items-center gap-2 rounded-md border bg-card p-1.5 pr-2 transition-colors hover:bg-accent/50 dark:hover:bg-accent/30"
        >
          <MusicJacket :url="song.jacketUrl" :alt="song.title" class="size-9 shrink-0 rounded" />
          <span class="min-w-0 flex-1 truncate text-sm" :title="song.title">{{ song.title }}</span>
          <span
            class="inline-flex min-w-12 shrink-0 items-center justify-center rounded border px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground"
            :style="chipStyle(song.status)"
          >
            {{ t(`musicProgress.status.${song.status}`) }}
          </span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
