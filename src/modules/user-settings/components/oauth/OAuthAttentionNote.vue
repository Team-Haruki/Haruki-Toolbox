<script setup lang="ts">
/** One amber "read this before you decide" line: an icon and plain text, no box. */
import { LucideTriangleAlert } from "lucide-vue-next"
</script>

<template>
  <p class="flex min-w-0 items-start gap-2 text-xs font-medium text-amber-700 dark:text-amber-300" data-slot="oauth-attention-note">
    <LucideTriangleAlert class="mt-px size-4 shrink-0" aria-hidden="true" />
    <span class="min-w-0 leading-5 [overflow-wrap:anywhere]"><slot /></span>
  </p>
</template>
