<script setup lang="ts">
import { LucideCheck, LucideX } from "lucide-vue-next"
import { useI18n } from "vue-i18n"

/**
 * The success / failure chip of a log row (system logs and upload logs): a
 * small tinted pill with an icon and the word, so the state never rests on
 * colour alone.
 */
defineProps<{
  success: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <span
    :class="[
      'inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs leading-4 font-medium whitespace-nowrap',
      success
        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
        : 'bg-destructive/15 text-destructive-tint-foreground',
    ]"
    :data-result="success ? 'success' : 'failure'"
    data-slot="logs-result-chip"
  >
    <LucideCheck v-if="success" class="size-3 shrink-0" aria-hidden="true" />
    <LucideX v-else class="size-3 shrink-0" aria-hidden="true" />
    {{ success ? t("adminStatistics.common.success") : t("adminStatistics.common.failure") }}
  </span>
</template>
