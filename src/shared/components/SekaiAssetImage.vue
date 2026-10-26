<script setup lang="ts">
import { computed, ref, watch, type Component } from "vue"
import { LucideImageOff } from "lucide-vue-next"
import { cn } from "@/lib/utils"
import { appendImageRetryParam, purgeCachedSekaiImage } from "@/shared/sekai/image-recovery"
import { isAssetHostDown, resolveAssetHostTwinUrl, resolveAssetImageFallback } from "@/shared/sekai/asset-image-fallback"

/**
 * One `<img>` over an ordered list of candidate URLs (regional mirror,
 * fallback asset kind, jp mirror…). When a candidate's host fails (network,
 * timeout, 5xx; never a 404), its copy on the fallback host is tried first.
 * Every failure purges the Service-Worker cache entry (opaque cross-origin
 * responses pin CDN/WAF errors) and retries the same candidate once with a
 * cache-busting param before advancing.
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
  /**
   * Pulse the box while the image loads so a grey tile reads as "loading",
   * not "failed". Off for decorative backgrounds and the lightbox.
   */
  shimmer?: boolean
}>(), {
  fit: "cover",
  eager: false,
  blur: false,
  imgClass: undefined,
  placeholderClass: undefined,
  placeholderIcon: undefined,
  shimmer: true,
})

const emit = defineEmits<{
  load: [url: string]
  exhausted: []
}>()

const candidates = computed(() => props.sources.filter((url): url is string => typeof url === "string" && url.trim() !== ""))
const candidateKey = computed(() => candidates.value.join("\n"))

const index = ref(0)
const retrying = ref(false)
const loaded = ref(false)
/** The current candidate loads from the fallback host (its own host failed). */
const onTwin = ref(false)
let probing = 0

/** Start on candidate `i`: on its twin right away while its host is known to be down. */
function startCandidate(i: number) {
  index.value = i
  retrying.value = false
  const url = candidates.value[i]
  onTwin.value = !!url && isAssetHostDown(url) && resolveAssetHostTwinUrl(url) !== null
}

watch(candidateKey, () => {
  probing++
  startCandidate(0)
  loaded.value = false
}, { immediate: true })

const currentSource = computed(() => {
  const url = candidates.value[index.value] ?? null
  return url && onTwin.value ? resolveAssetHostTwinUrl(url) ?? url : url
})
const currentUrl = computed(() => {
  const url = currentSource.value
  return url && retrying.value ? appendImageRetryParam(url, 1) : url
})

async function handleError() {
  loaded.value = false
  const failed = currentSource.value
  if (failed) {
    void purgeCachedSekaiImage(failed)
  }
  const candidate = candidates.value[index.value]
  if (candidate && !onTwin.value && resolveAssetHostTwinUrl(candidate)) {
    const mine = ++probing
    const twin = await resolveAssetImageFallback(candidate)
    if (mine !== probing || candidates.value[index.value] !== candidate) {
      return // rebound meanwhile
    }
    if (twin) {
      retrying.value = false
      onTwin.value = true
      return
    }
  }
  if (failed && !retrying.value) {
    retrying.value = true
    return
  }
  startCandidate(index.value + 1)
  if (index.value >= candidates.value.length) {
    emit("exhausted")
  }
}

function onError() {
  void handleError()
}

function handleLoad() {
  loaded.value = true
  if (currentSource.value) {
    emit("load", currentSource.value)
  }
}
</script>

<template>
  <div
    v-if="currentUrl && shimmer && !loaded"
    class="absolute inset-0 animate-pulse bg-muted"
    aria-hidden="true"
  />
  <img
    v-if="currentUrl"
    :src="currentUrl"
    :alt="alt"
    :loading="eager ? 'eager' : 'lazy'"
    :fetchpriority="eager ? 'high' : undefined"
    decoding="async"
    :class="cn(
      'absolute inset-0 h-full w-full transition-opacity duration-200',
      fit === 'cover' ? 'object-cover' : 'object-contain',
      blur ? 'scale-105 blur-md' : '',
      shimmer && !loaded ? 'opacity-0' : 'opacity-100',
      imgClass,
    )"
    @error="onError"
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
