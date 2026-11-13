<script setup lang="ts">
import { LucideX } from "lucide-vue-next"

/**
 * One filter term as a pill that removes itself when pressed. The pill keeps
 * its compact height; on touch the button around it grows to 40 px.
 */
defineProps<{
  label: string
  /** What pressing it does, e.g. "Remove filter “x”" */
  removeLabel: string
}>()

const emit = defineEmits<{ remove: [event: MouseEvent] }>()
</script>

<template>
  <button
    type="button"
    class="group inline-flex max-w-full min-w-0 items-center rounded-full outline-none pointer-coarse:min-h-10"
    :aria-label="removeLabel"
    @click="emit('remove', $event)"
  >
    <span
      class="inline-flex h-7 max-w-full min-w-0 items-center gap-1 rounded-full bg-primary/10 pr-2 pl-2.5 text-xs font-medium text-primary transition-colors group-hover:bg-primary/15 group-focus-visible:ring-[3px] group-focus-visible:ring-ring/50 motion-reduce:transition-none"
    >
      <span class="truncate">{{ label }}</span>
      <LucideX class="size-3.5 shrink-0" aria-hidden="true" />
    </span>
  </button>
</template>
