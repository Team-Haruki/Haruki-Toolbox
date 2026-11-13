<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useIntervalFn } from "@vueuse/core"
import { Button } from "@/components/ui/button"
import { useStationReducedMotion } from "@/modules/sekai-station/composables/useStationReducedMotion"
import { resolveConnectionStatus, retrySecondsLeft } from "@/modules/sekai-station/lib/station-status"
import { useSekaiStationFeedStore } from "@/modules/sekai-station/stores/sekai-station-feed"

/**
 * The stream's state in one line: connected with the number of people
 * online, or disconnected with the time to the next attempt. `retry` adds a
 * "retry now" button, for when the list below has no retry of its own.
 */
defineProps<{ retry?: boolean }>()

const { t } = useI18n()
const feed = useSekaiStationFeedStore()
const reducedMotion = useStationReducedMotion()

const status = computed(() => resolveConnectionStatus(feed.connectionState, feed.connectFailed))

const label = computed(() => {
  if (status.value === "open") {
    return t("sekaiStation.connection.connected")
  }
  if (status.value === "lost") {
    return t("sekaiStation.connection.disconnected")
  }
  return status.value === "connecting" ? t("sekaiStation.connection.connecting") : ""
})

// The hues carry the usual meaning of a connection light
const dotClass = computed(() => {
  if (status.value === "open") {
    return "bg-emerald-500 dark:bg-emerald-400"
  }
  if (status.value === "lost") {
    return "bg-destructive"
  }
  return ["bg-amber-500 dark:bg-amber-400", reducedMotion.value ? "" : "animate-pulse"]
})

// Ticks faster than the countdown's 1 s steps so the number is never a second
// stale, and only while a countdown is on screen
const now = ref(Date.now())
const ticker = useIntervalFn(() => {
  now.value = Date.now()
}, 200, { immediate: false, immediateCallback: true })
const counting = computed(() => status.value === "lost" && feed.retryAt !== null)
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
  return at === null
    ? t("sekaiStation.connection.reconnecting")
    : t("sekaiStation.connection.retryIn", { n: retrySecondsLeft(at, now.value) })
})
</script>

<template>
  <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground" data-slot="station-status">
    <!-- Only the state is announced: the countdown changes every second, so it stays out of the live region -->
    <span class="inline-flex min-h-5 items-center gap-1.5" aria-live="polite">
      <template v-if="status !== 'idle'">
        <span :class="['size-2 shrink-0 rounded-full', dotClass]" aria-hidden="true" />
        <span :class="status === 'lost' ? 'font-medium text-destructive' : ''">{{ label }}</span>
      </template>
    </span>

    <template v-if="status === 'lost'">
      <span class="tabular-nums">{{ retryText }}</span>
      <!-- Skips the remaining backoff instead of making the user wait it out -->
      <Button
        v-if="retry"
        type="button"
        variant="ghost"
        size="sm"
        class="-my-1 h-7 px-2 text-xs text-foreground"
        :disabled="feed.retryAt === null"
        @click="feed.retryImmediately()"
      >
        {{ t("sekaiStation.connection.retryNow") }}
      </Button>
    </template>

    <!-- Only while the stream is open, as in Station: the last count goes stale once it drops -->
    <span v-else-if="feed.statistic && status === 'open'" class="tabular-nums">
      {{ t("sekaiStation.connection.online", { n: feed.statistic.online }) }}
    </span>
  </div>
</template>
