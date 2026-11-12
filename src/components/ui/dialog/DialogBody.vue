<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

/** The part of a dialog that scrolls, between a `DialogHeader` and a `DialogFooter` that do not. */
const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div
    data-slot="dialog-body"
    :class="cn('grid min-h-0 flex-1 grid-cols-1 content-start gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5', props.class)"
  >
    <slot />
  </div>
</template>
