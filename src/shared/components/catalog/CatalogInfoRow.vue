<script setup lang="ts">
import type { Component } from "vue"
import { cn } from "@/lib/utils"

const props = withDefaults(defineProps<{
  label: string
  icon?: Component
  /** Rendered when the default slot is empty. */
  fallback?: string
  valueClass?: string
}>(), {
  icon: undefined,
  fallback: "—",
  valueClass: undefined,
})
</script>

<template>
  <dt class="flex items-center gap-1.5 whitespace-nowrap text-muted-foreground">
    <component :is="icon" v-if="icon" class="size-4 shrink-0" aria-hidden="true" />
    {{ label }}
  </dt>
  <dd :class="cn('flex min-w-0 flex-wrap items-center gap-2', props.valueClass)">
    <slot>{{ fallback }}</slot>
  </dd>
</template>
