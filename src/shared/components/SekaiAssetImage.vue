<script setup lang="ts">
import { computed, ref, watch, type Component } from "vue"
import { LucideImageOff } from "lucide-vue-next"
import { cn } from "@/lib/utils"
import { appendImageRetryParam, purgeCachedSekaiImage } from "@/shared/sekai/image-recovery"

/**
 * One `<img>` over an ordered list of candidate URLs (regional mirror,
 * fallback asset kind, jp mirror…). Every failure purges the Service-Worker
 * cache entry (opaque cross-origin responses pin CDN/WAF errors) and retries
 * the same candidate once with a cache-busting param before advancing.
 *
 * Fills its parent: wrappers must be `relative` and sized (aspect-ratio or
 * fixed height). Use `eager` for above-the-fold hero art.
 */
const props = withDefaults(defineProps<{
  sources: readonly (string | null | undefined)[]
  alt: string
  fit?: "contain" | "cover"
  eager?: boolean
  /** Blur the artwork (unreleased content); the parent must clip overflow. */
  blur?: boolean
  imgClass?: string
  placeholderClass?: string
  placeholderIcon?: Component
}>(), {
  fit: "cover",
  eager: false,
  blur: false,
  imgClass: undefined,
  placeholderClass: undefined,
  placeholderIcon: undefined,
})

const emit = defineEmits<{
  load: [url: string]
  exhausted: []
}>()

const candidates = computed(() => props.sources.filter((url): url is string => typeof url === "string" && url.trim() !== ""))
const candidateKey = computed(() => candidates.value.join("\n"))

const index = ref(0)
const retrying = ref(false)

watch(candidateKey, () => {
  index.value = 0
  retrying.value = false
})

const currentSource = computed(() => candidates.value[index.value] ?? null)
const currentUrl = computed(() => {
  const url = currentSource.value
  return url && retrying.value ? appendImageRetryParam(url, 1) : url
})

function handleError() {
  const failed = currentSource.value
  if (failed) {
    void purgeCachedSekaiImage(failed)
  }
  if (failed && !retrying.value) {
    retrying.value = true
    return
  }
  retrying.value = false
  index.value += 1
  if (index.value >= candidates.value.length) {
    emit("exhausted")
  }
}

function handleLoad() {
  if (currentSource.value) {
    emit("load", currentSource.value)
  }
}
</script>

<template>
  <img
    v-if="currentUrl"
    :src="currentUrl"
    :alt="alt"
    :loading="eager ? 'eager' : 'lazy'"
    :fetchpriority="eager ? 'high' : undefined"
    decoding="async"
    :class="cn(
      'absolute inset-0 h-full w-full',
      fit === 'cover' ? 'object-cover' : 'object-contain',
      blur ? 'scale-105 blur-md' : '',
      imgClass,
    )"
    @error="handleError"
    @load="handleLoad"
  >
  <div
    v-else
    :class="cn('absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground', placeholderClass)"
    aria-hidden="true"
  >
    <component :is="placeholderIcon ?? LucideImageOff" class="size-6" />
  </div>
  <slot name="overlay" />
</template>
