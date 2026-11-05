<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useMediaQuery } from "@vueuse/core"
import { LucideGlobe } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { resolveBrowserTimeZone, resolveSekaiServerTimeZone } from "@/lib/date-time"
import { resolveSekaiRegionLabel } from "@/lib/sekai-region"

/**
 * "Local time" tag for a block of timestamps, with a tooltip naming the
 * viewer's zone and the region's server zone. Rendered next to section
 * titles (event timeline, gacha period) so nobody mistakes 15:00 local for
 * 15:00 JST. On touch devices there is nothing to hover, so a tap toggles
 * the same tooltip (the hint is also the button's accessible name).
 */
const props = defineProps<{
  region: SekaiRegion
}>()

const { t } = useI18n()

const localZone = resolveBrowserTimeZone()
const serverZone = computed(() => resolveSekaiServerTimeZone(props.region))
const regionLabel = computed(() => resolveSekaiRegionLabel(props.region, t))
const sameZone = computed(() => localZone === serverZone.value)
const hint = computed(() => (sameZone.value
  ? t("catalog.time.sameZone", { region: regionLabel.value, zone: localZone })
  : t("catalog.time.hint", { region: regionLabel.value, zone: localZone, serverZone: serverZone.value })))

const coarsePointer = useMediaQuery("(pointer: coarse)")
const tapped = ref(false)

function handleClick() {
  if (coarsePointer.value) {
    tapped.value = !tapped.value
  }
}
</script>

<template>
  <TooltipProvider :delay-duration="150">
    <!-- Controlled only on touch, where a tap toggles it (reka would close it
         again on the same pointerdown without `disableClosingTrigger`); the
         hover/focus behaviour stays on pointer devices. -->
    <Tooltip
      :open="coarsePointer ? tapped : undefined"
      :disable-closing-trigger="coarsePointer"
      @update:open="coarsePointer && (tapped = $event)"
    >
      <TooltipTrigger as-child>
        <button
          type="button"
          class="inline-flex min-h-6 items-center gap-1 rounded-full border px-2 text-[11px] font-normal text-muted-foreground transition-colors hover:bg-muted hover:text-foreground pointer-coarse:min-h-10 pointer-coarse:px-3"
          :aria-label="hint"
          :aria-expanded="coarsePointer ? tapped : undefined"
          data-slot="catalog-timezone-hint"
          @click="handleClick"
        >
          <LucideGlobe class="size-3" aria-hidden="true" />
          {{ t("catalog.time.localLabel") }}
        </button>
      </TooltipTrigger>
      <TooltipContent class="max-w-72">{{ hint }}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
