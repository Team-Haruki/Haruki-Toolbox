<script setup lang="ts">
/**
 * Inline validation message under a form field. Renders nothing without a
 * message, so a field can bind it unconditionally. Pair the field with
 * `aria-invalid` and `aria-describedby` pointing at this element's `id`.
 */
defineProps<{
  message?: string | null
  id?: string
}>()
</script>

<template>
  <p v-if="message" :id="id" role="alert" class="text-xs text-destructive">{{ message }}</p>
</template>
