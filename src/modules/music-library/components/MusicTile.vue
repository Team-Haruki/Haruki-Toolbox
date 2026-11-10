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
import MusicPlayButton from "./MusicPlayButton.vue"

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
  <!-- The title link stretches over the whole tile; the play button sits above it. -->
  <article
    class="group relative flex flex-col gap-2 rounded-xl border bg-card p-2.5 shadow-xs transition-colors hover:bg-accent/50 has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/50 sm:p-3 dark:hover:bg-accent/30"
    data-slot="music-tile"
  >
    <div class="relative aspect-square w-full overflow-hidden rounded-lg">
      <MusicJacket :url="jacketUrl" :alt="entry.title" class="size-full" :blur="unreleased && blur" />
      <Badge
        v-if="unreleased"
        size="sm"
        class="absolute top-1 right-1 rounded bg-red-600 font-semibold text-white shadow-sm"
      >
        {{ t("sekaiUnreleased.badge") }}
      </Badge>
      <MusicPlayButton :entry="entry" class="absolute right-2 bottom-2 z-10" />
    </div>
    <div class="min-w-0 space-y-1">
      <RouterLink
        :to="`/music/${entry.id}`"
        class="line-clamp-2 text-sm leading-snug font-medium outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']"
        :title="entry.title"
      >
        {{ entry.title }}
      </RouterLink>
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
  </article>
</template>
