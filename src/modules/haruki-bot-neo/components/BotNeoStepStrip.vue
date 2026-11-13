<script setup lang="ts">
/**
 * The three registration steps as one quiet line at the top of the panel:
 * finished steps get a check, the current one is named in full. On a narrow
 * panel only the current step keeps its name.
 */
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Check } from "lucide-vue-next"
import { BOT_NEO_STEPS, resolveStepState, type BotNeoStep } from "@/modules/haruki-bot-neo/lib/registration"

const props = defineProps<{
  current: BotNeoStep
}>()

const { t } = useI18n()

const steps = computed(() => BOT_NEO_STEPS.map((step, index) => ({
  step,
  number: index + 1,
  label: t(`botNeo.steps.${step}`),
  state: resolveStepState(step, props.current),
})))
</script>

<template>
  <ol
    class="flex items-center gap-2 px-4 py-3 text-xs"
    :aria-label="t('botNeo.steps.label')"
    data-testid="bot-neo-steps"
  >
    <li
      v-for="item in steps"
      :key="item.step"
      :class="['flex min-w-0 items-center gap-2', item.number < steps.length ? 'flex-1' : '']"
      :aria-current="item.state === 'current' ? 'step' : undefined"
      :data-step="item.step"
      :data-state="item.state"
    >
      <span
        :class="[
          'flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums',
          item.state === 'upcoming' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary',
        ]"
        aria-hidden="true"
      >
        <Check v-if="item.state === 'done'" class="size-3" />
        <template v-else>{{ item.number }}</template>
      </span>
      <span
        :class="[
          'truncate',
          item.state === 'current' ? 'font-medium text-foreground' : 'sr-only text-muted-foreground @min-[24rem]:not-sr-only',
        ]"
      >
        {{ item.label }}
      </span>
      <span v-if="item.number < steps.length" class="h-px min-w-3 flex-1 bg-border" aria-hidden="true" />
    </li>
  </ol>
</template>
