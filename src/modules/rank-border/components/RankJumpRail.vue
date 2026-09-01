<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRankBorderContext } from "../composables/rank-border-context"
import { PERSONAL_COLLECTION_LIMIT, TOP_100_RANKS } from "../lib/rank-border-constants"
import type { RankBorderJumpTarget } from "../lib/rank-border-types"

const { t } = useI18n()

const { live, ui } = useRankBorderContext()
const { segmentRows } = live
const {
  isMobileViewport,
  visibleRank,
  expandedRank,
  jumpToRank,
  formatRank,
  formatTargetRank,
  showRankBorderTooltip,
  hideRankBorderTooltip,
} = ui

const hoveredQuickJumpRank = ref<number | null>(null)

const quickJumpTargets = computed<RankBorderJumpTarget[]>(() => {
  const targetRanks = new Set<number>(TOP_100_RANKS)
  for (const line of segmentRows.value) {
    if (line.rank > PERSONAL_COLLECTION_LIMIT) {
      targetRanks.add(line.rank)
    }
  }

  return Array.from(targetRanks)
    .sort((a, b) => a - b)
    .map((rank, index) => {
      const progressRatio = targetRanks.size > 1 ? index / (targetRanks.size - 1) : 0
      return {
        rank,
        label: rank <= PERSONAL_COLLECTION_LIMIT ? formatRank(rank) : formatTargetRank(rank),
        value: String(index),
        progress: `${progressRatio * 100}%`,
        position: `calc(0.875rem + ${progressRatio} * (100% - 1.75rem))`,
        progressRatio,
      }
    })
})

const activeQuickJumpRank = computed(() =>
  visibleRank.value ?? expandedRank.value ?? null,
)
const activeQuickJumpTarget = computed(() => quickJumpTargetByRank(activeQuickJumpRank.value))
const activeQuickJumpIndex = computed(() => {
  const targets = quickJumpTargets.value
  if (targets.length === 0) {
    return 0
  }

  const activeRank = activeQuickJumpRank.value
  if (activeRank == null) {
    return 0
  }

  const exactIndex = targets.findIndex((target) => target.rank === activeRank)
  if (exactIndex >= 0) {
    return exactIndex
  }

  return targets.reduce((closestIndex, target, index) =>
    Math.abs(target.rank - activeRank) < Math.abs(targets[closestIndex].rank - activeRank)
      ? index
      : closestIndex, 0)
})
const hoveredQuickJumpTarget = computed(() => quickJumpTargetByRank(hoveredQuickJumpRank.value))
const mobileQuickJumpFillStyle = computed(() => {
  const target = hoveredQuickJumpTarget.value ?? activeQuickJumpTarget.value ?? quickJumpTargets.value[0] ?? null
  const progress = target ? `${target.progressRatio * 100}%` : "0%"
  const progressRatio = target ? String(target.progressRatio) : "0"
  return {
    "--rank-border-jump-progress": progress,
    "--rank-border-jump-progress-ratio": progressRatio,
  }
})

let quickJumpPreviewFrame: number | null = null
let quickJumpPreviewRank: number | null = null
let quickJumpPointerActive = false
let quickJumpCommitRank: number | null = null

onBeforeUnmount(() => {
  clearQuickJumpPreviewFrame()
})

function previewJumpToRank(rank: number) {
  if (!rank) {
    return
  }

  quickJumpPreviewRank = rank
  if (quickJumpPreviewFrame != null) {
    return
  }

  quickJumpPreviewFrame = requestAnimationFrame(() => {
    quickJumpPreviewFrame = null
    const targetRank = quickJumpPreviewRank
    quickJumpPreviewRank = null
    if (!targetRank) {
      return
    }

    document.querySelector<HTMLElement>(`[data-rank-border-row="${targetRank}"]`)?.scrollIntoView({
      behavior: "auto",
      block: "center",
    })
  })
}

function clearQuickJumpPreviewFrame() {
  if (quickJumpPreviewFrame == null) {
    return
  }

  cancelAnimationFrame(quickJumpPreviewFrame)
  quickJumpPreviewFrame = null
  quickJumpPreviewRank = null
}

function resolveQuickJumpRankFromPointer(event: MouseEvent) {
  const target = event.currentTarget
  if (!(target instanceof HTMLElement)) {
    return null
  }

  const targets = quickJumpTargets.value
  if (targets.length === 0) {
    return null
  }

  const rect = target.getBoundingClientRect()
  const style = window.getComputedStyle(target)
  const paddingLeft = Number.parseFloat(style.paddingLeft) || 0
  const paddingRight = Number.parseFloat(style.paddingRight) || 0
  const trackLeft = rect.left + paddingLeft
  const trackWidth = Math.max(1, rect.width - paddingLeft - paddingRight)
  const ratio = trackWidth > 0
    ? Math.min(1, Math.max(0, (event.clientX - trackLeft) / trackWidth))
    : 0
  const index = Math.round(ratio * (targets.length - 1))
  return targets[index]?.rank ?? null
}

function quickJumpTargetByRank(rank: number | null) {
  return quickJumpTargets.value.find((target) => target.rank === rank) ?? null
}

