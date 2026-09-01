<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Badge, type BadgeVariants } from "@/components/ui/badge"
import type { CatalogStatus } from "./types"

const props = withDefaults(defineProps<{
  status: CatalogStatus
  size?: BadgeVariants["size"]
}>(), {
  size: "default",
})

const { t } = useI18n()

const variant = computed<BadgeVariants["variant"]>(() => {
  switch (props.status) {
    case "ongoing":
      return "emerald"
    case "upcoming":
      return "amber"
    default:
      return "muted"
  }
})
</script>

<template>
  <Badge :variant="variant" :size="size" data-slot="catalog-status-badge">
    <span
      v-if="status === 'ongoing'"
      class="relative flex size-1.5"
      aria-hidden="true"
    >
      <span class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
      <span class="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
    </span>
    {{ t(`catalog.status.${status}`) }}
  </Badge>
</template>
