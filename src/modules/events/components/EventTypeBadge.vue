<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import type { SekaiEventType } from "../lib/event-filter"

const props = defineProps<{
  eventType: SekaiEventType | null
}>()

const { t } = useI18n()

const badgeClass = computed(() => {
  if (props.eventType === "marathon") {
    return "bg-violet-500/15 text-violet-700 dark:text-violet-300"
  }

  if (props.eventType === "cheerful_carnival") {
    return "bg-orange-500/15 text-orange-700 dark:text-orange-300"
  }

  if (props.eventType === "world_bloom") {
    return "bg-sky-500/15 text-sky-700 dark:text-sky-300"
  }

  return "bg-muted text-muted-foreground"
})

const label = computed(() => t(`events.type.${props.eventType ?? "unknown"}`))
</script>

<template>
  <span :class="['inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', badgeClass]">
    {{ label }}
  </span>
</template>
