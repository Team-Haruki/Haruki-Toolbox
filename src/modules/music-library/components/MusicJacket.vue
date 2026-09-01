<script setup lang="ts">
import { computed } from "vue"
import { Music } from "lucide-vue-next"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"

/**
 * Square jacket art over the shared Sekai image pipeline (purge-and-retry
 * on CDN errors, note-icon placeholder). Size it from the parent via
 * `class`; the root stays `relative` for the absolutely positioned image.
 */
const props = withDefaults(defineProps<{
  url: string | null
  alt: string
  /** Blur the artwork (unreleased content). */
  blur?: boolean
  /** Above-the-fold hero art. */
  eager?: boolean
}>(), {
  blur: false,
  eager: false,
})

const sources = computed(() => [props.url])
</script>

<template>
  <div class="relative overflow-hidden bg-muted">
    <SekaiAssetImage
      :sources="sources"
      :alt="alt"
      fit="cover"
      :blur="blur"
      :eager="eager"
      :placeholder-icon="Music"
      placeholder-class="[&>svg]:size-1/3 [&>svg]:max-h-12 [&>svg]:min-h-6 [&>svg]:max-w-12 [&>svg]:min-w-6"
    />
  </div>
</template>
