<script setup lang="ts">
import { computed } from "vue"
import { LucideCheckCircle2, LucideCircleAlert, LucideEyeOff } from "lucide-vue-next"

const props = defineProps<{
  status: string
  label: string
}>()

const tone = computed(() => {
  switch (props.status) {
    case "open":
      return "bg-destructive/15 text-destructive-tint-foreground"
    case "resolved":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
    default:
      return "bg-muted text-muted-foreground"
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
    <LucideCircleAlert v-if="props.status === 'open'" class="size-3 shrink-0" aria-hidden="true" />
    <LucideCheckCircle2 v-else-if="props.status === 'resolved'" class="size-3 shrink-0" aria-hidden="true" />
    <LucideEyeOff v-else class="size-3 shrink-0" aria-hidden="true" />
    {{ props.label }}
  </span>
</template>
