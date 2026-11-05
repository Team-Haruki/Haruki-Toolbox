<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { resolveSekaiDifficultyLabel } from "@/shared/sekai/labels"
import { resolveMusicDifficultyChipClass } from "@/modules/music-library/lib/music-difficulties"
import type { MusicDifficultyPill } from "@/modules/music-library/lib/music-view"

/** Tinted level pills (EASY green … APPEND pink) in canonical difficulty order. */
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
    <span
      v-for="pill in pills"
      :key="pill.difficulty"
      :class="[resolveMusicDifficultyChipClass(pill.difficulty), 'min-w-7 gap-1 px-1.5 py-1 max-sm:min-w-5 max-sm:px-0.5']"
      :title="resolveSekaiDifficultyLabel({ t, te }, pill.difficulty)"
    >
      <span v-if="showLabel">{{ resolveSekaiDifficultyLabel({ t, te }, pill.difficulty) }}</span>
      {{ pill.playLevel ?? "-" }}
    </span>
  </div>
</template>
