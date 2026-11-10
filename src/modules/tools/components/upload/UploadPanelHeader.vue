<script setup lang="ts">
/**
 * The heading of every upload-method panel (and of the cards under it): an
 * icon well, the title, one line of description, and an optional action on
 * the right (a tutorial link, a status badge, a refresh button).
 *
 *   <CardHeader><UploadPanelHeader :icon="KeyRound" :title="…" :description="…" /></CardHeader>
 */
import type { Component } from "vue"

withDefaults(defineProps<{
  icon: Component
  title: string
  description?: string
  titleId?: string
  /** Section headings under the page's method panel are one level down. */
  as?: "h2" | "h3"
}>(), {
  description: undefined,
  titleId: undefined,
  as: "h2",
})
</script>

<template>
  <div class="flex flex-wrap items-start gap-x-4 gap-y-3" data-slot="upload-panel-header">
    <div class="flex min-w-0 flex-1 basis-64 items-start gap-3">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
        <component :is="icon" class="size-5" />
      </span>
      <div class="min-w-0 flex-1">
        <component :is="as" :id="titleId" class="text-base font-semibold leading-6">{{ title }}</component>
        <p v-if="description" class="mt-0.5 text-sm leading-relaxed text-muted-foreground">{{ description }}</p>
        <slot />
      </div>
    </div>
    <div v-if="$slots.action" class="flex shrink-0 items-center gap-1.5">
      <slot name="action" />
    </div>
  </div>
</template>
