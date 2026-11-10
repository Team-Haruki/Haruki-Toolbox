<script setup lang="ts">
/**
 * One titled block of the settings dialog: a heading (with an optional action
 * on its right) over a bordered list. Children are `SettingsRow`,
 * `SettingsFacts`, or any full-width block; `#footer` holds the block's
 * buttons, right-aligned. `surface="card"` is for a group on a page: the
 * dialog's faint fill would disappear against the page background.
 */
withDefaults(defineProps<{
  title?: string
  surface?: "muted" | "card"
}>(), {
  title: undefined,
  surface: "muted",
})
</script>

<template>
  <section>
    <div v-if="title || $slots.action" class="flex min-h-7 items-center justify-between gap-3 px-1 pb-1.5">
      <h3 class="text-[13px] font-medium text-muted-foreground">{{ title }}</h3>
      <slot name="action" />
    </div>
    <div :class="['divide-y divide-border/60 overflow-hidden rounded-xl border', surface === 'card' ? 'bg-card' : 'bg-muted/20']">
      <slot />
      <div v-if="$slots.footer" class="flex flex-wrap justify-end gap-2 px-4 py-3">
        <slot name="footer" />
      </div>
    </div>
  </section>
</template>
