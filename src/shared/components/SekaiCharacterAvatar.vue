<script setup lang="ts">
import { computed } from "vue"
import { cn } from "@/lib/utils"
import { resolveCharacterIconUrl } from "@/shared/sekai/data-sources"
import { handleSekaiImageError } from "@/shared/sekai/image-recovery"

const props = withDefaults(defineProps<{
  characterId: number
  name?: string | null
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  /** Ring color (unit / character color); omit for a neutral border ring. */
  ringColor?: string | null
  class?: string
}>(), {
  name: null,
  size: "md",
  ringColor: null,
  class: undefined,
})

const url = computed(() => resolveCharacterIconUrl(props.characterId))

const sizeClass = computed(() => {
  switch (props.size) {
    case "xs":
      return "size-5"
    case "sm":
      return "size-6"
    case "lg":
      return "size-10"
    case "xl":
      return "size-12"
    default:
      return "size-8"
  }
})
</script>

<template>
  <img
    :src="url"
    :alt="name ?? ''"
    :title="name ?? undefined"
    :class="cn('shrink-0 rounded-full bg-muted object-cover ring-1 ring-border', sizeClass, props.class)"
    :style="ringColor ? { boxShadow: `0 0 0 2px ${ringColor}` } : undefined"
    loading="lazy"
    decoding="async"
    @error="handleSekaiImageError($event, url)"
  >
</template>
