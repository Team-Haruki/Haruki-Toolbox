<script setup lang="ts">
import { cn } from "@/lib/utils"

const props = withDefaults(defineProps<{
  class?: string
}>(), {
  class: undefined,
})
</script>

<template>
  <dl :class="cn('grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2.5 text-sm', props.class)" data-slot="catalog-info-list">
    <slot />
  </dl>
</template>
