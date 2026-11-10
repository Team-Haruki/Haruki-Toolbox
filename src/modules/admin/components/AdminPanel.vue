<script setup lang="ts">
/**
 * A titled block of an admin page: heading, optional description, actions on
 * the right, then the content. `flush` drops the body padding for a table or
 * a divided list that should run edge to edge.
 *
 *   <AdminPanel :title="…" :description="…">
 *     <template #actions><Button size="sm">…</Button></template>
 *     …
 *   </AdminPanel>
 *
 * Slots: default, `actions` (right of the heading), `footer` (under a rule,
 * e.g. pagination).
 */
withDefaults(defineProps<{
  title?: string
  description?: string
  flush?: boolean
}>(), {
  title: undefined,
  description: undefined,
  flush: false,
})
</script>

<template>
  <section class="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card" data-slot="admin-panel">
    <header
      v-if="title || description || $slots.actions"
      class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-border/60 px-4 py-3"
    >
      <div class="min-w-0 flex-1 basis-48">
        <h2 v-if="title" class="text-sm font-semibold">{{ title }}</h2>
        <p v-if="description" class="mt-0.5 text-xs text-muted-foreground">{{ description }}</p>
      </div>
      <!-- May shrink and wrap: a `shrink-0` row of several controls was cut
           off by the panel's own clipping on a phone. -->
      <div v-if="$slots.actions" class="flex max-w-full min-w-0 flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </header>
    <div :class="['min-w-0 flex-1', flush ? '' : 'p-4']">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="border-t border-border/60 px-4 py-2.5">
      <slot name="footer" />
    </footer>
  </section>
</template>
