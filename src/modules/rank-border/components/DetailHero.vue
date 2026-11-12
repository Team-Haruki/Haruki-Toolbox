<script setup lang="ts">
import { useI18n } from "vue-i18n"
import type { RouteLocationRaw } from "vue-router"
import type { RankBorderLeaderVisual } from "../lib/honor-visuals"
import type { RankBorderHonorView, RichNameSegment } from "../lib/rank-border-types"
import { richNameSegmentStyle } from "../lib/rich-name"
import HonorBadge from "./HonorBadge.vue"
import LeaderCard from "./LeaderCard.vue"

export type DetailHeroNeighbour = {
  key: string
  rankLabel: string
  /** Player name, or null for a border line (the rank label says it all). */
  name: string | null
  scoreLabel: string
  /** Signed distance from the page's subject: "+37,440" above, "−42,715" below. */
  gapLabel: string | null
  /** Catch-up estimate at the current speeds, when there is one. */
  note: string | null
  current: boolean
  to: RouteLocationRaw | null
}

export type DetailHeroLine = {
  key: string
  label: string
  gapLabel: string
  note: string | null
  to: RouteLocationRaw | null
}

/**
 * The top of the detail page: who or what the page is about (card, name,
 * honors, profile comment, rank and score) and where it stands (the seats on
 * either side, then the key lines above and below with the distance to each).
 * The neighbours and lines are links, so the page doubles as a way to walk
 * the leaderboard.
 */
defineProps<{
  isLine: boolean
  leader: RankBorderLeaderVisual | null
  honors: readonly RankBorderHonorView[]
  titleSegments: readonly RichNameSegment[]
  status: { label: string; tone: "line" | "in" | "out" } | null
  rankLabel: string
  scoreLabel: string
  latestLabel: string
  notRankedHint: string | null
  profileWord: string | null
  /** For a border line: the player on it right now, so the honors below have an owner. */
  holderName: string | null
  neighbours: readonly DetailHeroNeighbour[]
  neighboursTitle: string
  lines: readonly DetailHeroLine[]
}>()

const { t } = useI18n()
</script>

