<script setup lang="ts">
import { UserRound } from "lucide-vue-next"
import { hideBrokenImage, resetRecoveredImage } from "../lib/image-retry"
import type { RankBorderLeaderVisual } from "../lib/honor-visuals"

/**
 * Composited leader-card avatar (thumbnail + frame + attribute + rarity stars
 * + master rank + level band). One component now serves both the leaderboard
 * rows and the detail profile — the old code carried three CSS copies.
 */
defineProps<{
  leader: RankBorderLeaderVisual | null
  variant?: "row" | "detail"
}>()
</script>

<template>
  <span :class="['rank-border-leader', variant === 'detail' ? 'rank-border-leader--detail' : 'rank-border-leader--row']">
    <img
      v-if="leader?.thumbnailUrl"
      class="rank-border-leader__base"
      :src="leader.thumbnailUrl"
      :alt="leader.cardLabel ?? ''"
      loading="lazy"
      decoding="async"
      @load="resetRecoveredImage"
      @error="hideBrokenImage"
    >
    <UserRound v-else class="rank-border-leader__fallback size-4" />
    <span v-if="leader?.thumbnailUrl" class="rank-border-leader__level-band" aria-hidden="true" />
    <span v-if="leader?.levelLabel" class="rank-border-leader__level">{{ leader.levelLabel }}</span>
    <img
      v-if="leader?.frameUrl"
      class="rank-border-leader__frame"
      :src="leader.frameUrl"
      alt=""
      loading="lazy"
      decoding="async"
      @load="resetRecoveredImage"
      @error="hideBrokenImage"
    >
    <img
      v-if="leader?.attrIconUrl"
      class="rank-border-leader__attr"
      :src="leader.attrIconUrl"
      alt=""
      loading="lazy"
      decoding="async"
      @load="resetRecoveredImage"
      @error="hideBrokenImage"
    >
    <span v-if="leader?.rareIconUrl && leader.rareCount > 0" class="rank-border-leader__stars" aria-hidden="true">
      <img
        v-for="starIndex in leader.rareCount"
        :key="starIndex"
        class="rank-border-leader__star"
        :src="leader.rareIconUrl"
        alt=""
        loading="lazy"
        decoding="async"
        @load="resetRecoveredImage"
        @error="hideBrokenImage"
      >
    </span>
    <img
      v-if="leader?.masterRankUrl"
      class="rank-border-leader__train-rank"
      :src="leader.masterRankUrl"
      :alt="leader.masterRankLabel ?? ''"
      loading="lazy"
      decoding="async"
      @load="resetRecoveredImage"
      @error="hideBrokenImage"
    >
  </span>
</template>

<style scoped>
@font-face {
  font-family: "RankBorderSourceHanSansSC";
  font-display: swap;
  font-style: normal;
  font-weight: 700;
  src: url("/rank-border/fonts/SourceHanSansSC-Bold.ttf") format("truetype");
}

.rank-border-leader {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 7.8125%;
  background: var(--muted);
  color: var(--muted-foreground);
  container-type: inline-size;
  isolation: isolate;
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--border) 82%, transparent),
    0 0.1875rem 0.5rem rgb(15 23 42 / 0.12);
}

.rank-border-leader--row {
  width: 3.5rem;
  height: 3.5rem;
}

.rank-border-leader--detail {
  width: 4rem;
  height: 4rem;
}

.rank-border-leader :where(img) {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.rank-border-leader__base {
  z-index: 0;
  object-fit: cover;
}

.rank-border-leader__fallback {
  position: relative;
  z-index: 1;
}

.rank-border-leader__level-band {
  position: absolute;
  z-index: 1;
  inset-inline: 0;
  bottom: 0;
  height: 18.75%;
  background: rgb(70 70 100);
  content: "";
  pointer-events: none;
}

.rank-border-leader__frame {
  z-index: 2;
  object-fit: fill;
}

.rank-border-leader__attr {
  position: absolute;
  inset: 0 auto auto 0;
  z-index: 4;
  width: 24%;
  height: 25%;
  object-fit: contain;
  pointer-events: none;
}

.rank-border-leader__stars {
  position: absolute;
  z-index: 5;
  inset-inline-start: 5%;
  bottom: 20%;
  display: flex;
  width: 72%;
  height: 15%;
  gap: 1px;
  pointer-events: none;
}

.rank-border-leader__stars .rank-border-leader__star {
  position: static;
  flex: 0 0 18%;
  min-width: 0;
  width: 18%;
  height: 100%;
  object-fit: contain;
}

.rank-border-leader__level {
  position: absolute;
  z-index: 5;
  inset-block-start: auto;
  inset-inline-start: 4.6875%;
  bottom: 2.5%;
  width: 52%;
  min-width: 0;
  overflow: visible;
  color: white;
  font-family: "RankBorderSourceHanSansSC", "Source Han Sans SC", "Source Han Sans CN", "Noto Sans CJK SC", sans-serif;
  font-size: clamp(0.42rem, 13.2cqw, 0.72rem);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.rank-border-leader__train-rank {
  inset: auto 0 0 auto;
  z-index: 5;
  width: 35%;
  height: 35%;
  object-fit: contain;
}

@media (max-width: 767px) {
  .rank-border-leader--row {
    width: 2.65rem;
    height: 2.65rem;
  }

  .rank-border-leader--detail {
    width: 2.85rem;
    height: 2.85rem;
  }
}
</style>
