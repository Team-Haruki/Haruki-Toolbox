<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideFilter, LucideX } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { captureFocusHandOff } from "@/modules/sekai-station/lib/focus-hand-off"
import { useSekaiStationPrefsStore } from "@/modules/sekai-station/stores/sekai-station-prefs"

/**
 * The filters in effect, above the room list so a quiet feed is never
 * mistaken for a dead one; each chip removes its own term. Sticky from sm
 * up only: wrapped chips would cover too much of a phone screen.
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

const chipClass = "inline-flex h-7 max-w-full items-center gap-1 rounded-full border bg-background pr-2 pl-2.5 text-xs transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
</script>

<template>
  <div
    v-if="prefs.hasActiveFilters"
    ref="bar"
    role="group"
    :aria-label="t('sekaiStation.settings.filter')"
    class="flex items-start gap-2 rounded-md border bg-background/90 px-2 py-1.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:sticky sm:top-13 sm:z-10"
    data-slot="station-active-filters"
  >
    <span class="inline-flex h-7 shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
      <LucideFilter class="size-3.5" aria-hidden="true" />
      {{ prefs.filterMode === "whitelist" ? t("sekaiStation.settings.whitelist") : t("sekaiStation.settings.blacklist") }}
    </span>

    <ul class="m-0 flex min-w-0 flex-1 list-none flex-wrap items-center gap-1.5 p-0">
      <li v-for="tag in prefs.activeTags" :key="`tag:${tag}`" class="flex max-w-full min-w-0">
        <button
          type="button"
          :class="chipClass"
          :aria-label="t('sekaiStation.settings.removeFilter', { name: tag })"
          @click="removeChip($event, () => prefs.toggleTag(tag))"
        >
          <span class="truncate">{{ tag }}</span>
          <LucideX class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </li>
      <li v-for="keyword in prefs.filterKeywords" :key="`keyword:${keyword}`" class="flex max-w-full min-w-0">
        <button
          type="button"
          :class="chipClass"
          :aria-label="t('sekaiStation.settings.removeFilter', { name: keyword })"
          @click="removeChip($event, () => prefs.removeKeyword(keyword))"
        >
          <span class="truncate">{{ keyword }}</span>
          <LucideX class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
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
