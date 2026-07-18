<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { LucideImageOff } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
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

// Fallback chain: preferred source -> the other source -> placeholder.
const sources = computed(() => {
  const banner = resolveEventBannerUrl(props.region, props.assetbundleName, props.preference)
  const logo = resolveEventLogoUrl(props.region, props.assetbundleName, props.preference)
  const ordered = props.variant === "logo" ? [logo, banner] : [banner, logo]
  return ordered.filter((url): url is string => url != null)
})

const sourceIndex = ref(0)

watch(sources, () => {
  sourceIndex.value = 0
})

const currentUrl = computed(() => sources.value[sourceIndex.value] ?? null)

function handleError() {
  sourceIndex.value += 1
}
</script>

<template>
  <img
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
