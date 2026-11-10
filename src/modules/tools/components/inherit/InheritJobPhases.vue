<script setup lang="ts">
/**
 * Where a transfer job stands, in the four phases its owner cares about. The
 * step-by-step log under it carries the detail; this strip answers "how far
 * along am I" at a glance.
 */
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Check, Loader2, Minus, X } from "lucide-vue-next"
import { summarizeJobPhases, type InheritJob, type InheritJobPhaseStatus } from "@/modules/tools/lib/inherit-job"

const props = defineProps<{
  job: InheritJob
}>()

const { t } = useI18n()
const phases = computed(() => summarizeJobPhases(props.job))

const DOT_CLASS: Record<InheritJobPhaseStatus, string> = {
  pending: "border-border bg-card text-muted-foreground",
  running: "border-primary bg-primary text-primary-foreground",
  done: "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500",
  failed: "border-destructive bg-destructive text-white",
  stopped: "border-border bg-muted text-muted-foreground",
}
</script>

<template>
  <ol class="grid grid-cols-4 pb-2" :aria-label="t('tools.uploadData.inheritJob.phases.label')" data-testid="inherit-job-phases">
    <li
      v-for="(phase, index) in phases"
      :key="phase.key"
      class="relative flex min-w-0 flex-col items-center gap-1.5 px-1 text-center"
      :data-phase="phase.key"
      :data-status="phase.status"
      :aria-current="phase.status === 'running' ? 'step' : undefined"
    >
      <!-- The line to the previous phase: filled once that phase is done. -->
      <span
        v-if="index > 0"
        :class="[
          'absolute right-1/2 top-3.5 -z-0 h-0.5 w-full -translate-y-1/2',
          phases[index - 1].status === 'done' ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-border',
        ]"
        aria-hidden="true"
      />
      <span
        :class="['relative z-10 flex size-7 items-center justify-center rounded-full border text-xs font-semibold tabular-nums', DOT_CLASS[phase.status]]"
        aria-hidden="true"
      >
        <Check v-if="phase.status === 'done'" class="size-4" />
        <Loader2 v-else-if="phase.status === 'running'" class="size-4 animate-spin" />
        <X v-else-if="phase.status === 'failed'" class="size-4" />
        <Minus v-else-if="phase.status === 'stopped'" class="size-4" />
        <template v-else>{{ index + 1 }}</template>
      </span>
      <span
        :class="[
          'text-xs leading-tight',
          phase.status === 'pending' || phase.status === 'stopped' ? 'text-muted-foreground' : 'font-medium',
          phase.status === 'failed' ? 'text-destructive' : '',
        ]"
      >
        {{ t(`tools.uploadData.inheritJob.phases.${phase.key}`) }}
        <span class="sr-only">{{ t(`tools.uploadData.inheritJob.phases.status.${phase.status}`) }}</span>
      </span>
    </li>
  </ol>
</template>
