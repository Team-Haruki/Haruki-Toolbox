<script setup lang="ts">
import StationBlockedList from "@/modules/sekai-station/components/StationBlockedList.vue"
import StationDisplaySettings from "@/modules/sekai-station/components/StationDisplaySettings.vue"
import StationFilterSettings from "@/modules/sekai-station/components/StationFilterSettings.vue"

/**
 * Everything that changes what the list shows, as one plain column (the
 * Station author prefers that over tabs): the filter, the room numbers
 * hidden for now, and the display options. `panel` is the column beside the
 * list (its own padding, hairlines edge to edge); `dialog` sits inside a
 * `DialogBody`, which already has the padding.
 */
withDefaults(defineProps<{ layout?: "panel" | "dialog" }>(), { layout: "panel" })
</script>

<template>
  <div
    :class="[
      'flex min-w-0 flex-col divide-y divide-border/60',
      layout === 'panel' ? '*:p-4' : '*:py-4 *:first:pt-0 *:last:pb-0',
    ]"
    data-slot="station-controls"
  >
    <StationFilterSettings :heading="layout === 'panel' ? 'h2' : 'h3'" />
    <StationBlockedList :heading="layout === 'panel' ? 'h2' : 'h3'" data-station-section="blocked" />
    <StationDisplaySettings :heading="layout === 'panel' ? 'h2' : 'h3'" />
  </div>
</template>
