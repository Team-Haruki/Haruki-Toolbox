<script setup lang="ts">
import { computed } from "vue"
import { LucideAlertTriangle, LucideCheckCircle2, LucideEyeOff } from "lucide-vue-next"

const props = defineProps<{
  status: string
  label: string
}>()

const tone = computed(() => {
  switch (props.status) {
    case "open":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    case "resolved":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
  }
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
      tone,
    ]"
  >
    <LucideAlertTriangle v-if="props.status === 'open'" class="h-3 w-3 shrink-0" />
    <LucideCheckCircle2 v-else-if="props.status === 'resolved'" class="h-3 w-3 shrink-0" />
    <LucideEyeOff v-else class="h-3 w-3 shrink-0" />
    {{ props.label }}
  </span>
</template>