<template>
  <section class="@container overflow-hidden rounded-xl border bg-card" data-testid="rank-detail-hero">
    <div
      :class="[
        'grid',
        neighbours.length > 1 && lines.length > 0
          ? '@min-[52rem]:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] @min-[66rem]:grid-cols-[minmax(0,1fr)_minmax(0,22rem)_minmax(0,17rem)]'
          : '@min-[52rem]:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]',
      ]"
    >
      <div class="flex min-w-0 items-start gap-3.5 p-4">
        <LeaderCard v-if="!isLine" :leader="leader" variant="detail" class="shrink-0" />
        <div class="flex min-w-0 flex-1 flex-col gap-1.5">
          <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <h1 class="min-w-0 truncate text-base font-semibold sm:text-lg">
              <span v-for="segment in titleSegments" :key="segment.key" :style="richNameSegmentStyle(segment)">{{ segment.text }}</span>
            </h1>
            <span
              v-if="status"
              :class="[
                'inline-flex shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium',
                status.tone === 'line'
                  ? 'border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100'
                  : status.tone === 'in'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                    : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100',
              ]"
            >
              {{ status.label }}
            </span>
          </div>
          <div class="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5 tabular-nums">
            <p class="text-3xl leading-none font-bold [overflow-wrap:anywhere] sm:text-4xl" data-testid="rank-detail-rank">{{ rankLabel }}</p>
            <p class="text-lg leading-tight font-semibold [overflow-wrap:anywhere] sm:text-xl" data-testid="rank-detail-score">{{ scoreLabel }}</p>
          </div>
          <p class="text-xs text-muted-foreground">{{ latestLabel }}</p>
          <p v-if="notRankedHint" class="text-xs text-amber-700 dark:text-amber-200">{{ notRankedHint }}</p>
          <p v-if="holderName" class="truncate text-xs text-muted-foreground">
            {{ t("rankBorder.detail.currentHolder", { name: holderName }) }}
          </p>
          <p
            v-if="profileWord"
            class="line-clamp-3 max-w-prose text-xs whitespace-pre-line text-muted-foreground [overflow-wrap:anywhere]"
            :title="t('rankBorder.overview.facts.profileWord')"
          >
            {{ profileWord }}
          </p>
          <div v-if="honors.length > 0" class="flex min-w-0 flex-wrap items-center gap-1.5 pt-0.5">
            <HonorBadge v-for="honor in honors" :key="honor.key" :honor="honor" variant="detail" />
          </div>
        </div>
      </div>

      <!-- Wide: neighbours and key lines sit in two columns beside the identity.
           In between they share one column; on a phone everything stacks. -->
      <div
        v-if="neighbours.length > 1 || lines.length > 0"
        class="flex min-w-0 flex-col gap-3 border-t border-border/60 p-4 @min-[52rem]:border-t-0 @min-[52rem]:border-l @min-[66rem]:contents"
      >
        <div v-if="neighbours.length > 1" class="flex min-w-0 flex-col gap-1 @min-[66rem]:border-l @min-[66rem]:border-border/60 @min-[66rem]:p-4">
          <h2 class="text-xs font-medium text-muted-foreground">{{ neighboursTitle }}</h2>
          <ul class="-mx-2 flex flex-col" data-testid="rank-detail-neighbours">
            <li v-for="row in neighbours" :key="row.key">
              <component
                :is="row.to ? 'RouterLink' : 'div'"
                :to="row.to ?? undefined"
                :class="[
                  'grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-x-2 rounded-md px-2 py-1.5',
                  row.current ? 'bg-muted/60' : '',
                  row.to ? 'transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none' : '',
                ]"
                :aria-current="row.current ? 'true' : undefined"
              >
                <span :class="['text-sm tabular-nums', row.current ? 'font-semibold' : 'text-muted-foreground']">{{ row.rankLabel }}</span>
                <span class="flex min-w-0 flex-col">
                  <span v-if="row.name" :class="['truncate text-sm', row.current ? 'font-semibold' : '']">{{ row.name }}</span>
                  <span v-if="row.note" class="truncate text-[11px] text-muted-foreground" :title="row.note">{{ row.note }}</span>
                </span>
                <span class="flex flex-col items-end tabular-nums">
                  <span :class="['text-sm', row.current ? 'font-semibold' : '']">{{ row.scoreLabel }}</span>
                  <span v-if="row.gapLabel" class="text-[11px] text-muted-foreground">{{ row.gapLabel }}</span>
                </span>
              </component>
            </li>
          </ul>
        </div>

        <div v-if="lines.length > 0" class="flex min-w-0 flex-col gap-1 @min-[66rem]:border-l @min-[66rem]:border-border/60 @min-[66rem]:p-4">
          <h2 class="text-xs font-medium text-muted-foreground">{{ t("rankBorder.detail.keyLines") }}</h2>
          <ul class="-mx-2 flex flex-col" data-testid="rank-detail-key-lines">
            <li v-for="line in lines" :key="line.key">
              <component
                :is="line.to ? 'RouterLink' : 'div'"
                :to="line.to ?? undefined"
                :class="[
                  'grid grid-cols-[3.25rem_minmax(0,1fr)] items-baseline gap-x-2 rounded-md px-2 py-1.5',
                  line.to ? 'transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none' : '',
                ]"
              >
                <span class="text-sm tabular-nums text-muted-foreground">{{ line.label }}</span>
                <span class="flex min-w-0 flex-col">
                  <span class="text-sm tabular-nums">{{ line.gapLabel }}</span>
                  <span v-if="line.note" class="truncate text-[11px] text-muted-foreground" :title="line.note">{{ line.note }}</span>
                </span>
              </component>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="$slots.default" class="flex flex-wrap items-center gap-2 border-t border-border/60 px-4 py-2">
      <slot />
    </div>
  </section>
</template>
