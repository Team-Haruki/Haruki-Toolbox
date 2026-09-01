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

/** Grid tile: square jacket, title, release date, box hint and level pills. */
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
    class="group flex flex-col gap-2 rounded-lg border bg-card p-2.5 shadow-xs transition-colors hover:bg-accent/50 sm:p-3 dark:hover:bg-accent/30"
    data-slot="music-tile"
  >
    <div class="relative aspect-square w-full overflow-hidden rounded-md">
      <MusicJacket :url="jacketUrl" :alt="entry.title" class="size-full" :blur="unreleased && blur" />
      <Badge
        v-if="unreleased"
        size="sm"
        class="absolute top-1 right-1 rounded bg-red-600 font-semibold text-white shadow-sm"
      >
        {{ t("sekaiUnreleased.badge") }}
      </Badge>
    </div>
    <div class="min-w-0 space-y-1">
      <p class="line-clamp-2 text-sm leading-snug font-medium" :title="entry.title">{{ entry.title }}</p>
      <p class="flex items-center gap-1 text-xs text-muted-foreground">
        <CalendarDays class="size-3.5 shrink-0" aria-hidden="true" />
        {{ dateLabel ?? t("musicLibrary.list.unknownDate") }}
      </p>
      <MusicEventBoxHint
        v-if="eventBox"
        :character-id="eventBox.characterId"
        :name="eventBox.name"
        :box-number="eventBox.boxNumber"
        class="flex"
      />
    </div>
    <MusicDifficultyPills :pills="pills" class="mt-auto" />
  </RouterLink>
</template>
