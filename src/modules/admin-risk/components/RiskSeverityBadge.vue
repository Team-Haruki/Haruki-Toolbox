<script setup lang="ts">
import { computed, type Component } from "vue"
import { useI18n } from "vue-i18n"
import {
  LucideChevronDown,
  LucideChevronsUp,
  LucideChevronUp,
  LucideMinus,
  LucideOctagonAlert,
} from "lucide-vue-next"
import { isRiskSeverity, type RiskSeverityTone, riskSeverityTone } from "@/modules/admin-risk/lib/event-stats"

/** A severity as a tinted chip with its own icon; an unknown severity shows its raw value. */
const props = defineProps<{
  severity: string
}>()

const { t } = useI18n()

const TONE_CLASS: Record<RiskSeverityTone, string> = {
  danger: "bg-destructive/15 text-destructive-tint-foreground",
  warning: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  info: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  neutral: "bg-muted text-muted-foreground",
}

const ICONS: Record<string, Component> = {
  critical: LucideOctagonAlert,
  high: LucideChevronsUp,
  medium: LucideChevronUp,
  low: LucideChevronDown,
}

const label = computed(() => (isRiskSeverity(props.severity) ? t(`adminRisk.severity.${props.severity}`) : props.severity || t("adminRisk.common.fallback")))
const icon = computed(() => (isRiskSeverity(props.severity) ? ICONS[props.severity] : LucideMinus))
</script>

<template>
  <span :class="['inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', TONE_CLASS[riskSeverityTone(props.severity)]]">
    <component :is="icon" class="size-3 shrink-0" aria-hidden="true" />
    <span class="min-w-0 truncate">{{ label }}</span>
  </span>
</template>
