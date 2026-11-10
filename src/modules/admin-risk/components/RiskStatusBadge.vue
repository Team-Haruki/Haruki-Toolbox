<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideCheckCircle2, LucideCircleAlert, LucideCircleHelp } from "lucide-vue-next"

/** Open / resolved as a tinted chip; an unknown status shows its raw value. */
const props = defineProps<{
  status: string
}>()

const { t } = useI18n()

const label = computed(() =>
  props.status === "open" || props.status === "resolved"
    ? t(`adminRisk.status.${props.status}`)
    : props.status || t("adminRisk.common.fallback")
)
</script>

<template>
  <span
    :class="[
      'inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
      props.status === 'open'
        ? 'bg-destructive/15 text-destructive-tint-foreground'
        : props.status === 'resolved'
          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
          : 'bg-muted text-muted-foreground',
    ]"
  >
    <LucideCircleAlert v-if="props.status === 'open'" class="size-3 shrink-0" aria-hidden="true" />
    <LucideCheckCircle2 v-else-if="props.status === 'resolved'" class="size-3 shrink-0" aria-hidden="true" />
    <LucideCircleHelp v-else class="size-3 shrink-0" aria-hidden="true" />
    <span class="min-w-0 truncate">{{ label }}</span>
  </span>
</template>
