<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { computed, inject, onBeforeUnmount, provide, ref, watch } from "vue"
import { cn } from "@/lib/utils"
import { COMMAND_CONTEXT_KEY, COMMAND_GROUP_CONTEXT_KEY } from "./context"

const props = defineProps<{
  heading?: string
  class?: HTMLAttributes["class"]
}>()

const commandContext = inject(COMMAND_CONTEXT_KEY)
const visibleCount = ref(0)
const registerItem = (visible: boolean) => {
  if (visible) {
    visibleCount.value += 1
  }
}
const updateItemVisibility = (previous: boolean, next: boolean) => {
  if (previous === next) {
    return
  }

  visibleCount.value += next ? 1 : -1
}
const unregisterItem = (visible: boolean) => {
  if (visible) {
    visibleCount.value -= 1
  }
}

provide(COMMAND_GROUP_CONTEXT_KEY, {
  registerItem,
  updateItemVisibility,
  unregisterItem,
})

watch(
  visibleCount,
  (next, previous) => {
    commandContext?.updateVisibleCount?.(previous, next)
  },
  { flush: "sync" },
)

onBeforeUnmount(() => {
  commandContext?.updateVisibleCount?.(visibleCount.value, 0)
})

const hasVisibleItems = computed(() => visibleCount.value > 0)
</script>

<template>
  <div
    v-show="hasVisibleItems"
    data-slot="command-group"
    :class="cn('overflow-hidden p-1 text-foreground', props.class)"
  >
    <div
      v-if="props.heading"
      data-slot="command-group-heading"
      class="px-2 py-1.5 text-xs font-medium text-muted-foreground"
    >
      {{ props.heading }}
    </div>
    <div role="group">
      <slot />
    </div>
  </div>
</template>
