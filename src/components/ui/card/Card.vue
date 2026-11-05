<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

/**
 * `size="compact"` is the one sanctioned dense card (`rounded-lg py-4 gap-4`,
 * 16 px side padding) instead of per-call `rounded-lg py-0 gap-0` overrides.
 * The size travels as `data-size`, so CardHeader / CardContent / CardFooter
 * pick the matching padding without a prop of their own (via `in-data-*`
 * variants: the nearest Card is the one that matters, so do not nest a
 * default card inside a compact one). `default` is the unchanged shadcn card.
 */
const props = withDefaults(defineProps<{
  class?: HTMLAttributes["class"]
  size?: "default" | "compact"
}>(), {
  size: "default",
})
</script>

<template>
  <div
    data-slot="card"
    :data-size="size"
    :class="
      cn(
        'bg-card text-card-foreground flex flex-col border shadow-sm',
        size === 'compact' ? 'gap-4 rounded-lg py-4' : 'gap-6 rounded-xl py-6',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
