<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useMediaQuery } from "@vueuse/core"
import { LucideChevronDown, LucideGlobe } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatZoneOffset, resolveBrowserTimeZone, resolveSekaiServerTimeZone } from "@/lib/date-time"
import { isTimeZoneDisplay, useSettingsStore } from "@/shared/stores/settings"
import { resolveSekaiRegionLabel } from "@/lib/sekai-region"

/**
 * The zone a block of timestamps is printed in.
 *
 * `switchable` (next to `CatalogZonedTime`s): the tag is a menu trigger that
 * names the zone in use; the menu offers the viewer's own zone and the game
 * server's clock, each with its UTC offset, and the choice is remembered. When both are the same zone there is nothing to
 * switch, and a plain tag names it.
 *
 * Without `switchable` (next to times formatted elsewhere, always local): a
 * "local time" tag with a tooltip naming both zones, so nobody mistakes
 * 15:00 local for 15:00 JST. On touch devices a tap toggles that tooltip.
 */
const props = withDefaults(defineProps<{
  region: SekaiRegion
  switchable?: boolean
}>(), {
  switchable: false,
})

const { t } = useI18n()

const localZone = resolveBrowserTimeZone()
const serverZone = computed(() => resolveSekaiServerTimeZone(props.region))
const regionLabel = computed(() => resolveSekaiRegionLabel(props.region, t))
const sameZone = computed(() => localZone === serverZone.value)
const hint = computed(() => (sameZone.value
  ? t("catalog.time.sameZone", { region: regionLabel.value, zone: localZone })
  : t("catalog.time.hint", { region: regionLabel.value, zone: localZone, serverZone: serverZone.value })))

const settingsStore = useSettingsStore()
const localOffset = computed(() => formatZoneOffset(localZone))
const serverOffset = computed(() => formatZoneOffset(serverZone.value))
const showSwitch = computed(() => props.switchable && !sameZone.value)
const serverLabel = computed(() => t("catalog.time.serverLabel", { region: regionLabel.value }))
const currentLabel = computed(() => (settingsStore.timeZoneDisplay === "server" ? serverLabel.value : t("catalog.time.localLabel")))

function selectZone(value: unknown) {
  if (isTimeZoneDisplay(value)) {
    settingsStore.setTimeZoneDisplay(value)
  }
}

const coarsePointer = useMediaQuery("(pointer: coarse)")
const tapped = ref(false)

function handleClick() {
  if (coarsePointer.value) {
    tapped.value = !tapped.value
  }
}
</script>

<template>
  <DropdownMenu v-if="showSwitch">
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        class="inline-flex min-h-6 items-center gap-1 rounded-full border px-2 text-[11px] font-normal text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:bg-muted data-[state=open]:text-foreground pointer-coarse:min-h-8 pointer-coarse:px-2.5"
        :aria-label="`${t('catalog.time.switchLabel')}: ${currentLabel}`"
        data-slot="catalog-timezone-switch"
        :data-zone="settingsStore.timeZoneDisplay"
      >
        <LucideGlobe class="size-3" aria-hidden="true" />
        {{ currentLabel }}
        <LucideChevronDown class="size-3 opacity-70" aria-hidden="true" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="min-w-52">
      <DropdownMenuLabel class="text-xs font-normal text-muted-foreground">{{ t("catalog.time.switchLabel") }}</DropdownMenuLabel>
      <DropdownMenuRadioGroup :model-value="settingsStore.timeZoneDisplay" @update:model-value="selectZone">
        <DropdownMenuRadioItem value="local" class="gap-3">
          <span class="flex-1">{{ t("catalog.time.localLabel") }}</span>
          <span class="text-xs tabular-nums text-muted-foreground" :title="localZone">{{ localOffset }}</span>
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="server" class="gap-3">
          <span class="flex-1">{{ serverLabel }}</span>
          <span class="text-xs tabular-nums text-muted-foreground" :title="serverZone">{{ serverOffset }}</span>
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
  <span
    v-else-if="switchable"
    class="inline-flex min-h-6 items-center gap-1 rounded-full border px-2 text-[11px] text-muted-foreground"
    :title="hint"
    data-slot="catalog-timezone-hint"
  >
    <LucideGlobe class="size-3" aria-hidden="true" />
    <span class="tabular-nums">{{ localOffset }}</span>
  </span>
  <TooltipProvider v-else :delay-duration="150">
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
