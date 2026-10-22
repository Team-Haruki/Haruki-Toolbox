<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import type { SekaiRegion } from "@/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatWithZone } from "@/lib/date-time"
import { resolveSekaiRegionLabel } from "@/lib/sekai-region"
import { cn } from "@/lib/utils"

/**
 * A timestamp in the viewer's zone. When that differs from the region's
 * server zone (a JP event viewed from Shanghai), the server time is one
 * hover away on pointer devices and printed as a second muted line on touch
 * devices, where there is nothing to hover.
 */
const props = withDefaults(defineProps<{
  value: number | string | null | undefined
  region: SekaiRegion
  options?: Intl.DateTimeFormatOptions
  fallback?: string
  class?: string
}>(), {
  options: undefined,
  fallback: "—",
  class: undefined,
})

const { t, locale } = useI18n()

const zoned = computed(() => formatWithZone(props.value, props.region, props.options, {
  locale: locale.value,
  fallback: props.fallback,
}))
const regionLabel = computed(() => resolveSekaiRegionLabel(props.region, t))
const serverLine = computed(() => (
  zoned.value.server ? t("catalog.time.serverTime", { region: regionLabel.value, time: zoned.value.server }) : null
))
</script>

<template>
  <span :class="cn('inline-flex min-w-0 flex-col', props.class)" data-slot="catalog-zoned-time">
    <template v-if="serverLine">
      <TooltipProvider :delay-duration="150">
        <Tooltip>
          <TooltipTrigger as-child>
            <span class="tabular-nums underline decoration-dotted decoration-muted-foreground/60 underline-offset-4" tabindex="0">
              {{ zoned.local }}
            </span>
          </TooltipTrigger>
          <TooltipContent>{{ serverLine }}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span class="text-[11px] leading-tight text-muted-foreground tabular-nums [@media(pointer:fine)]:sr-only">
        {{ serverLine }}
      </span>
    </template>
    <span v-else class="tabular-nums">{{ zoned.local }}</span>
  </span>
</template>
