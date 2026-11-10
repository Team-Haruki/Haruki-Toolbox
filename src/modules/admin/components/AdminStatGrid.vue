<script setup lang="ts">
/**
 * The frame for a row of `AdminStatTile`s: one bordered panel, hairlines
 * between the tiles, columns that follow the panel's own width (so it fits
 * beside the admin nav and on a phone without per-page breakpoints).
 *
 *   <AdminStatGrid :columns="4">
 *     <AdminStatTile … /> <AdminStatTile … /> …
 *   </AdminStatGrid>
 *
 * `columns` is the most it shows across: 2, 3, 4, 5 or 6. A phone-wide
 * panel still gets two across, or four to eight tiles would stack a screen
 * tall before the page's content starts; the tiles tighten themselves below
 * 28rem to fit (see `AdminStatTile`).
 */
withDefaults(defineProps<{
  columns?: 2 | 3 | 4 | 5 | 6
}>(), {
  columns: 4,
})

// Literal class strings, so Tailwind sees them.
const COLUMN_CLASS: Record<number, string> = {
  2: "@min-[18rem]:grid-cols-2",
  3: "@min-[18rem]:grid-cols-2 @min-[46rem]:grid-cols-3",
  4: "@min-[18rem]:grid-cols-2 @min-[56rem]:grid-cols-4",
  5: "@min-[18rem]:grid-cols-2 @min-[46rem]:grid-cols-3 @min-[64rem]:grid-cols-5",
  6: "@min-[18rem]:grid-cols-2 @min-[46rem]:grid-cols-3 @min-[64rem]:grid-cols-6",
}
</script>

<template>
  <div class="@container" data-slot="admin-stat-grid">
    <!-- The gaps show the border colour through: hairlines without knowing which tile is last in a row. -->
    <div :class="['grid grid-cols-1 gap-px overflow-hidden rounded-xl border bg-border', COLUMN_CLASS[columns]]">
      <slot />
    </div>
  </div>
</template>
