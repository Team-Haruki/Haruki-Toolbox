<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

/**
 * `as` lets a card that is the whole page (calculators, registration,
 * ticket creation) expose its title as the page's h1 without a separate
 * header; the default stays h3 for cards inside a page.
 */
withDefaults(defineProps<{
  class?: HTMLAttributes["class"]
  as?: "h1" | "h2" | "h3" | "h4" | "div"
}>(), {
  as: "h3",
})
</script>

<template>
  <component
    :is="as"
    data-slot="card-title"
    :class="cn('leading-none font-semibold', $props.class)"
  >
    <slot />
  </component>
</template>
