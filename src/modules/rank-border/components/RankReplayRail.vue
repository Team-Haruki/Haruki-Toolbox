<script setup lang="ts">
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
</script>

<template>
  <section v-if="activityReplayReady" class="rank-border-replay-rail">
    <div class="rank-border-replay-rail__meta">
      <div class="min-w-0">
        <p class="truncate text-sm font-medium">{{ t("rankBorder.sections.activityReplay") }}</p>
        <p class="truncate text-xs text-muted-foreground">{{ playbackStatusLabel }}</p>
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
      <input
        class="rank-border-replay-range"
        type="range"
        :min="replayBounds.start"
        :max="replayBounds.end"
        :step="TRACKER_UPDATE_INTERVAL_SECONDS"
        :value="playbackDisplayAt"
        :aria-label="t('rankBorder.sections.activityReplay')"
        @input="updatePlaybackDraft"
        @change="commitPlaybackDraft"
        @pointerup="commitPlaybackDraft"
        @keyup.enter="commitPlaybackDraft"
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
  border-radius: 0.5rem;
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
