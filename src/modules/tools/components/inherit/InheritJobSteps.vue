<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleMinus,
  CircleX,
  Loader2,
} from "lucide-vue-next"
import { useNowTick } from "@/composables/useNowTick"
import {
  formatStepDuration,
  stepDurationMs,
  type InheritJob,
  type InheritJobStep,
} from "@/modules/tools/lib/inherit-job"

/** Every step of the job, in order, with its sub-steps, status and duration. */
const props = defineProps<{
  job: InheritJob
}>()

const { t, te } = useI18n()
const now = useNowTick(1000)

const STATUS_ICON = {
  pending: CircleDashed,
  running: Loader2,
  done: CircleCheck,
  failed: CircleX,
  skipped: CircleMinus,
  warning: CircleAlert,
} as const

const STATUS_CLASS: Record<string, string> = {
  pending: "text-muted-foreground/60",
  running: "text-primary animate-spin",
  done: "text-emerald-600 dark:text-emerald-400",
  failed: "text-destructive",
  skipped: "text-muted-foreground/60",
  warning: "text-amber-600 dark:text-amber-400",
}

function label(group: "steps" | "substeps", name: string): string {
  const key = `tools.uploadData.inheritJob.${group}.${name}`
  return te(key) ? t(key) : name
}

function statusLabel(status: string): string {
  const key = `tools.uploadData.inheritJob.stepStatus.${status}`
  return te(key) ? t(key) : status
}

function duration(step: Pick<InheritJobStep, "startedAt" | "finishedAt" | "status">): string {
  const ms = stepDurationMs(step, now.value)
  return ms == null ? "" : formatStepDuration(ms)
}

const rows = computed(() => props.job.steps.map((step) => ({
  step,
  // The executing call is where the entered code gets used up.
  marksConsumption: step.name === "execute",
  // A step that has not run shows nothing but its name.
  detailed: step.status !== "pending",
})))
</script>

<template>
  <ol class="space-y-1" data-testid="inherit-job-steps">
    <li
      v-for="{ step, marksConsumption, detailed } in rows"
      :key="step.name"
      :data-step="step.name"
      :data-status="step.status"
      :class="[
        'rounded-md px-2 py-1.5',
        step.status === 'running' ? 'bg-primary/5' : '',
        step.status === 'failed' ? 'bg-destructive/5' : '',
        marksConsumption ? 'mt-2 border-t border-dashed pt-2.5' : '',
      ]"
    >
      <p v-if="marksConsumption" class="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {{ t("tools.uploadData.inheritJob.consumesCode") }}
      </p>
      <div class="flex items-center gap-2.5">
        <component :is="STATUS_ICON[step.status]" :class="['size-4 shrink-0', STATUS_CLASS[step.status]]" aria-hidden="true" />
        <span :class="['min-w-0 flex-1 text-sm', step.status === 'pending' || step.status === 'skipped' ? 'text-muted-foreground' : 'font-medium']">
          {{ label("steps", step.name) }}
        </span>
        <span class="shrink-0 text-xs tabular-nums text-muted-foreground">
          <template v-if="detailed">
            <span class="sr-only">{{ statusLabel(step.status) }}</span>
            <span v-if="step.status === 'skipped' || step.status === 'failed'" aria-hidden="true">{{ statusLabel(step.status) }}</span>
            <span v-if="duration(step)" :class="step.status === 'failed' ? 'ms-1.5' : ''">{{ duration(step) }}</span>
          </template>
        </span>
      </div>
      <ul v-if="step.substeps.length" class="mt-1 space-y-0.5 ps-6.5">
        <li
          v-for="substep in step.substeps"
          :key="substep.name"
          :data-substep="substep.name"
          :data-status="substep.status"
          class="flex items-start gap-2 text-xs"
        >
          <component :is="STATUS_ICON[substep.status]" :class="['mt-px size-3.5 shrink-0', STATUS_CLASS[substep.status]]" aria-hidden="true" />
          <span class="min-w-0 flex-1">
            <span :class="substep.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'">{{ label("substeps", substep.name) }}</span>
            <span class="sr-only"> {{ statusLabel(substep.status) }}</span>
            <span v-if="substep.status === 'warning' || substep.status === 'failed'" class="ms-1 font-medium" :class="STATUS_CLASS[substep.status].replace(' animate-spin', '')">
              {{ statusLabel(substep.status) }}
            </span>
            <span v-if="substep.note" class="block break-words text-muted-foreground/80">{{ substep.note }}</span>
          </span>
        </li>
      </ul>
    </li>
  </ol>
</template>
