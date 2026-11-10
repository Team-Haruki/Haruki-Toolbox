<script setup lang="ts">
/**
 * The one character tile every training tab uses: avatar, name, an optional
 * headline number on the right, and whatever the tab adds underneath (meter
 * rows, a footnote). The left edge carries the character colour so a grid
 * sorted by character reads unit by unit.
 */
defineProps<{
  name: string
  iconUrl: string | null
  color: string | null
  /** Headline figure on the name line, already formatted. */
  value?: string | null
  /** No data for this character yet. */
  dimmed?: boolean
}>()
</script>

<template>
  <div
    :class="['flex items-start gap-2.5 rounded-lg border border-l-4 bg-card p-2.5', dimmed ? 'opacity-50' : '']"
    :style="color ? { borderLeftColor: color } : {}"
    data-slot="training-tile"
  >
    <img v-if="iconUrl" :src="iconUrl" alt="" class="size-9 shrink-0 rounded-full" loading="lazy" decoding="async">
    <span v-else class="size-9 shrink-0 rounded-full bg-muted" />
    <div class="min-w-0 flex-1">
      <div class="flex items-baseline justify-between gap-2">
        <p class="min-w-0 truncate text-sm font-medium" :title="name">{{ name }}</p>
        <p v-if="value" class="shrink-0 text-sm font-semibold tabular-nums">{{ value }}</p>
      </div>
      <slot />
    </div>
  </div>
</template>