function quickJumpLabelStyle(target: RankBorderJumpTarget) {
  const transform = target.progressRatio < 0.08
    ? "translateX(0)"
    : target.progressRatio > 0.92
      ? "translateX(-100%)"
      : "translateX(-50%)"
  return {
    left: target.position,
    transform,
  }
}

function handleQuickJumpPointerDown(event: PointerEvent) {
  const rank = resolveQuickJumpRankFromPointer(event)
  if (!rank) {
    return
  }

  const target = quickJumpTargetByRank(rank)
  hoveredQuickJumpRank.value = rank
  if (!isMobileViewport.value) {
    return
  }

  event.preventDefault()
  if (target) {
    showRankBorderTooltip(event, target.label)
  }
  quickJumpPointerActive = true
  quickJumpCommitRank = rank
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  previewJumpToRank(rank)
}

function handleQuickJumpPointerMove(event: PointerEvent) {
  const rank = resolveQuickJumpRankFromPointer(event)
  const target = quickJumpTargetByRank(rank)
  hoveredQuickJumpRank.value = rank

  if (!isMobileViewport.value) {
    return
  }

  if (target) {
    showRankBorderTooltip(event, target.label)
  }
  if (!quickJumpPointerActive) {
    return
  }
  event.preventDefault()
  if (!rank || rank === quickJumpCommitRank) {
    return
  }

  quickJumpCommitRank = rank
  previewJumpToRank(rank)
}

function handleQuickJumpClick(event: MouseEvent) {
  if (isMobileViewport.value) {
    return
  }

  const rank = resolveQuickJumpRankFromPointer(event)
  if (rank) {
    jumpToRank(rank)
  }
}

function handleQuickJumpKeydown(event: KeyboardEvent) {
  const lastIndex = quickJumpTargets.value.length - 1
  let nextIndex = activeQuickJumpIndex.value

  switch (event.key) {
    case "ArrowLeft":
    case "ArrowDown":
      nextIndex = Math.max(0, nextIndex - 1)
      break
    case "ArrowRight":
    case "ArrowUp":
      nextIndex = Math.min(lastIndex, nextIndex + 1)
      break
    case "Home":
      nextIndex = 0
      break
    case "End":
      nextIndex = lastIndex
      break
    default:
      return
  }

  event.preventDefault()
  const target = quickJumpTargets.value[nextIndex]
  if (target) {
    jumpToRank(target.rank)
  }
}

function handleQuickJumpPointerEnd(event: PointerEvent) {
  const rank = quickJumpCommitRank ?? resolveQuickJumpRankFromPointer(event)
  if (!isMobileViewport.value) {
    return
  }

  event.preventDefault()
  quickJumpPointerActive = false
  quickJumpCommitRank = null
  hideRankBorderTooltip()
  if (event.currentTarget instanceof HTMLElement && event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId)
  }
  if (rank) {
    jumpToRank(rank)
  }
}

function handleQuickJumpPointerCancel(event: PointerEvent) {
  hoveredQuickJumpRank.value = null
  quickJumpPointerActive = false
  quickJumpCommitRank = null
  hideRankBorderTooltip()
  if (event.currentTarget instanceof HTMLElement && event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId)
  }
}

function handleQuickJumpPointerLeave() {
  hoveredQuickJumpRank.value = null
  if (!quickJumpPointerActive) {
    hideRankBorderTooltip()
  }
}
</script>

<template>
  <div
    v-if="quickJumpTargets.length > 0"
    class="rank-border-jump-rail"
  >
    <span class="shrink-0 text-xs font-medium text-muted-foreground">{{ t("rankBorder.sections.quickJump") }}</span>
    <div
      class="rank-border-jump-rail__bars"
      role="slider"
      tabindex="0"
      :aria-label="t('rankBorder.sections.quickJump')"
      aria-valuemin="0"
      :aria-valuemax="quickJumpTargets.length - 1"
      :aria-valuenow="activeQuickJumpIndex"
      :aria-valuetext="activeQuickJumpTarget?.label ?? quickJumpTargets[activeQuickJumpIndex]?.label"
      :style="mobileQuickJumpFillStyle"
      @click="handleQuickJumpClick"
      @keydown="handleQuickJumpKeydown"
      @pointerdown="handleQuickJumpPointerDown"
      @pointermove="handleQuickJumpPointerMove"
      @pointerup="handleQuickJumpPointerEnd"
      @pointercancel="handleQuickJumpPointerCancel"
      @lostpointercapture="handleQuickJumpPointerCancel"
      @pointerleave="handleQuickJumpPointerLeave"
    >
      <span
        v-if="hoveredQuickJumpTarget && !isMobileViewport"
        class="rank-border-jump-hover-label"
        :style="quickJumpLabelStyle(hoveredQuickJumpTarget)"
      >
        {{ hoveredQuickJumpTarget.label }}
      </span>
      <span
        v-for="target in quickJumpTargets"
        :key="target.rank"
        :class="[
          'rank-border-jump-bar',
          activeQuickJumpRank === target.rank ? 'rank-border-jump-bar--active' : '',
          hoveredQuickJumpRank === target.rank ? 'rank-border-jump-bar--hovered' : '',
        ]"
        :style="{ left: target.position }"
        aria-hidden="true"
      />
    </div>
  </div>
