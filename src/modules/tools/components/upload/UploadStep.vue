<script setup lang="ts">
/**
 * One numbered step of a setup sequence (the iOS module and HarukiProxy are
 * done in order, so the numbers mean something). The step's controls go in
 * the default slot, indented under the title on wide screens.
 */
defineProps<{
  step: number
  title: string
  description?: string
}>()
</script>

<template>
  <section class="grid gap-x-3 gap-y-4 sm:grid-cols-[1.75rem_minmax(0,1fr)]" data-slot="upload-step">
    <header class="flex items-start gap-3 sm:contents">
      <span
        class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold tabular-nums text-primary"
        aria-hidden="true"
      >
        {{ step }}
      </span>
      <div class="min-w-0 space-y-0.5">
        <h3 class="text-sm font-semibold leading-7">{{ title }}</h3>
        <slot name="note" />
        <p v-if="description" class="text-xs text-muted-foreground">{{ description }}</p>
      </div>
    </header>
    <div v-if="$slots.default" class="min-w-0 space-y-4 sm:col-start-2">
      <slot />
    </div>
  </section>
</template>
