<script setup lang="ts">
import type { Component } from "vue"
import { cn } from "@/lib/utils"

const props = withDefaults(defineProps<{
  label: string
  icon?: Component
  /** Rendered when the default slot is empty. */
  fallback?: string
  valueClass?: string
  /** Technical rows (internal asset names): smaller, dimmer, for the curious. */
  muted?: boolean
}>(), {
  icon: undefined,
  fallback: "—",
  valueClass: undefined,
  muted: false,
})
</script>

<template>
  <dt :class="cn('flex items-center gap-1.5 whitespace-nowrap text-muted-foreground', muted && 'text-xs opacity-70')">
    <component :is="icon" v-if="icon" class="size-4 shrink-0" aria-hidden="true" />
    {{ label }}
  </dt>
  <dd :class="cn('flex min-w-0 flex-wrap items-center gap-2', muted && 'text-xs text-muted-foreground opacity-70', props.valueClass)">
    <slot>{{ fallback }}</slot>
  </dd>
</template>
