<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { computed, inject, ref } from "vue"
import { cn } from "@/lib/utils"
import { COMMAND_CONTEXT_KEY } from "./context"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()

const commandContext = inject(COMMAND_CONTEXT_KEY)
const visibleCount = ref(0)
const updateVisibleCount = (previous: number, next: number) => {
  visibleCount.value += next - previous
}

if (commandContext) {
  commandContext.visibleCount = computed(() => visibleCount.value)
  commandContext.updateVisibleCount = updateVisibleCount
}
</script>

<template>
  <div
    data-slot="command-list"
    role="listbox"
    :class="cn('max-h-72 overflow-y-auto overflow-x-hidden', props.class)"
  >
    <slot />
  </div>
</template>
