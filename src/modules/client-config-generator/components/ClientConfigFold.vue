<script setup lang="ts">
/**
 * A folded group of rarely changed options: a whole-width button naming the
 * group, a tag when something in it differs from the defaults, and the
 * fields under it once opened.
 */
import { useId } from "vue"
import { useI18n } from "vue-i18n"
import { ChevronDown } from "lucide-vue-next"

defineProps<{
  title: string
  /** How many fields of the group differ from the defaults. */
  changed: number
}>()

const open = defineModel<boolean>("open", { default: false })

const { t } = useI18n()
const bodyId = useId()
</script>

<template>
  <div :data-open="open">
    <button
      type="button"
      class="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none motion-reduce:transition-none"
      :aria-expanded="open"
      :aria-controls="bodyId"
      @click="open = !open"
    >
      <span class="min-w-0 flex-1 text-sm font-medium">{{ title }}</span>
      <span
        v-if="changed > 0"
        class="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-primary"
        data-testid="client-config-fold-changed"
      >
        {{ t("tools.clientConfigGenerator.sections.advanced.changed", { count: changed }) }}
      </span>
      <ChevronDown
        :class="['size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none', open ? 'rotate-180' : '']"
        aria-hidden="true"
      />
    </button>
    <div v-show="open" :id="bodyId" class="grid gap-4 px-4 pt-1 pb-4">
      <slot />
    </div>
  </div>
</template>
