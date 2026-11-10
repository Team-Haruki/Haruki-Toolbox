<script setup lang="ts" generic="T extends string">
/**
 * A single choice shown as cards: one native radio per option, so the group
 * keeps arrow-key navigation and the browser's own semantics.
 *
 *   <ChoiceCards v-model="mode" name="upload-mode" :label="…" :options="[{ value, label, hint }]" columns="2" />
 *
 * `compact` drops the hint line and lays the options out as a wrapping row
 * of chips, each as wide as its name.
 */
import type { Component } from "vue"

export interface ChoiceOption<V extends string = string> {
  value: V
  label: string
  hint?: string
  icon?: Component
  disabled?: boolean
}

withDefaults(defineProps<{
  /** Names the group for assistive tech; shown only when `showLabel` is set. */
  label: string
  name: string
  options: readonly ChoiceOption<T>[]
  /** Grid classes for the cards (how many sit side by side); unused when `compact`. */
  gridClass?: string
  compact?: boolean
}>(), {
  gridClass: "grid-cols-1 @min-[30rem]:grid-cols-2",
  compact: false,
})

const model = defineModel<T>({ required: true })

defineEmits<{ change: [value: T] }>()
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    :class="[compact ? 'flex flex-wrap gap-2' : ['grid gap-2', gridClass]]"
    data-slot="choice-cards"
  >
    <label
      v-for="option in options"
      :key="option.value"
      :class="[
        'flex min-w-0 items-start gap-2.5 rounded-lg border transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50',
        compact ? 'items-center px-3 py-1.5 pointer-coarse:min-h-10' : 'p-3',
        option.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        model === option.value ? 'border-primary bg-primary/5' : option.disabled ? 'bg-muted/20' : 'bg-muted/20 hover:bg-muted/50',
      ]"
    >
      <input
        v-model="model"
        type="radio"
        :name="name"
        :value="option.value"
        :disabled="option.disabled"
        :class="['size-4 shrink-0 accent-primary', compact ? '' : 'mt-0.5']"
        @change="$emit('change', option.value)"
      >
      <span class="min-w-0 flex-1">
        <span class="flex items-center gap-1.5 text-sm font-medium">
          <component :is="option.icon" v-if="option.icon" class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span :class="compact ? 'whitespace-nowrap' : 'min-w-0 break-words'">{{ option.label }}</span>
        </span>
        <span v-if="option.hint && !compact" class="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{{ option.hint }}</span>
      </span>
    </label>
  </div>
</template>
