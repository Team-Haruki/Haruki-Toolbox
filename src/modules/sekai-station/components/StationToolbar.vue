<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideEyeOff, LucideSlidersHorizontal, LucideUsers } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import StationBlockedList from "@/modules/sekai-station/components/StationBlockedList.vue"
import StationSettings from "@/modules/sekai-station/components/StationSettings.vue"
import { useStationReducedMotion } from "@/modules/sekai-station/composables/useStationReducedMotion"
import { useSekaiStationFeedStore } from "@/modules/sekai-station/stores/sekai-station-feed"
import { useSekaiStationPrefsStore } from "@/modules/sekai-station/stores/sekai-station-prefs"

const { t } = useI18n()
const feed = useSekaiStationFeedStore()
const prefs = useSekaiStationPrefsStore()
const reducedMotion = useStationReducedMotion()

const connection = computed(() => {
  if (feed.connectionState === "open") {
    return { label: t("sekaiStation.connection.connected"), dotClass: "bg-emerald-500 dark:bg-emerald-400" }
  }
  // Checked before "connecting" so the live label does not flip on every retry
  if (feed.connectFailed) {
    return { label: t("sekaiStation.connection.disconnected"), dotClass: "bg-destructive" }
  }
  if (feed.connectionState === "connecting") {
    return {
      label: t("sekaiStation.connection.connecting"),
      dotClass: ["bg-amber-500 dark:bg-amber-400", reducedMotion.value ? "" : "animate-pulse"],
    }
  }
  // Closed without a failure only happens for a moment before the page connects
  return null
})

const blockedCount = computed(() => feed.blockedList.length)
</script>

<template>
  <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2" data-slot="station-toolbar">
    <span
      v-if="feed.configured"
      class="inline-flex min-h-5 items-center gap-1.5 text-xs text-muted-foreground"
      aria-live="polite"
    >
      <template v-if="connection">
        <span :class="['size-2 shrink-0 rounded-full', connection.dotClass]" aria-hidden="true" />
        {{ connection.label }}
      </template>
    </span>

    <!-- Only while the stream is open, as in Station: the last count goes stale once it drops -->
    <span v-if="feed.statistic && feed.connectionState === 'open'" class="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
      <LucideUsers class="size-3.5" aria-hidden="true" />
      {{ t("sekaiStation.connection.online", { n: feed.statistic.online }) }}
    </span>

    <!-- Pushed to the far right when the toolbar spans a phone screen -->
    <div class="ml-auto flex items-center gap-1.5">
      <Popover>
        <PopoverTrigger as-child>
          <Button
            type="button"
            variant="outline"
            size="icon"
            class="relative size-8"
            :aria-label="t('sekaiStation.blocked.title')"
            :title="t('sekaiStation.blocked.title')"
          >
            <LucideEyeOff aria-hidden="true" />
            <span
              v-if="blockedCount > 0"
              class="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-semibold text-primary-foreground tabular-nums"
              aria-hidden="true"
            >{{ blockedCount }}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          :collision-padding="8"
          :aria-label="t('sekaiStation.blocked.title')"
          class="w-72 overflow-hidden p-0"
        >
          <StationBlockedList />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger as-child>
          <Button
            type="button"
            variant="outline"
            size="icon"
            class="relative size-8"
            :aria-label="t('sekaiStation.settings.title')"
            :title="t('sekaiStation.settings.title')"
          >
            <LucideSlidersHorizontal aria-hidden="true" />
            <span
              v-if="prefs.hasActiveFilters"
              class="absolute top-1 right-1 size-2 rounded-full bg-primary ring-2 ring-background"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          :collision-padding="8"
          :aria-label="t('sekaiStation.settings.title')"
          class="max-h-[min(var(--reka-popover-content-available-height),36rem)] w-80 overflow-y-auto overscroll-contain p-0"
        >
          <StationSettings />
        </PopoverContent>
      </Popover>
    </div>
  </div>
</template>
