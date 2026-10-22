<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { cn } from "@/lib/utils"
import { resolveAvatarInitial } from "@/shared/sekai/avatar-fallback"
import { resolveSekaiCharacterColor } from "@/shared/sekai/catalog"
import { resolveCharacterIconUrl } from "@/shared/sekai/data-sources"
import { handleSekaiImageError } from "@/shared/sekai/image-recovery"

/**
 * Round character icon. The circle is painted with the character's colour
 * and initial underneath the image, so a slow or WAF-refused icon reads as
 * "Ichika" instead of a blank grey disc; the image fades in over it and the
 * initial stays if every retry fails.
 */
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
const failed = ref(false)
const loaded = ref(false)

watch(url, () => {
  failed.value = false
  loaded.value = false
})

const sizeClass = computed(() => {
  switch (props.size) {
    case "xs":
      return "size-5 text-[9px]"
    case "sm":
      return "size-6 text-[10px]"
    case "lg":
      return "size-10 text-sm"
    case "xl":
      return "size-12 text-base"
    default:
      return "size-8 text-xs"
  }
})

const initial = computed(() => resolveAvatarInitial(props.name))
const color = computed(() => resolveSekaiCharacterColor(props.characterId))

function handleError(event: Event) {
  loaded.value = false
  if (!handleSekaiImageError(event, url.value)) {
    failed.value = true
  }
}
</script>

<template>
  <span
    :class="cn(
      'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-semibold leading-none text-white ring-1 ring-border select-none',
      sizeClass,
      props.class,
    )"
    :style="{
      backgroundColor: color ?? undefined,
      boxShadow: ringColor ? `0 0 0 2px ${ringColor}` : undefined,
    }"
    :title="name ?? undefined"
    :role="name ? 'img' : undefined"
    :aria-label="name ?? undefined"
    data-slot="character-avatar"
  >
    <span aria-hidden="true" :class="color ? '' : 'text-muted-foreground'">{{ initial }}</span>
    <img
      v-if="!failed"
      :src="url"
      alt=""
      :class="['absolute inset-0 size-full rounded-full object-cover transition-opacity duration-200', loaded ? 'opacity-100' : 'opacity-0']"
      loading="lazy"
      decoding="async"
      @load="loaded = true"
      @error="handleError"
    >
  </span>
</template>
