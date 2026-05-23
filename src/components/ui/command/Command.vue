<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { computed, provide, ref } from "vue"
import { cn } from "@/lib/utils"
import { COMMAND_CONTEXT_KEY } from "./context"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()

const search = ref("")
const visibleCount = ref(0)

function updateVisibleCount(previous: number, next: number) {
  visibleCount.value += next - previous
}

provide(COMMAND_CONTEXT_KEY, {
  search,
  visibleCount: computed(() => visibleCount.value),
  updateVisibleCount,
})
</script>

<template>
  <div
    data-slot="command"
    :class="cn('flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground', props.class)"
  >
    <slot />
  </div>
</template>
