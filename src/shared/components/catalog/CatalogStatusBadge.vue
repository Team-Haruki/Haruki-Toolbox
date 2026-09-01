<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Badge, type BadgeVariants } from "@/components/ui/badge"
import { useNowTick } from "@/composables/useNowTick"
import type { CatalogStatus } from "./types"

/**
 * `upcoming | ongoing | ended` pill. With `untilMs` (start for upcoming, end
 * for ongoing) it appends a coarse "starts in 3h" / "2d 5h left" hint driven
 * by the shared 30 s clock — list tiles use this; detail pages use the 1 s
 * `CatalogCountdown`.
 */
const props = withDefaults(defineProps<{
  status: CatalogStatus
  untilMs?: number | null
  size?: BadgeVariants["size"]
}>(), {
  untilMs: null,
  size: "default",
})

const { t } = useI18n()
const now = useNowTick(30_000)

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

const hint = computed(() => {
  if (props.untilMs == null || props.status === "ended") {
    return null
  }
  const remaining = props.untilMs - now.value
  if (remaining <= 0) {
    return null
  }
  const totalHours = Math.floor(remaining / 3_600_000)
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  const minutes = Math.floor((remaining % 3_600_000) / 60_000)
  const parts: string[] = []
  if (days > 0) {
    parts.push(t("catalog.countdown.days", { days }))
  }
  if (days > 0 || hours > 0) {
    parts.push(t("catalog.countdown.hours", { hours }))
  }
  if (days === 0) {
    parts.push(t("catalog.countdown.minutes", { minutes }))
  }
  const time = parts.join(" ")
  return props.status === "ongoing"
    ? t("catalog.status.endsIn", { time })
    : t("catalog.status.startsIn", { time })
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
    <span v-if="hint" class="font-normal opacity-80 tabular-nums">· {{ hint }}</span>
  </Badge>
</template>
