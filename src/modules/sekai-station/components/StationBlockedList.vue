<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { useNowTick } from "@/composables/useNowTick"
import { captureFocusHandOff } from "@/modules/sekai-station/lib/focus-hand-off"
import { BLOCK_DURATION_MS } from "@/modules/sekai-station/lib/sekai-station-constants"
import { useSekaiStationFeedStore } from "@/modules/sekai-station/stores/sekai-station-feed"

/**
 * Room numbers hidden for now (held for a second on a card), each with the
 * minutes until it shows again. Ported from Sekai Station's BlockedRoomsMenu
 * (MIT © middlered).
 */
const { t } = useI18n()
const feed = useSekaiStationFeedStore()
const now = useNowTick(1000)
const BLOCK_MINUTES = Math.ceil(BLOCK_DURATION_MS / 60_000)
const root = ref<HTMLElement | null>(null)

// The shared tick can be up to a second old when the list opens, which would
// round a fresh 10-minute block up to 11
function minutesLeft(until: number): number {
  return Math.min(BLOCK_MINUTES, Math.max(1, Math.ceil((until - now.value) / 60_000)))
}

// The pressed button goes away with its row; keyboard focus moves to the next
// row's button, or to the list once it is empty
function unblock(event: MouseEvent, id: string) {
  const handOffFocus = captureFocusHandOff((event.currentTarget as HTMLElement | null)?.closest("li"), () => root.value)
  feed.unblockRoom(id)
  handOffFocus?.()
}

function unblockAll(event: MouseEvent) {
  const handOffFocus = captureFocusHandOff(event.currentTarget as HTMLElement | null, () => root.value)
  feed.clearBlocks()
  handOffFocus?.()
}
</script>

<template>
  <div ref="root" tabindex="-1" class="flex flex-col outline-none" data-slot="station-blocked-list">
    <div class="border-b px-3 py-2.5">
      <p class="text-sm font-semibold">{{ t("sekaiStation.blocked.title") }}</p>
      <p class="text-xs text-muted-foreground">{{ t("sekaiStation.blocked.hint") }}</p>
    </div>

    <p v-if="feed.blockedList.length === 0" class="px-3 py-4 text-xs text-muted-foreground">
      {{ t("sekaiStation.blocked.empty") }}
    </p>

    <template v-else>
      <ul class="m-0 max-h-60 list-none overflow-y-auto p-0 py-1">
        <li v-for="entry in feed.blockedList" :key="entry.id" class="flex min-h-10 items-center gap-2 pr-1.5 pl-3">
          <span class="font-mono text-[15px] font-bold tabular-nums">{{ entry.id }}</span>
          <span class="min-w-0 flex-1 truncate text-xs text-muted-foreground tabular-nums">
            {{ t("sekaiStation.blocked.minutesLeft", { n: minutesLeft(entry.until) }) }}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            class="h-7 px-2 text-xs text-primary hover:text-primary"
            :aria-label="t('sekaiStation.blocked.unblock', { id: entry.id })"
            @click="unblock($event, entry.id)"
          >
            {{ t("sekaiStation.blocked.unblockOne") }}
          </Button>
        </li>
      </ul>
      <!-- With a single entry its own button already does the same -->
      <div v-if="feed.blockedList.length > 1" class="border-t p-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          class="h-8 w-full justify-start px-2 text-xs"
          @click="unblockAll"
        >
          {{ t("sekaiStation.blocked.unblockAll") }}
        </Button>
      </div>
    </template>
  </div>
</template>
