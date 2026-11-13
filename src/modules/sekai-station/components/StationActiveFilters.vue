<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import StationFilterChip from "@/modules/sekai-station/components/StationFilterChip.vue"
import { captureFocusHandOff } from "@/modules/sekai-station/lib/focus-hand-off"
import { useSekaiStationPrefsStore } from "@/modules/sekai-station/stores/sekai-station-prefs"

/**
 * The filters in effect, as the first row of the room list so a quiet feed is
 * never mistaken for a dead one; each chip removes its own term. Shown while
 * the filter column is folded into a dialog (below 56rem): beside the list
 * that column already says the same. Sticky from 28rem up only: wrapped chips
 * would cover too much of a phone screen. The hairline under the bar (::after)
 * sits on the next row's top border, so it only shows once the bar is stuck.
 */
const { t } = useI18n()
const prefs = useSekaiStationPrefsStore()
const bar = ref<HTMLElement | null>(null)

// The pressed button goes away; keyboard focus moves to the nearest chip
// left, or to the room list once the bar is gone
function removeKeepingFocus(row: Element | null | undefined, remove: () => void) {
  const list = bar.value?.closest<HTMLElement>("section")
  const handOffFocus = captureFocusHandOff(row, () => list)
  remove()
  handOffFocus?.()
}

function removeChip(event: MouseEvent, remove: () => void) {
  removeKeepingFocus((event.currentTarget as HTMLElement | null)?.closest("li"), remove)
}

function clearAll(event: MouseEvent) {
  removeKeepingFocus(event.currentTarget as HTMLElement | null, prefs.clearFilters)
}
</script>

<template>
  <div
    v-if="prefs.hasActiveFilters"
    ref="bar"
    role="group"
    :aria-label="t('sekaiStation.settings.filter')"
    class="relative flex items-start gap-2 border-t border-border/60 bg-card py-1.5 pr-2 pl-4 after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-px after:bg-border/60 @min-[28rem]/station:sticky @min-[28rem]/station:top-13 @min-[28rem]/station:z-10 pointer-coarse:py-0.5 @min-[56rem]/station:hidden"
    data-slot="station-active-filters"
  >
    <span class="inline-flex h-7 shrink-0 items-center text-xs text-muted-foreground pointer-coarse:h-10">
      {{ prefs.filterMode === "whitelist" ? t("sekaiStation.settings.whitelist") : t("sekaiStation.settings.blacklist") }}
    </span>

    <ul role="list" class="m-0 flex min-w-0 flex-1 list-none flex-wrap items-center gap-x-1.5 gap-y-1 p-0 pointer-coarse:gap-y-0">
      <li v-for="tag in prefs.activeTags" :key="`tag:${tag}`" class="flex max-w-full min-w-0">
        <StationFilterChip
          :label="tag"
          :remove-label="t('sekaiStation.settings.removeFilter', { name: tag })"
          @remove="removeChip($event, () => prefs.toggleTag(tag))"
        />
      </li>
      <li v-for="keyword in prefs.filterKeywords" :key="`keyword:${keyword}`" class="flex max-w-full min-w-0">
        <StationFilterChip
          :label="keyword"
          :remove-label="t('sekaiStation.settings.removeFilter', { name: keyword })"
          @remove="removeChip($event, () => prefs.removeKeyword(keyword))"
        />
      </li>
    </ul>

    <Button
      type="button"
      variant="ghost"
      size="sm"
      class="h-7 shrink-0 px-2 text-xs text-muted-foreground"
      @click="clearAll"
    >
      {{ t("sekaiStation.settings.clear") }}
    </Button>
  </div>
</template>
