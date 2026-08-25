<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { LucideImageOff } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { appendImageRetryParam, purgeCachedSekaiImage } from "@/shared/sekai/image-recovery"
import { resolveEventBannerUrl, resolveEventLogoUrl } from "../lib/event-assets"

const props = withDefaults(defineProps<{
  region: SekaiRegion
  assetbundleName: string | null
  alt: string
  preference?: SekaiAssetEndpointPreference
  /** Preferred source: the wide story banner or the transparent event logo. */
  variant?: "banner" | "logo"
}>(), {
  preference: "china",
  variant: "banner",
})

// Stay on the selected server and asset endpoint. The other image type is a
// structural fallback only (some events ship a logo but no story banner).
const sources = computed(() => {
  const banner = resolveEventBannerUrl(props.region, props.assetbundleName, props.preference)
  const logo = resolveEventLogoUrl(props.region, props.assetbundleName, props.preference)
  const ordered = props.variant === "logo" ? [logo, banner] : [banner, logo]
  return ordered.filter((url): url is string => url != null)
})

const sourceIndex = ref(0)
const retrying = ref(false)

watch(sources, () => {
  sourceIndex.value = 0
  retrying.value = false
})

const currentUrl = computed(() => {
  const url = sources.value[sourceIndex.value] ?? null
  return url && retrying.value ? appendImageRetryParam(url, 1) : url
})

function handleError() {
  // A failure may be a Service-Worker-cached transient error (opaque
  // responses hide CDN/WAF errors): purge the entry and retry the same
  // source once with a cache-busting param before advancing.
  const failed = sources.value[sourceIndex.value]
  if (failed) {
    void purgeCachedSekaiImage(failed)
  }
  if (failed && !retrying.value) {
    retrying.value = true
    return
  }
  retrying.value = false
  sourceIndex.value += 1
}
</script>

<template>
  <img
    decoding="async"
    v-if="currentUrl"
    :src="currentUrl"
    :alt="alt"
    class="h-full w-full object-contain"
    loading="lazy"
    @error="handleError"
  >
  <div v-else class="flex h-full w-full items-center justify-center text-muted-foreground">
    <LucideImageOff class="h-6 w-6" aria-hidden="true" />
  </div>
</template>