</template>

<style scoped>
.rank-border-jump-rail {
  position: sticky;
  top: 4rem;
  z-index: 24;
  display: grid;
  min-width: 0;
  grid-template-columns: max-content minmax(0, 1fr);
  align-items: center;
  gap: 0.875rem;
  overflow: visible;
  border: 1px solid color-mix(in oklab, var(--border) 78%, transparent);
  border-radius: 0.5rem;
  background: color-mix(in oklab, var(--background) 88%, transparent);
  padding: 0.875rem 0.875rem;
  box-shadow: 0 12px 30px rgb(15 23 42 / 0.1);
  backdrop-filter: blur(14px);
}

.rank-border-jump-rail__bars {
  --rank-border-jump-progress: 0%;
  --rank-border-jump-progress-ratio: 0;
  position: relative;
  display: block;
  min-width: 0;
  height: 1.5rem;
  flex: 1 1 auto;
  touch-action: pan-y;
  cursor: pointer;
  overflow: visible;
  border-radius: 9999px;
  background: transparent;
  box-shadow: none;
  padding: 0 0.875rem;
}

.rank-border-jump-rail__bars:focus-visible {
  outline: 2px solid color-mix(in oklab, var(--primary) 72%, transparent);
  outline-offset: 2px;
}

.rank-border-jump-rail__bars::before,
.rank-border-jump-rail__bars::after {
  position: absolute;
  right: 0.875rem;
  top: 50%;
  left: 0.875rem;
  height: 0.5rem;
  border-radius: 9999px;
  content: "";
  transform: translateY(-50%);
}

.rank-border-jump-rail__bars::before {
  background: color-mix(in oklab, var(--muted) 68%, transparent);
}

.rank-border-jump-rail__bars::after {
  right: calc(0.875rem + (1 - var(--rank-border-jump-progress-ratio)) * (100% - 1.75rem));
  background: rgb(8 145 178);
  box-shadow: inset 0 0 0 1px rgb(6 182 212 / 0.24);
}

.rank-border-jump-bar {
  appearance: none;
  position: absolute;
  top: 50%;
  width: 0;
  min-width: 0;
  max-width: 0;
  height: 0;
  border: 0;
  border-radius: 0.0625rem;
  background: transparent;
  cursor: inherit;
  opacity: 0;
  padding: 0;
  pointer-events: none;
  transform: translateX(-50%) translateY(-50%);
  transform-origin: center center;
  transition: background-color 140ms ease, height 140ms ease, opacity 140ms ease, transform 140ms ease, width 140ms ease;
}

.rank-border-jump-bar--active {
  background: rgb(6 182 212);
  width: 0.5rem;
  min-width: 0.5rem;
  max-width: 0.5rem;
  height: 0.9rem;
  border-radius: 9999px;
  opacity: 0.85;
  z-index: 1;
}

.rank-border-jump-bar--hovered {
  width: 0.625rem;
  min-width: 0.625rem;
  max-width: 0.625rem;
  height: 1.35rem;
  border-radius: 9999px;
  background: rgb(8 145 178);
  opacity: 1;
  transform: translateX(-50%) translateY(-50%);
  z-index: 2;
}

.rank-border-jump-hover-label {
  position: absolute;
  bottom: 100%;
  z-index: 2;
  max-width: min(10rem, 42vw);
  overflow: hidden;
  border: 1px solid color-mix(in oklab, rgb(8 145 178) 36%, var(--border));
  border-radius: 9999px;
  background: color-mix(in oklab, var(--background) 94%, rgb(236 254 255));
  box-shadow: 0 10px 24px rgb(15 23 42 / 0.14);
  color: color-mix(in oklab, rgb(8 145 178) 86%, var(--foreground));
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1;
  padding: 0.35rem 0.5rem;
  pointer-events: none;
  text-overflow: ellipsis;
  translate: 0 -0.375rem;
  white-space: nowrap;
}

@media (max-width: 767px) {
  .rank-border-jump-rail {
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
    gap: 0.5rem;
    overflow: hidden;
    padding: 0.5rem 0.625rem;
  }

  .rank-border-jump-rail__bars {
    height: 2.25rem;
    touch-action: none;
    cursor: ew-resize;
    overflow: hidden;
    border-radius: 9999px;
    background: linear-gradient(90deg, rgb(8 145 178) 0 var(--rank-border-jump-progress), color-mix(in oklab, var(--muted) 62%, transparent) var(--rank-border-jump-progress) 100%);
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--border) 54%, transparent);
    padding: 0 0.875rem;
  }

  .rank-border-jump-rail__bars::before,
  .rank-border-jump-rail__bars::after {
    display: none;
  }

  .rank-border-jump-bar,
  .rank-border-jump-bar--active,
  .rank-border-jump-bar--hovered {
    display: none;
  }
}
</style>
