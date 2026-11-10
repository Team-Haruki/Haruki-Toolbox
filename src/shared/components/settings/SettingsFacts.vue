<script setup lang="ts">
/**
 * A strip of read-only label/value pairs inside a `SettingsGroup` (versions,
 * counts, timestamps): side by side in a wide dialog, one per line on phones.
 */
import type { Component } from "vue"

export interface SettingsFact {
  key: string
  label: string
  value: string | number
  icon?: Component
  /** Monospace for versions, hashes and counts. */
  mono?: boolean
}

defineProps<{
  items: readonly SettingsFact[]
}>()
</script>

<template>
  <dl
    class="grid grid-cols-1 divide-y divide-border/60 @min-[28rem]:grid-flow-col @min-[28rem]:auto-cols-fr @min-[28rem]:grid-cols-none @min-[28rem]:divide-x @min-[28rem]:divide-y-0"
    data-slot="settings-facts"
  >
    <div
      v-for="item in items"
      :key="item.key"
      class="flex min-w-0 items-center justify-between gap-3 px-4 py-3 @min-[28rem]:block"
    >
      <dt class="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        <component :is="item.icon" v-if="item.icon" class="size-3.5 shrink-0" aria-hidden="true" />
        {{ item.label }}
      </dt>
      <dd
        :class="[
          'min-w-0 truncate text-right text-sm font-medium tabular-nums @min-[28rem]:mt-1 @min-[28rem]:text-left',
          item.mono ? 'font-mono' : '',
        ]"
      >
        {{ item.value }}
      </dd>
    </div>
  </dl>
</template>
