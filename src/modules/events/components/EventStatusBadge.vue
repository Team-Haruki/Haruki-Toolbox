<script setup lang="ts">
import type { BadgeVariants } from "@/components/ui/badge"
import CatalogStatusBadge from "@/shared/components/catalog/CatalogStatusBadge.vue"
import type { SekaiEventStatus } from "@/modules/events/lib/event-filter"

/**
 * Event status pill for pickers outside the catalog (deck recommend). The
 * catalog pages use `CatalogStatusBadge` directly; this keeps the legacy
 * contract where `upcoming` renders nothing because the unreleased badge
 * already covers that state.
 */
withDefaults(defineProps<{
  status: SekaiEventStatus
  untilMs?: number | null
  size?: BadgeVariants["size"]
}>(), {
  untilMs: null,
  size: "default",
})
</script>

<template>
  <CatalogStatusBadge v-if="status !== 'upcoming'" :status="status" :until-ms="untilMs" :size="size" />
</template>
