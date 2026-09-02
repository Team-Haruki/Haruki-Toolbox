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

/** List row: `size-12` jacket, title over date / box hint, level pills in their own column, id at the edge. */
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
    class="flex flex-wrap items-center gap-x-3 gap-y-1.5 bg-card px-3 py-2 transition-colors hover:bg-accent/50 sm:flex-nowrap dark:hover:bg-accent/30"
    data-slot="music-row"
  >
    <MusicJacket
      :url="jacketUrl"
      :alt="entry.title"
      class="size-12 shrink-0 rounded-md"
      :blur="unreleased && blur"
    />
    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
      <div class="flex min-w-0 items-center gap-2">
        <p class="truncate text-sm font-medium" :title="entry.title">{{ entry.title }}</p>
        <Badge v-if="unreleased" size="sm" class="shrink-0 rounded bg-red-600 font-semibold text-white">
          {{ t("sekaiUnreleased.badge") }}
        </Badge>
      </div>
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
    <!-- Own column from `sm`; below that, a full-width line under the meta,
         indented past the jacket so it reads as part of the same entry. -->
    <MusicDifficultyPills :pills="pills" class="basis-full pl-15 sm:basis-auto sm:shrink-0 sm:pl-0" />
    <span class="hidden shrink-0 font-mono text-[11px] text-muted-foreground sm:inline">#{{ entry.id }}</span>
  </RouterLink>
</template>
