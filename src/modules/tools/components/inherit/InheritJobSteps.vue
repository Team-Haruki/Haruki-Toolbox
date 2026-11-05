<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleHelp,
  CircleMinus,
  CircleX,
  Loader2,
  LucideChevronDown,
} from "lucide-vue-next"
import { useNowTick } from "@/composables/useNowTick"
import {
  formatStepDuration,
  splitUnreachedSteps,
  stepDurationMs,
  type InheritJob,
  type InheritJobStep,
} from "@/modules/tools/lib/inherit-job"

/**
 * Every step of the job, in order, with its sub-steps, status and duration.
 * `frozen` is for a record that expired while a step was running: its clock
 * stops and the running step reads as unknown instead of spinning on.
 */
const props = withDefaults(defineProps<{
  job: InheritJob
  frozen?: boolean
}>(), {
  frozen: false,
})

const { t, te } = useI18n()
const now = useNowTick(1000)

// The instant the record expired: durations stop there.
const frozenAt = ref<number | null>(null)
watch(() => props.frozen, (frozen) => {
  frozenAt.value = frozen ? (frozenAt.value ?? Date.now()) : null
}, { immediate: true })
const clock = computed(() => frozenAt.value ?? now.value)

const STATUS_ICON = {
  pending: CircleDashed,
  running: Loader2,
  done: CircleCheck,
  failed: CircleX,
  skipped: CircleMinus,
  warning: CircleAlert,
  unknown: CircleHelp,
} as const

const STATUS_CLASS: Record<string, string> = {
  pending: "text-muted-foreground/60",
  running: "text-primary animate-spin",
  done: "text-emerald-600 dark:text-emerald-400",
  failed: "text-destructive",
  skipped: "text-muted-foreground/60",
  warning: "text-amber-600 dark:text-amber-400",
  unknown: "text-muted-foreground",
}

/** What a step reads as: a running step of an expired record has no known outcome. */
function shownStatus(status: string): keyof typeof STATUS_ICON {
  if (props.frozen && status === "running") return "unknown"
  return status as keyof typeof STATUS_ICON
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
  // How long an expired record's running step took is unknowable.
  if (props.frozen && step.status === "running") return ""
  const ms = stepDurationMs(step, clock.value)
  return ms == null ? "" : formatStepDuration(ms)
}

// A stopped job folds the steps it never reached behind one line.
const split = computed(() => splitUnreachedSteps(props.job))
const unreachedOpen = ref(false)
const visibleSteps = computed(() => unreachedOpen.value ? props.job.steps : split.value.shown)

const rows = computed(() => visibleSteps.value.map((step) => ({
  step,
  status: shownStatus(step.status),
  // The executing call is where the entered code gets used up.
  marksConsumption: step.name === "execute",
  // A step that has not run shows nothing but its name.
  detailed: step.status !== "pending",
})))
</script>

<template>
  <ol class="space-y-1" data-testid="inherit-job-steps">
    <li
      v-for="{ step, status, marksConsumption, detailed } in rows"
      :key="step.name"
      :data-step="step.name"
      :data-status="step.status"
      :class="[
        'rounded-md px-2 py-1.5',
        status === 'running' ? 'bg-primary/5' : '',
        status === 'failed' ? 'bg-destructive/5' : '',
        marksConsumption ? 'mt-2 border-t border-dashed pt-2.5' : '',
      ]"
    >
      <p v-if="marksConsumption" class="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {{ t("tools.uploadData.inheritJob.consumesCode") }}
      </p>
      <div class="flex items-center gap-2.5">
        <component :is="STATUS_ICON[status]" :class="['size-4 shrink-0', STATUS_CLASS[status]]" aria-hidden="true" />
        <span :class="['min-w-0 flex-1 text-sm', status === 'pending' || status === 'skipped' ? 'text-muted-foreground' : 'font-medium']">
          {{ label("steps", step.name) }}
        </span>
        <span class="shrink-0 text-xs tabular-nums text-muted-foreground">
          <template v-if="detailed">
            <span class="sr-only">{{ statusLabel(status) }}</span>
            <span v-if="status === 'skipped' || status === 'failed' || status === 'unknown'" aria-hidden="true">{{ statusLabel(status) }}</span>
            <span v-if="duration(step)" :class="status === 'failed' ? 'ms-1.5' : ''">{{ duration(step) }}</span>
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
          <component :is="STATUS_ICON[shownStatus(substep.status)]" :class="['mt-px size-3.5 shrink-0', STATUS_CLASS[shownStatus(substep.status)]]" aria-hidden="true" />
          <span class="min-w-0 flex-1">
            <span :class="substep.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'">{{ label("substeps", substep.name) }}</span>
            <span class="sr-only"> {{ statusLabel(shownStatus(substep.status)) }}</span>
            <span v-if="substep.status === 'warning' || substep.status === 'failed'" class="ms-1 font-medium" :class="STATUS_CLASS[substep.status].replace(' animate-spin', '')">
              {{ statusLabel(substep.status) }}
            </span>
            <span v-if="substep.note" class="block break-words text-muted-foreground/80">{{ substep.note }}</span>
          </span>
        </li>
      </ul>
    </li>
    <li v-if="split.hidden.length" class="px-2 pt-1" data-testid="inherit-job-unreached">
      <button
        type="button"
        class="inline-flex min-h-8 items-center gap-1.5 rounded-md text-xs text-muted-foreground underline-offset-4 hover:underline pointer-coarse:min-h-10"
        :aria-expanded="unreachedOpen"
        @click="unreachedOpen = !unreachedOpen"
      >
        <LucideChevronDown :class="['size-3.5 transition-transform duration-200', unreachedOpen ? 'rotate-180' : '']" aria-hidden="true" />
        {{ unreachedOpen
          ? t("tools.uploadData.inheritJob.unreached.hide", { count: split.hidden.length }, split.hidden.length)
          : t("tools.uploadData.inheritJob.unreached.show", { count: split.hidden.length }, split.hidden.length) }}
      </button>
    </li>
  </ol>
</template>
