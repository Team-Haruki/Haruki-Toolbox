<script setup lang="ts">
import { RouterLink } from "vue-router"
import { useI18n } from "vue-i18n"
import { CalendarDays } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import type { MusicLibraryEntry } from "@/modules/music-library/lib/music-data"
import type { MusicDifficultyPill, MusicEventBoxView } from "@/modules/music-library/lib/music-view"
import MusicDifficultyPills from "./MusicDifficultyPills.vue"
import MusicEventBoxHint from "./MusicEventBoxHint.vue"
import MusicJacket from "./MusicJacket.vue"

/** List row: `size-14` jacket, title, level pills, date and box hint. */
defineProps<{
  entry: MusicLibraryEntry
  jacketUrl: string | null
  dateLabel: string | null
  unreleased: boolean
  blur: boolean
  eventBox: MusicEventBoxView | null
  pills: readonly MusicDifficultyPill[]
}>()

const { t } = useI18n()
</script>

<template>
  <RouterLink
    :to="`/music/${entry.id}`"
    class="flex min-h-16 items-center gap-3 bg-card px-3 py-2 transition-colors hover:bg-accent/50 dark:hover:bg-accent/30"
    data-slot="music-row"
  >
    <MusicJacket
      :url="jacketUrl"
      :alt="entry.title"
      class="size-14 shrink-0 rounded-md"
      :blur="unreleased && blur"
    />
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <div class="flex min-w-0 items-center gap-2">
        <p class="truncate text-sm font-medium" :title="entry.title">{{ entry.title }}</p>
        <Badge v-if="unreleased" size="sm" class="rounded bg-red-600 font-semibold text-white">
          {{ t("sekaiUnreleased.badge") }}
        </Badge>
        <span class="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">#{{ entry.id }}</span>
      </div>
      <MusicDifficultyPills :pills="pills" />
      <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span class="inline-flex items-center gap-1">
          <CalendarDays class="size-3.5 shrink-0" aria-hidden="true" />
          {{ dateLabel ?? t("musicLibrary.list.unknownDate") }}
        </span>
        <MusicEventBoxHint
          v-if="eventBox"
          :character-id="eventBox.characterId"
          :name="eventBox.name"
          :box-number="eventBox.boxNumber"
        />
      </div>
    </div>
  </RouterLink>
</template>
