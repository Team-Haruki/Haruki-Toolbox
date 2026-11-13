<script setup lang="ts">
/**
 * One titled panel of the generator form. The default slot is the padded
 * field area; `flush` holds full-width rows under it (the advanced folds).
 * `badge` sits after the title, `description` replaces the plain text.
 */
import { useId } from "vue"

defineProps<{
  title: string
  description?: string
}>()

const titleId = useId()
</script>

<template>
  <section class="@container overflow-hidden rounded-xl border bg-card" :aria-labelledby="titleId">
    <header class="p-4">
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h2 :id="titleId" class="text-sm font-semibold">{{ title }}</h2>
        <slot name="badge" />
      </div>
      <p v-if="description || $slots.description" class="mt-0.5 text-xs leading-relaxed text-muted-foreground">
        <slot name="description">{{ description }}</slot>
      </p>
    </header>
    <div v-if="$slots.default" class="grid gap-4 px-4 pb-4">
      <slot />
    </div>
    <slot name="flush" />
  </section>
</template>
