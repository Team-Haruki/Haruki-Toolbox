<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div
    data-slot="dialog-header"
    :class="cn('flex shrink-0 flex-col gap-1 border-b border-border/60 py-3 pr-12 pl-4 text-left sm:pl-5', props.class)"
  >
    <slot />
  </div>
</template>
