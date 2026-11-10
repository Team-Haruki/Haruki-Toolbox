<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { resolveMusicDifficultyChipClass, type MusicDifficulty } from "@/modules/music-library/lib/music-difficulties"

export type MusicProgressOverviewSegment = {
  key: string
  count: number
  color: string
}

export type MusicProgressOverviewRow = {
  difficulty: MusicDifficulty
  label: string
  color: string
  total: number
  allPerfect: number
  fullCombo: number
  cleared: number
  segments: readonly MusicProgressOverviewSegment[]
  /** Unclaimed combo rewards on this difficulty; null when the snapshot has no claim data. */
  rewardsText: string | null
  hasRemaining: boolean
}

/**
 * One row per difficulty: progress bar, counts and the rewards still to
 * claim. The rows double as the difficulty switch for the level breakdown
 * below, so the difficulty is named once on the page instead of three times.
 */
defineProps<{
  rows: readonly MusicProgressOverviewRow[]
  active: MusicDifficulty
  /** Rewards left across every difficulty, already formatted; null without claim data. */
  totalsText: string | null
  /** Score-rank rewards left (difficulty-independent), already formatted. */
  scoreRankText: string | null
  scoreRankHasRemaining: boolean
  hint: string | null
}>()

const emit = defineEmits<{
  select: [difficulty: MusicDifficulty]
}>()

const { t } = useI18n()
</script>

<template>
  <Card class="gap-3" data-testid="music-progress-overview">
    <CardHeader class="pb-2">
      <CardTitle class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-base">
        <span>{{ t("musicProgress.overallTitle") }}</span>
        <span v-if="totalsText" class="text-xs font-normal tabular-nums text-muted-foreground">{{ totalsText }}</span>
      </CardTitle>
      <CardDescription v-if="hint" class="text-xs">{{ hint }}</CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col gap-0.5" role="radiogroup" :aria-label="t('musicProgress.overallTitle')">
      <!-- Chip and counts on one line, the bar under them: reads the same in
           the side column and on a phone. -->
      <button
        v-for="row in rows"
        :key="row.difficulty"
        type="button"
        role="radio"
        :aria-checked="row.difficulty === active"
        class="flex w-full flex-col gap-1.5 rounded-lg px-2 py-2 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50"
        :class="row.difficulty === active ? 'bg-muted/60 ring-1 ring-border' : ''"
        :data-difficulty="row.difficulty"
        @click="emit('select', row.difficulty)"
      >
        <span class="flex items-center gap-2">
          <span :class="[resolveMusicDifficultyChipClass(row.difficulty), 'w-16 px-1 py-1']">
            {{ row.label }}
          </span>
          <span class="ml-auto flex shrink-0 items-baseline gap-2.5 text-xs tabular-nums">
            <span><span class="text-muted-foreground">AP</span> <span class="font-medium">{{ row.allPerfect }}</span></span>
            <span><span class="text-muted-foreground">FC</span> <span class="font-medium">{{ row.fullCombo }}</span></span>
            <span><span class="text-muted-foreground">CL</span> <span class="font-medium">{{ row.cleared }}</span><span class="text-muted-foreground">/{{ row.total }}</span></span>
          </span>
        </span>
        <span class="flex h-2 gap-px overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <span
            v-for="segment in row.segments"
            :key="segment.key"
            class="h-full"
            :style="{ backgroundColor: segment.color, width: `${(segment.count / row.total) * 100}%`, opacity: segment.key === 'unplayed' ? 0.35 : 1 }"
            :title="`${t(`musicProgress.legend.${segment.key}`)}: ${segment.count}`"
          />
        </span>
        <span
          v-if="row.rewardsText"
          :class="[
            'text-[11px] tabular-nums',
            row.hasRemaining ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/70',
          ]"
        >
          {{ row.rewardsText }}
        </span>
      </button>
      <p v-if="scoreRankText" class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 px-2 text-xs">
        <span class="inline-flex w-16 shrink-0 items-center justify-center rounded border px-1 py-1 text-xs font-semibold leading-none">
          {{ t("musicProgress.rewards.scoreRank") }}
        </span>
        <span :class="scoreRankHasRemaining ? 'tabular-nums text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/70'">
          {{ scoreRankText }}
        </span>
      </p>
    </CardContent>
  </Card>
</template>
