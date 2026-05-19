<script lang="ts" setup>
import type { ToasterProps } from "vue-sonner"
import { Toaster as Sonner } from "vue-sonner"

const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="props"
    :style="{
      '--normal-bg': 'color-mix(in oklab, var(--popover) 88%, transparent)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',

    }"
  />
</template>
