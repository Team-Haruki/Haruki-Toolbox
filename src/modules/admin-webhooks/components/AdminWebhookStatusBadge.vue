<script setup lang="ts">
import { LucideBan, LucideCheckCircle2 } from "lucide-vue-next"

const props = defineProps<{
  active: boolean
  label: string
}>()
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
      props.active
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    ]"
  >
    <LucideCheckCircle2 v-if="props.active" class="h-3.5 w-3.5 shrink-0" />
    <LucideBan v-else class="h-3.5 w-3.5 shrink-0" />
    {{ props.label }}
  </span>
</template>
