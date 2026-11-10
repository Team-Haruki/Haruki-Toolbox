<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import type { SekaiRegion } from "@/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatWithZone, type DateFormatOptions } from "@/lib/date-time"
import { resolveSekaiRegionLabel } from "@/lib/sekai-region"
import { cn } from "@/lib/utils"
import { useSettingsStore } from "@/shared/stores/settings"

/**
 * A timestamp in the zone the visitor chose with the switch next to it
 * (`CatalogTimeZoneHint switchable`): their own, or the game server's. When
 * the two differ (a JP event viewed from Shanghai), the other one is a hover
 * away on pointer devices and printed as a second muted line on touch
 * devices, where there is nothing to hover.
 *
 * `options` takes a `date-time` preset name (`dateTime` by default: minute
 * precision, 24 h clock) or a raw `Intl.DateTimeFormatOptions` object.
 */
const props = withDefaults(defineProps<{
  value: number | string | null | undefined
  region: SekaiRegion
  options?: DateFormatOptions
  fallback?: string
  class?: string
}>(), {
  options: "dateTime",
  fallback: "—",
  class: undefined,
})

const { t, locale } = useI18n()

const zoned = computed(() => formatWithZone(props.value, props.region, props.options, {
  locale: locale.value,
  fallback: props.fallback,
}))
const regionLabel = computed(() => resolveSekaiRegionLabel(props.region, t))
const settingsStore = useSettingsStore()
// `server` is null when both zones read the same: then there is one time to show.
const showServer = computed(() => settingsStore.timeZoneDisplay === "server" && zoned.value.server != null)
const primary = computed(() => (showServer.value ? zoned.value.server! : zoned.value.local))
const otherLine = computed(() => {
  if (zoned.value.server == null) {
    return null
  }
  return showServer.value
    ? t("catalog.time.localTime", { time: zoned.value.local })
    : t("catalog.time.serverTime", { region: regionLabel.value, time: zoned.value.server })
})
</script>

<template>
  <span
    :class="cn('inline-flex min-w-0 flex-col', props.class)"
    data-slot="catalog-zoned-time"
    :data-zone="showServer ? 'server' : 'local'"
  >
    <template v-if="otherLine">
      <TooltipProvider :delay-duration="150">
        <Tooltip>
          <TooltipTrigger as-child>
            <span class="tabular-nums underline decoration-dotted decoration-muted-foreground/60 underline-offset-4" tabindex="0">
              {{ primary }}
            </span>
          </TooltipTrigger>
          <TooltipContent>{{ otherLine }}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span class="text-[11px] leading-tight text-muted-foreground tabular-nums [@media(pointer:fine)]:sr-only">
        {{ otherLine }}
      </span>
    </template>
    <span v-else class="tabular-nums">{{ primary }}</span>
  </span>
</template>
