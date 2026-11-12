<script setup lang="ts">
export type DetailInsightRow = {
  key: string
  label: string
  value: string
  /** A short qualifier after the value, e.g. a time or a share. */
  note?: string | null
  /** Longer explanation, shown as the row's title. */
  hint?: string | null
}

export type DetailInsightGroup = {
  key: string
  title: string
  /** The group's main figure, set larger than the rows under it. */
  headline: DetailInsightRow
  rows: DetailInsightRow[]
}

/**
 * The detail page's figures, grouped by the question they answer (how fast,
 * how much per game, where in the ranking, how long at it) instead of a flat
 * wall of tiles. Each group leads with one figure and lists the rest under it.
 */
defineProps<{
  title: string
  caption: string
  groups: readonly DetailInsightGroup[]
}>()
</script>

<template>
  <section class="@container rounded-xl border bg-card" data-testid="rank-detail-insights">
    <header class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-4 pt-3">
      <h2 class="text-sm font-semibold">{{ title }}</h2>
      <p class="text-xs text-muted-foreground">{{ caption }}</p>
    </header>
    <div
      class="grid gap-x-8 gap-y-5 px-4 pt-3 pb-4 @min-[30rem]:grid-cols-2 @min-[68rem]:grid-cols-[repeat(var(--insight-groups),minmax(0,1fr))]"
      :style="{ '--insight-groups': groups.length }"
    >
      <div v-for="group in groups" :key="group.key" class="flex min-w-0 flex-col" :data-insight-group="group.key">
        <h3 class="text-xs font-medium text-muted-foreground">{{ group.title }}</h3>
        <div class="mt-1 flex min-w-0 flex-col pb-2" :title="group.headline.hint ?? undefined">
          <p class="truncate text-xl leading-tight font-semibold tabular-nums">{{ group.headline.value }}</p>
          <p class="truncate text-[11px] text-muted-foreground">
            {{ group.headline.label }}<template v-if="group.headline.note"> · {{ group.headline.note }}</template>
          </p>
        </div>
        <dl class="divide-y divide-border/60 border-t border-border/60">
          <div
            v-for="row in group.rows"
            :key="row.key"
            class="flex items-baseline justify-between gap-3 py-1.5"
            :title="row.hint ?? undefined"
          >
            <dt class="min-w-0 truncate text-xs text-muted-foreground">{{ row.label }}</dt>
            <dd class="flex shrink-0 items-baseline gap-1.5 text-right text-sm font-medium tabular-nums">
              <span v-if="row.note" class="text-[11px] font-normal text-muted-foreground">{{ row.note }}</span>
              {{ row.value }}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>
