<script setup lang="ts">
import type { Component } from "vue"
import { LucideInbox } from "lucide-vue-next"

/**
 * The shared "nothing here" state, the quiet counterpart of `LoadErrorState`:
 * an icon, a one-line title, an optional hint and an optional action (a
 * button or link in the `action` slot). It is a plain block; put it inside a
 * Card when the page's other sections are cards (`CatalogEmptyState` does).
 * `size="sm"` is for small sections and dialogs.
 */
withDefaults(defineProps<{
  title: string
  description?: string | null
  /** Lucide component; the `icon` slot replaces it entirely. */
  icon?: Component
  size?: "sm" | "md"
}>(), {
  description: null,
  icon: undefined,
  size: "md",
})
</script>

<template>
  <div
    data-slot="empty-state"
    :class="['flex flex-col items-center gap-3 text-center', size === 'sm' ? 'py-6' : 'py-12']"
  >
    <slot name="icon">
      <component
        :is="icon ?? LucideInbox"
        :class="[size === 'sm' ? 'size-6' : 'size-8', 'text-muted-foreground/60']"
        aria-hidden="true"
      />
    </slot>
    <div class="space-y-1">
      <p class="text-sm text-muted-foreground">{{ title }}</p>
      <p v-if="description" class="max-w-md text-xs text-muted-foreground/80">{{ description }}</p>
    </div>
    <slot name="action" />
  </div>
</template>
