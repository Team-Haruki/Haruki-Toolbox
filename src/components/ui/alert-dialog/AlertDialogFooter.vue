<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div
    data-slot="alert-dialog-footer"
    :class="
      cn(
        'flex flex-wrap items-center justify-end gap-2 [&>button]:flex-1 sm:[&>button]:flex-none',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
