<script setup lang="ts">
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"

/**
 * Gacha banner / logo over an ordered candidate list. Thin wrapper around
 * the shared `SekaiAssetImage` (purge-and-retry recovery, placeholder); the
 * parent must be `relative` and sized — the image fills it.
 */
withDefaults(defineProps<{
  /** Ordered URL candidates; advances to the next one on image error. */
  sources: readonly string[]
  alt: string
  fit?: "contain" | "cover"
  /** Blur the artwork (unreleased content); the parent must clip overflow. */
  blur?: boolean
  /** Above-the-fold hero art. */
  eager?: boolean
}>(), {
  fit: "contain",
  blur: false,
  eager: false,
})
</script>

<template>
  <SekaiAssetImage :sources="sources" :alt="alt" :fit="fit" :blur="blur" :eager="eager">
    <template #overlay>
      <slot name="overlay" />
    </template>
  </SekaiAssetImage>
</template>
