<script setup lang="ts">
/**
 * The small tag of the OAuth2 flow pages. `primary` states a plain fact
 * (official app), `attention` marks what deserves a second look, `neutral`
 * is a quiet classification.
 */
withDefaults(defineProps<{
  tone?: "primary" | "attention" | "neutral"
}>(), {
  tone: "primary",
})

const TONE_CLASS = {
  primary: "bg-primary/10 text-primary",
  attention: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  neutral: "border text-muted-foreground",
} as const
</script>

<template>
  <span
    :class="['inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 align-middle text-[11px] leading-4 font-medium whitespace-nowrap', TONE_CLASS[tone]]"
    data-slot="oauth-tag"
  >
    <slot />
  </span>
</template>
