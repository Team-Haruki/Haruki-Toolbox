<script setup lang="ts">
import { onBeforeUnmount } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { useRankBorderContext } from "../composables/rank-border-context"
import { TRACKER_UPDATE_INTERVAL_SECONDS } from "../lib/rank-border-constants"

const { t } = useI18n()

const { ui } = useRankBorderContext()
const {
  activityReplayReady,
  playbackStatusLabel,
  isPlaybackLive,
  playbackDraftAt,
  resetPlaybackLive,
  replayBounds,
  playbackDisplayAt,
  formatReplayTick,
  updatePlaybackDraft,
  commitPlaybackDraft,
} = ui

// The slider spans the whole event in 10 s steps (tens of thousands of
// them), so arrow keys move by ten minutes and Page Up/Down by an hour, and
// a run of key presses turns into one overview request once the keys rest.
const KEY_STEP_SECONDS = 10 * 60
const PAGE_STEP_SECONDS = 60 * 60
const KEY_COMMIT_DELAY_MS = 350

let keyCommitTimer: ReturnType<typeof setTimeout> | null = null

function clearKeyCommitTimer() {
  if (keyCommitTimer != null) {
    clearTimeout(keyCommitTimer)
    keyCommitTimer = null
  }
}

function commitNow(event?: Event) {
  clearKeyCommitTimer()
  commitPlaybackDraft(event)
}

function handleKeydown(event: KeyboardEvent) {
  const direction = event.key === "ArrowLeft" || event.key === "ArrowDown" || event.key === "PageDown"
    ? -1
    : event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "PageUp"
      ? 1
      : event.key === "Home" ? -Infinity : event.key === "End" ? Infinity : 0
  if (direction === 0) {
    return
  }

  event.preventDefault()
  const step = event.key.startsWith("Page") ? PAGE_STEP_SECONDS : KEY_STEP_SECONDS
  const { start, end } = replayBounds.value
  const next = Number.isFinite(direction)
    ? Math.min(end, Math.max(start, playbackDisplayAt.value + direction * step))
    : direction < 0 ? start : end
  playbackDraftAt.value = next
  clearKeyCommitTimer()
  keyCommitTimer = setTimeout(() => {
    keyCommitTimer = null
    commitPlaybackDraft()
  }, KEY_COMMIT_DELAY_MS)
}

onBeforeUnmount(clearKeyCommitTimer)
</script>

<template>
  <section v-if="activityReplayReady" class="rank-border-replay-rail">
    <div class="rank-border-replay-rail__meta">
      <div class="min-w-0">
        <p class="truncate text-sm font-medium">{{ t("rankBorder.sections.activityReplay") }}</p>
        <!-- Replay times are the viewer's wall clock, like the detail page says. -->
        <p class="truncate text-xs text-muted-foreground" :title="t('rankBorder.result.localTimeHint')">
          {{ playbackStatusLabel }} · {{ t("rankBorder.result.localTime") }}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        class="h-8 shrink-0"
        :disabled="isPlaybackLive && playbackDraftAt == null"
        @click="resetPlaybackLive"
      >
        {{ t("rankBorder.actions.backToLive") }}
      </Button>
    </div>
    <div class="rank-border-replay-rail__track">
      <span>{{ formatReplayTick(replayBounds.start) }}</span>
      <!-- Touch: the whole 40 px tall box moves the thumb, not just the 16 px track. -->
      <input
        class="rank-border-replay-range pointer-coarse:h-10"
        type="range"
        :min="replayBounds.start"
        :max="replayBounds.end"
        :step="TRACKER_UPDATE_INTERVAL_SECONDS"
        :value="playbackDisplayAt"
        :aria-label="t('rankBorder.sections.activityReplay')"
        :aria-valuetext="playbackStatusLabel"
        @input="updatePlaybackDraft"
        @keydown="handleKeydown"
        @change="commitNow"
        @pointerup="commitNow"
        @keyup.enter="commitNow"
      >
      <span>{{ formatReplayTick(replayBounds.end) }}</span>
    </div>
  </section>
</template>

<style scoped>
.rank-border-replay-rail {
  display: grid;
  gap: 0.5rem;
  border: 1px solid color-mix(in oklab, var(--border) 78%, transparent);
  border-radius: var(--radius);
  background: color-mix(in oklab, var(--background) 82%, transparent);
  padding: 0.625rem;
}

.rank-border-replay-rail__meta {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.rank-border-replay-rail__track {
  display: grid;
  min-width: 0;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.625rem;
  color: var(--muted-foreground);
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
}

.rank-border-replay-range {
  min-width: 0;
  accent-color: rgb(8 145 178);
}

@media (max-width: 380px) {
  .rank-border-replay-rail__track {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.375rem;
  }

  .rank-border-replay-rail__track span:last-child {
    text-align: right;
  }
}
</style>
