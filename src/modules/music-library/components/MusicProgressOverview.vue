<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { MusicDifficulty } from "@/modules/music-library/lib/music-difficulties"

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
  <Card>
    <CardHeader class="pb-2">
      <CardTitle class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-base">
        <span>{{ t("musicProgress.overallTitle") }}</span>
        <span v-if="totalsText" class="text-xs font-normal tabular-nums text-muted-foreground">{{ totalsText }}</span>
      </CardTitle>
      <CardDescription v-if="hint" class="text-xs">{{ hint }}</CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col gap-1" role="radiogroup" :aria-label="t('musicProgress.overallTitle')">
      <button
        v-for="row in rows"
        :key="row.difficulty"
        type="button"
        role="radio"
        :aria-checked="row.difficulty === active"
        class="flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/50"
        :class="row.difficulty === active ? 'bg-muted/60 ring-1 ring-border' : ''"
        @click="emit('select', row.difficulty)"
      >
        <span
          class="inline-flex w-16 shrink-0 items-center justify-center rounded px-1 py-0.5 text-[11px] font-semibold text-white"
          :style="{ backgroundColor: row.color }"
        >
          {{ row.label }}
        </span>
        <span class="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground sm:order-3 sm:ml-0 sm:w-44 sm:text-right">
          AP {{ row.allPerfect }} · FC {{ row.fullCombo }} · CL {{ row.cleared }}/{{ row.total }}
        </span>
        <span class="flex h-2.5 basis-full gap-px overflow-hidden rounded-full bg-muted sm:order-2 sm:min-w-32 sm:flex-1 sm:basis-auto">
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
            'basis-full text-xs tabular-nums sm:order-4 sm:w-44 sm:basis-auto sm:text-right',
            row.hasRemaining ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/70',
          ]"
        >
          {{ row.rewardsText }}
        </span>
      </button>
      <p v-if="scoreRankText" class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 px-2 text-xs">
        <span class="inline-flex w-16 shrink-0 items-center justify-center rounded border px-1 py-0.5 text-[11px] font-semibold">
          {{ t("musicProgress.rewards.scoreRank") }}
        </span>
        <span :class="scoreRankHasRemaining ? 'tabular-nums text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/70'">
          {{ scoreRankText }}
        </span>
      </p>
    </CardContent>
  </Card>
</template>
