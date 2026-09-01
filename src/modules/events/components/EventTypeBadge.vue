<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Badge, type BadgeVariants } from "@/components/ui/badge"
import { resolveSekaiEventTypeLabel } from "@/shared/sekai/labels"
import type { SekaiEventType } from "@/modules/events/lib/event-filter"

const props = withDefaults(defineProps<{
  eventType: SekaiEventType | null
  size?: BadgeVariants["size"]
}>(), {
  size: "default",
})

const { t, te } = useI18n()

const variant = computed<BadgeVariants["variant"]>(() => {
  switch (props.eventType) {
    case "marathon":
      return "violet"
    case "cheerful_carnival":
      return "orange"
    case "world_bloom":
      return "sky"
    default:
      return "muted"
  }
})

const label = computed(() => resolveSekaiEventTypeLabel({ t, te }, props.eventType))
</script>

<template>
  <Badge :variant="variant" :size="size" data-slot="event-type-badge">{{ label }}</Badge>
</template>
