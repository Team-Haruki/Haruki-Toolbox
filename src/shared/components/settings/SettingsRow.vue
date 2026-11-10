<script setup lang="ts">
/**
 * One line of a `SettingsGroup`: an icon, a label with its help text, and a
 * control on the right.
 *
 *   <SettingsRow :icon="Languages" :label="…" :help="…" label-for="x" stack>
 *     <Select id="x" … />
 *   </SettingsRow>
 *
 * `stack` puts a wide control (a select) under the text on narrow dialogs;
 * without it the control stays on the line and wraps only when it has to.
 * Slots: default (the control), `icon` (replaces the icon), `label` (inline
 * after the label, e.g. a status badge), `help` (replaces the help text),
 * `below` (full-width content under the line, e.g. a progress bar).
 */
import type { Component } from "vue"
import { Label } from "@/components/ui/label"

export type SettingsRowTone = "default" | "primary" | "success" | "warning" | "info" | "danger"

withDefaults(defineProps<{
  icon?: Component
  label: string
  help?: string
  /** The id of the control this row labels. */
  labelFor?: string
  labelId?: string
  stack?: boolean
  /** Colors the icon well; the label still says what the state is. */
  tone?: SettingsRowTone
  dimmed?: boolean
  spin?: boolean
}>(), {
  icon: undefined,
  help: undefined,
  labelFor: undefined,
  labelId: undefined,
  stack: false,
  tone: "default",
  dimmed: false,
  spin: false,
})

const TONE_CLASS: Record<SettingsRowTone, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  info: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  danger: "bg-destructive/15 text-destructive-tint-foreground",
}
</script>

<template>
  <div :class="['px-4 py-3', dimmed ? 'opacity-50' : '']" data-slot="settings-row">
    <div
      :class="[
        'flex gap-x-4 gap-y-3',
        stack
          ? 'flex-col @min-[28rem]:flex-row @min-[28rem]:items-center @min-[28rem]:justify-between'
          : 'flex-wrap items-center justify-between',
      ]"
    >
      <div :class="['flex min-w-0 flex-1 items-start gap-3', stack ? '' : 'basis-44']">
        <span
          :class="['mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold', TONE_CLASS[tone]]"
          aria-hidden="true"
        >
          <slot name="icon">
            <component :is="icon" v-if="icon" :class="['size-4', spin ? 'animate-spin' : '']" />
          </slot>
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Label v-if="labelFor" :id="labelId" :for="labelFor" class="text-sm font-medium">{{ label }}</Label>
            <p v-else :id="labelId" class="text-sm font-medium">{{ label }}</p>
            <slot name="label" />
          </div>
          <div v-if="help || $slots.help" class="mt-0.5 text-xs text-muted-foreground">
            <slot name="help">{{ help }}</slot>
          </div>
          <slot name="note" />
        </div>
      </div>
      <div
        v-if="$slots.default"
        :class="['flex items-center gap-1.5', stack ? 'w-full @min-[28rem]:w-auto @min-[28rem]:shrink-0' : 'ml-auto shrink-0']"
      >
        <slot />
      </div>
    </div>
    <div v-if="$slots.below" class="mt-2.5 pl-11">
      <slot name="below" />
    </div>
  </div>
</template>
