<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideFilterX, LucideInbox, LucideUnplug } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import StationActiveFilters from "@/modules/sekai-station/components/StationActiveFilters.vue"
import StationRoomItem from "@/modules/sekai-station/components/StationRoomItem.vue"
import StationStatus from "@/modules/sekai-station/components/StationStatus.vue"
import { useSekaiStationFeedStore } from "@/modules/sekai-station/stores/sekai-station-feed"
import { useSekaiStationPrefsStore } from "@/modules/sekai-station/stores/sekai-station-prefs"
import EmptyState from "@/shared/components/EmptyState.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"

/**
 * The page's one surface: the stream's status on top, then the filters in
 * effect, then the rooms (or why there are none), each block under a
 * hairline. The `actions` slot is the right end of the status line. The
 * section is focusable so keyboard focus has somewhere to go when the last
 * room it was on is removed.
 */
const { t } = useI18n()
const feed = useSekaiStationFeedStore()
const prefs = useSekaiStationPrefsStore()

// Pinned rooms come from the browser, so they can show before the first burst
const waiting = computed(() => !feed.ready && feed.displayItems.length === 0)
// Nothing has ever loaded and the connection is not coming up
const failed = computed(() => waiting.value && feed.connectFailed)
// Lost the stream after rooms were shown: the status line offers the retry
const lost = computed(() => !waiting.value && feed.connectFailed && feed.connectionState !== "open")
const empty = computed(() => feed.ready && feed.displayItems.length === 0)
</script>

<template>
  <section
    :aria-label="t('sekaiStation.rooms.list')"
    :aria-busy="waiting && !failed ? 'true' : undefined"
    tabindex="-1"
    class="@container/rooms min-w-0 rounded-xl border bg-card outline-none"
    data-slot="station-room-list"
  >
    <div v-if="!feed.configured" class="px-4">
      <EmptyState :icon="LucideUnplug" :title="t('sekaiStation.notConfigured')" />
    </div>

    <template v-else>
      <header class="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 py-1.5 pr-2 pl-4" data-slot="station-toolbar">
        <StationStatus class="flex-1" :retry="lost" />
        <slot name="actions" />
      </header>

      <StationActiveFilters />

      <!-- Could not connect and nothing to show yet; the status line above counts down to the next attempt -->
      <div v-if="failed" class="border-t border-border/60 px-4">
        <LoadErrorState
          :title="t('sekaiStation.connection.failed')"
          :description="t('sekaiStation.connection.failedHint')"
          :retry-label="t('sekaiStation.connection.retryNow')"
          :retrying="feed.retryAt === null"
          @retry="feed.retryImmediately()"
        />
      </div>

      <!-- First connection in progress: the same boxes as a room row, so nothing jumps when the rooms arrive -->
      <template v-else-if="waiting">
        <div
          v-for="index in 3"
          :key="index"
          class="flex items-start gap-3 border-t border-border/60 px-4 py-2.5"
          aria-hidden="true"
        >
          <Skeleton class="h-7 w-16 shrink-0" />
          <div class="flex min-w-0 flex-1 flex-col gap-2 py-1.5">
            <div class="flex items-center gap-2">
              <Skeleton class="h-4 w-24" />
              <Skeleton class="ml-auto h-3 w-10" />
            </div>
            <Skeleton class="h-4 w-2/3" />
          </div>
        </div>
        <p class="sr-only" role="status">{{ t("sekaiStation.rooms.loading") }}</p>
      </template>

      <template v-else>
        <div v-if="empty" class="border-t border-border/60 px-4">
          <EmptyState
            v-if="prefs.hasActiveFilters"
            :icon="LucideFilterX"
            :title="t('sekaiStation.rooms.emptyFiltered')"
          >
            <template #action>
              <Button type="button" variant="outline" size="sm" @click="prefs.clearFilters()">
                {{ t("sekaiStation.rooms.clearFilters") }}
              </Button>
            </template>
          </EmptyState>
          <EmptyState v-else :icon="LucideInbox" :title="t('sekaiStation.rooms.empty')" />
        </div>

        <ul v-else role="list" class="m-0 list-none p-0">
          <StationRoomItem v-for="entry in feed.displayItems" :key="entry.key" :entry="entry" />
        </ul>

        <!-- Pinned rooms are listed while the first burst is still on its way -->
        <p v-if="!feed.ready" class="border-t border-border/60 px-4 py-2 text-center text-xs text-muted-foreground" role="status">
          {{ t("sekaiStation.rooms.loading") }}
        </p>
      </template>
    </template>
  </section>
</template>
