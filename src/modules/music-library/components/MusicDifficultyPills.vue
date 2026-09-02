<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Badge } from "@/components/ui/badge"
import { resolveSekaiDifficultyLabel } from "@/shared/sekai/labels"
import type { MusicDifficultyPill } from "@/modules/music-library/lib/music-view"

/** Colored level pills (EASY green … APPEND pink) in canonical difficulty order. */
withDefaults(defineProps<{
  pills: readonly MusicDifficultyPill[]
  /** Show the difficulty name next to the level (detail table); tiles show the level only. */
  showLabel?: boolean
}>(), {
  showLabel: false,
})

const { t, te } = useI18n()
</script>

<template>
  <!-- Below `sm` a tile is ~160-195px wide and still has to hold six pills on one
       line, so they shrink to 20px with 2px gaps there: 6*20 + 5*2 = 130px. -->
  <div class="flex flex-wrap gap-1 max-sm:gap-0.5" data-slot="music-difficulty-pills">
    <Badge
      v-for="pill in pills"
      :key="pill.difficulty"
      variant="solid"
      size="sm"
      class="min-w-7 justify-center rounded px-1.5 font-semibold text-white tabular-nums max-sm:min-w-5 max-sm:px-0.5"
      :style="{ backgroundColor: pill.color }"
      :title="resolveSekaiDifficultyLabel({ t, te }, pill.difficulty)"
    >
      <span v-if="showLabel">{{ resolveSekaiDifficultyLabel({ t, te }, pill.difficulty) }}</span>
      {{ pill.playLevel ?? "-" }}
    </Badge>
  </div>
</template>
