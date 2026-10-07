<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useIntervalFn } from "@vueuse/core"
import { LucideFilterX, LucideInbox, LucideInfo, LucideWifiOff } from "lucide-vue-next"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import StationActiveFilters from "@/modules/sekai-station/components/StationActiveFilters.vue"
import StationRoomItem from "@/modules/sekai-station/components/StationRoomItem.vue"
import { useSekaiStationFeedStore } from "@/modules/sekai-station/stores/sekai-station-feed"
import { useSekaiStationPrefsStore } from "@/modules/sekai-station/stores/sekai-station-prefs"

const { t } = useI18n()
const feed = useSekaiStationFeedStore()
const prefs = useSekaiStationPrefsStore()

// Pinned rooms come from the browser, so they can show before the first burst
const waiting = computed(() => !feed.ready && feed.displayItems.length === 0)
// Nothing has ever loaded and the connection is not coming up
const failed = computed(() => waiting.value && feed.connectFailed)
// Lost the stream after rooms were shown: say so until it is back
const lost = computed(() => !waiting.value && feed.connectFailed && feed.connectionState !== "open")
const empty = computed(() => feed.ready && feed.displayItems.length === 0)

// Ticks faster than the countdown's 1 s steps so the number is never a second
// stale, and only while a countdown is on screen
const now = ref(Date.now())
const ticker = useIntervalFn(() => {
  now.value = Date.now()
}, 200, { immediate: false, immediateCallback: true })
const counting = computed(() => (failed.value || lost.value) && feed.retryAt !== null)
watch(counting, (on) => {
  if (on) {
    ticker.resume()
  } else {
    ticker.pause()
  }
}, { immediate: true })

// "Retrying in N s" while waiting out the backoff, "Reconnecting…" during an attempt
const retryText = computed(() => {
  const at = feed.retryAt
  if (at === null) {
    return t("sekaiStation.connection.reconnecting")
  }
  return t("sekaiStation.connection.retryIn", { n: Math.max(1, Math.ceil((at - now.value) / 1000)) })
})
</script>

<template>
  <!-- Focusable so keyboard focus has somewhere to go when the last room it was on is removed -->
  <section
    :aria-label="t('sekaiStation.rooms.list')"
    :aria-busy="waiting && !failed ? 'true' : undefined"
    tabindex="-1"
    class="flex min-w-0 flex-col gap-3 outline-none"
  >
    <Alert v-if="!feed.configured">
      <LucideInfo aria-hidden="true" />
      <AlertDescription>{{ t("sekaiStation.notConfigured") }}</AlertDescription>
    </Alert>

    <template v-else>
      <StationActiveFilters />

      <!-- Could not connect and nothing to show yet. Only the failure is announced:
           the countdown changes every second, so it stays out of the live region. -->
      <Card v-if="failed">
        <CardContent class="flex flex-col items-center gap-2 py-10 text-center">
          <LucideWifiOff class="size-8 text-destructive/70" aria-hidden="true" />
          <p class="text-sm text-muted-foreground" role="alert">{{ t("sekaiStation.connection.failed") }}</p>
          <p class="text-xs text-muted-foreground tabular-nums">{{ retryText }}</p>
        </CardContent>
      </Card>

      <!-- First connection in progress -->
      <div v-else-if="waiting" class="flex flex-col gap-2">
        <div
          v-for="index in 3"
          :key="index"
          class="flex items-start gap-3 rounded-lg border bg-card px-3 py-2.5 sm:px-4"
          aria-hidden="true"
        >
          <!-- Same box as StationRoomCard, so nothing jumps when the rooms arrive -->
          <Skeleton class="h-7 w-16 shrink-0" />
          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <div class="flex items-center gap-2">
              <Skeleton class="h-4 w-24" />
              <Skeleton class="ml-auto h-3 w-10" />
            </div>
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-2/3" />
          </div>
        </div>
        <p class="py-1 text-center text-xs text-muted-foreground" role="status">{{ t("sekaiStation.rooms.loading") }}</p>
      </div>

      <template v-else>
        <!-- Connection lost after rooms were shown; as above, the countdown is not announced -->
        <div
          v-if="lost"
          class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          <LucideWifiOff class="size-3.5 shrink-0" aria-hidden="true" />
          <span class="font-medium" role="status">{{ t("sekaiStation.connection.disconnected") }}</span>
          <span aria-hidden="true">·</span>
          <span class="tabular-nums">{{ retryText }}</span>
        </div>

        <Card v-if="empty">
          <CardContent class="flex flex-col items-center gap-3 py-12 text-center">
            <component
              :is="prefs.hasActiveFilters ? LucideFilterX : LucideInbox"
              class="size-8 text-muted-foreground/60"
              aria-hidden="true"
            />
            <p class="text-sm text-muted-foreground">
              {{ prefs.hasActiveFilters ? t("sekaiStation.rooms.emptyFiltered") : t("sekaiStation.rooms.empty") }}
            </p>
          </CardContent>
        </Card>

        <div v-else class="flex flex-col gap-2">
          <StationRoomItem v-for="entry in feed.displayItems" :key="entry.key" :entry="entry" />
        </div>

        <!-- Pinned rooms are listed while the first burst is still on its way -->
        <p v-if="!feed.ready" class="py-1 text-center text-xs text-muted-foreground" role="status">
          {{ t("sekaiStation.rooms.loading") }}
        </p>
      </template>
    </template>
  </section>
</template>
