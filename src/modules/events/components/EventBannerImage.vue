<script setup lang="ts">
import { computed, useAttrs } from "vue"
import type { SekaiRegion } from "@/types"
import { cn } from "@/lib/utils"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import { resolveEventBannerUrl, resolveEventLogoUrl } from "@/modules/events/lib/event-assets"

/**
 * Event artwork over the shared candidate/retry image. Stays on the
 * selected server and asset endpoint; the other image type is a structural
 * fallback only (some events ship a logo but no story banner). Wrappers
 * must be `relative` and sized; `class` is forwarded to the `<img>`.
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  region: SekaiRegion
  assetbundleName: string | null
  alt: string
  preference?: SekaiAssetEndpointPreference
  /** Preferred source: the wide story banner or the transparent event logo. */
  variant?: "banner" | "logo"
  fit?: "contain" | "cover"
  eager?: boolean
  blur?: boolean
}>(), {
  preference: "china",
  variant: "banner",
  fit: "contain",
  eager: false,
  blur: false,
})

const attrs = useAttrs()

const sources = computed(() => {
  const banner = resolveEventBannerUrl(props.region, props.assetbundleName, props.preference)
  const logo = resolveEventLogoUrl(props.region, props.assetbundleName, props.preference)
  return props.variant === "logo" ? [logo, banner] : [banner, logo]
})

const imgClass = computed(() => cn(attrs.class as string | undefined))
</script>

<template>
  <SekaiAssetImage
    :sources="sources"
    :alt="alt"
    :fit="fit"
    :eager="eager"
    :blur="blur"
    :img-class="imgClass"
  />
</template>
