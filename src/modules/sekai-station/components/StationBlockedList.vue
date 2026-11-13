<script setup lang="ts">
import { ref, useId } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { useNowTick } from "@/composables/useNowTick"
import { captureFocusHandOff } from "@/modules/sekai-station/lib/focus-hand-off"
import { BLOCK_DURATION_MS } from "@/modules/sekai-station/lib/sekai-station-constants"
import { blockMinutesLeft } from "@/modules/sekai-station/lib/station-status"
import { useSekaiStationFeedStore } from "@/modules/sekai-station/stores/sekai-station-feed"

/**
 * Room numbers hidden for now (held for a second in the list), each with the
 * minutes until it shows again. Ported from Sekai Station's BlockedRoomsMenu
 * (MIT © middlered).
 */
withDefaults(defineProps<{ heading?: "h2" | "h3" }>(), { heading: "h2" })

const { t } = useI18n()
const feed = useSekaiStationFeedStore()
const now = useNowTick(1000)
const id = useId()
const root = ref<HTMLElement | null>(null)

// The pressed button goes away with its row; keyboard focus moves to the next
// row's button, or to the section once it is empty
function unblock(event: MouseEvent, roomId: string) {
  const handOffFocus = captureFocusHandOff((event.currentTarget as HTMLElement | null)?.closest("li"), () => root.value)
  feed.unblockRoom(roomId)
  handOffFocus?.()
}

function unblockAll(event: MouseEvent) {
  const handOffFocus = captureFocusHandOff(event.currentTarget as HTMLElement | null, () => root.value)
  feed.clearBlocks()
  handOffFocus?.()
}
</script>

<template>
  <section
    ref="root"
    tabindex="-1"
    class="grid min-w-0 gap-1.5 outline-none"
    :aria-labelledby="`${id}-title`"
    data-slot="station-blocked-list"
  >
    <div class="flex min-h-7 items-center justify-between gap-2">
      <component :is="heading" :id="`${id}-title`" class="flex items-baseline gap-2 text-sm font-semibold">
        {{ t("sekaiStation.blocked.title") }}
        <span v-if="feed.blockedList.length > 0" class="text-xs font-normal text-muted-foreground tabular-nums">
          {{ feed.blockedList.length }}
        </span>
      </component>
      <!-- With a single entry its own button already does the same -->
      <Button
        v-if="feed.blockedList.length > 1"
        type="button"
        variant="ghost"
        size="sm"
        class="-my-1.5 -mr-2 h-7 px-2 text-xs text-muted-foreground"
        @click="unblockAll"
      >
        {{ t("sekaiStation.blocked.unblockAll") }}
      </Button>
    </div>

    <p v-if="feed.blockedList.length === 0" class="text-xs text-muted-foreground">
      {{ t("sekaiStation.blocked.empty") }}
    </p>

    <ul v-else role="list" class="m-0 -mr-2 max-h-60 list-none overflow-y-auto overscroll-contain p-0">
      <li v-for="entry in feed.blockedList" :key="entry.id" class="flex min-h-9 items-center gap-3 pointer-coarse:min-h-10">
        <span class="font-mono text-[15px] font-bold tabular-nums">{{ entry.id }}</span>
        <span class="min-w-0 flex-1 truncate text-xs text-muted-foreground tabular-nums">
          {{ t("sekaiStation.blocked.minutesLeft", { n: blockMinutesLeft(entry.until, now, BLOCK_DURATION_MS) }) }}
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
  </section>
</template>
