<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { UserRound, X } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { useRankBorderContext } from "../composables/rank-border-context"
import type { DetailState } from "../lib/rank-border-types"
import RankDetailHonorItem from "./RankDetailHonorItem.vue"

const { t } = useI18n()

withDefaults(defineProps<{ activeDetail: DetailState; showClose?: boolean }>(), {
  showClose: false,
})
const emit = defineEmits<{ close: [] }>()

const { detail, honors, ui } = useRankBorderContext()

const {
  formatDetailRank,
  formatDetailBadge,
  detailBadgeClass,
  richDetailTitleSegments,
} = detail
const {
  isLatestResult,
  leaderThumbnailUrl,
  leaderCardFrameUrl,
  leaderAttrIconUrl,
  leaderRareIconUrl,
  leaderRareCount,
  leaderMasterRankUrl,
  leaderCardLabel,
  leaderLevelLabel,
  leaderMasterRankLabel,
  profileHonorViews,
  detailHonorKeyScope,
  hideBrokenImage,
  resetRecoveredImage,
} = honors
const {
  shouldRenderProfileAssets,
  detailScoreChanged,
  formatPt,
  formatTimestamp,
  richUserLabelSegments,
  richNameSegmentStyle,
} = ui
</script>

<template>
  <section class="rank-border-detail-profile rounded-md border bg-muted/15 p-3">
    <div
      :class="[
        'rank-border-detail-profile__body',
        shouldRenderProfileAssets ? 'rank-border-detail-profile__body--assets' : 'rank-border-detail-profile__body--plain',
      ]"
    >
      <div
        v-if="shouldRenderProfileAssets"
        class="rank-border-leader rank-border-leader--dialog"
      >
        <img
          v-if="leaderThumbnailUrl(activeDetail.result)"
          class="rank-border-leader__base"
          :src="leaderThumbnailUrl(activeDetail.result) ?? ''"
          :alt="leaderCardLabel(activeDetail.result) ?? ''"
          loading="lazy"
          @load="resetRecoveredImage"
          @error="hideBrokenImage"
        >
        <UserRound v-else class="rank-border-leader__fallback size-7" />
        <span v-if="leaderThumbnailUrl(activeDetail.result)" class="rank-border-leader__level-band" aria-hidden="true" />
        <span v-if="leaderLevelLabel(activeDetail.result)" class="rank-border-leader__level">{{ leaderLevelLabel(activeDetail.result) }}</span>
        <img
          v-if="leaderCardFrameUrl(activeDetail.result)"
          class="rank-border-leader__frame"
          :src="leaderCardFrameUrl(activeDetail.result) ?? ''"
          alt=""
          loading="lazy"
          @load="resetRecoveredImage"
          @error="hideBrokenImage"
        >
        <img
          v-if="leaderAttrIconUrl(activeDetail.result)"
          class="rank-border-leader__attr"
          :src="leaderAttrIconUrl(activeDetail.result) ?? ''"
          alt=""
          loading="lazy"
          @load="resetRecoveredImage"
          @error="hideBrokenImage"
        >
        <span v-if="leaderRareIconUrl(activeDetail.result) && leaderRareCount(activeDetail.result) > 0" class="rank-border-leader__stars" aria-hidden="true">
          <img
            v-for="starIndex in leaderRareCount(activeDetail.result)"
            :key="starIndex"
            class="rank-border-leader__star"
            :src="leaderRareIconUrl(activeDetail.result) ?? ''"
            alt=""
            loading="lazy"
            @load="resetRecoveredImage"
            @error="hideBrokenImage"
          >
        </span>
        <img
          v-if="leaderMasterRankUrl(activeDetail.result)"
          class="rank-border-leader__train-rank"
          :src="leaderMasterRankUrl(activeDetail.result) ?? ''"
          :alt="leaderMasterRankLabel(activeDetail.result) ?? ''"
          loading="lazy"
          @load="resetRecoveredImage"
          @error="hideBrokenImage"
        >
      </div>
      <div class="rank-border-detail-profile__copy">
        <div class="flex min-w-0 items-start justify-between gap-2">
          <p class="min-w-0 flex-1 truncate text-sm font-semibold">
            <span
              v-for="segment in richDetailTitleSegments(activeDetail)"
              :key="segment.key"
              :style="richNameSegmentStyle(segment)"
            >
              {{ segment.text }}
            </span>
          </p>
          <div class="flex shrink-0 items-center gap-1.5">
            <span
              :class="[
                'inline-flex shrink-0 rounded-md border px-2 py-1 text-xs font-medium',
                detailBadgeClass(activeDetail),
              ]"
            >
              {{ formatDetailBadge(activeDetail) }}
            </span>
            <Button
              v-if="showClose"
              type="button"
              variant="ghost"
              size="icon"
              class="size-8 shrink-0"
              :aria-label="t('common.close')"
              @click="emit('close')"
            >
              <X class="size-4" />
            </Button>
          </div>
        </div>
        <p class="truncate text-sm text-muted-foreground">
          <span
            v-for="segment in richUserLabelSegments(isLatestResult(activeDetail.result) ? activeDetail.result : null)"
            :key="segment.key"
            :style="richNameSegmentStyle(segment)"
          >
            {{ segment.text }}
          </span>
        </p>
        <div class="rank-border-detail-profile__score">
          <p class="rank-border-detail-rank">{{ formatDetailRank(activeDetail) }}</p>
          <p
            :class="[
              'rank-border-live-number rank-border-detail-score',
              detailScoreChanged ? 'rank-border-live-number--changed' : '',
            ]"
          >
            {{ formatPt(activeDetail.result.score) }}
          </p>
        </div>
        <p class="mt-1 truncate text-xs text-muted-foreground">{{ t("rankBorder.result.latestPlain") }} {{ formatTimestamp(activeDetail.result.timestamp) }}</p>
      </div>
      <div
        v-if="shouldRenderProfileAssets && profileHonorViews(activeDetail.result, 3, detailHonorKeyScope(activeDetail)).length > 0"
        class="rank-border-honor-strip rank-border-honor-strip--detail"
      >
      <RankDetailHonorItem
        v-for="honor in profileHonorViews(activeDetail.result, 3, detailHonorKeyScope(activeDetail))"
        :key="honor.key"
        :honor="honor"
      />
      </div>
    </div>
  </section>
</template>

<style scoped>
@font-face {
  font-family: "RankBorderSourceHanSansSC";
  font-display: swap;
  font-style: normal;
  font-weight: 700;
  src: url("/rank-border/fonts/SourceHanSansSC-Bold.ttf") format("truetype");
}

.rank-border-live-number {
  display: inline-block;
  align-items: baseline;
  backface-visibility: hidden;
  transform-origin: center;
  transition: color 180ms ease, opacity 180ms ease;
  will-change: transform, color;
}

.rank-border-live-number--changed {
  color: rgb(5 150 105);
  animation: rank-border-number-lift 520ms cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes rank-border-number-lift {
  0% {
    transform: translateY(0);
    filter: brightness(1);
  }

  38% {
    transform: translateY(-0.12rem);
    filter: brightness(1.12);
  }

  100% {
    transform: translateY(0);
    filter: brightness(1);
  }
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
  font-size: 0.55rem;
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

.rank-border-leader--dialog {
  width: 4rem;
  height: 4rem;
}

.rank-border-honor-strip {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.25rem;
  overflow: visible;
}

.rank-border-honor-strip--detail {
  flex-wrap: nowrap;
  gap: 0.375rem;
  grid-column: 1 / -1;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}

.rank-border-detail-profile {
  min-height: 0;
  overflow: hidden;
}

.rank-border-detail-profile {
  display: grid;
  align-self: start;
}

.rank-border-detail-profile__body {
  display: grid;
  min-width: 0;
  min-height: 0;
  align-content: start;
  align-items: start;
  gap: 0.75rem;
}

.rank-border-detail-profile__body--assets {
  grid-template-columns: auto minmax(0, 1fr);
}

.rank-border-detail-profile__body--plain {
  grid-template-columns: minmax(0, 1fr);
}

.rank-border-detail-profile__copy {
  display: grid;
  min-width: 0;
  align-content: start;
}

.rank-border-detail-profile__score {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.25rem 0.75rem;
  margin-top: 0.25rem;
}

.rank-border-detail-rank {
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  font-size: clamp(1.5rem, 2.4vw, 2.25rem);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1.05;
}

.rank-border-detail-score {
  max-width: 100%;
  overflow-wrap: anywhere;
  padding-bottom: 0.125rem;
  font-size: clamp(0.9375rem, 1.45vw, 1.25rem);
  font-variant-numeric: tabular-nums;
  font-weight: 650;
  line-height: 1.1;
}

@media (min-width: 768px) and (max-width: 1180px) {
  .rank-border-leader--dialog {
    width: 3.25rem;
    height: 3.25rem;
  }

  .rank-border-detail-profile {
    padding: 0.75rem;
  }

  .rank-border-detail-profile__body {
    gap: 0.625rem;
  }
}

@media (min-width: 768px) and (max-width: 900px) {
  .rank-border-detail-profile {
    min-height: auto;
    overflow: visible;
  }

  .rank-border-detail-profile__body--assets {
    grid-template-columns: auto minmax(0, 1fr);
  }
}

@media (min-width: 768px) and (max-height: 840px) {
  .rank-border-detail-profile {
    padding: 0.625rem;
  }

  .rank-border-detail-rank {
    font-size: clamp(1.25rem, 2vw, 1.75rem);
  }

  .rank-border-detail-score {
    font-size: clamp(0.875rem, 1.35vw, 1.0625rem);
  }

  .rank-border-leader--dialog {
    width: 3rem;
    height: 3rem;
  }
}

@media (max-width: 767px) {
  .rank-border-detail-profile {
    min-height: auto;
    overflow: visible;
  }

  .rank-border-detail-profile {
    padding: 0.625rem;
  }

  .rank-border-detail-profile__body {
    align-items: start;
    gap: 0.5rem 0.625rem;
  }

  .rank-border-detail-profile__body--assets {
    grid-template-columns: 2.85rem minmax(0, 1fr);
  }

  .rank-border-leader--dialog {
    width: 2.85rem;
    height: 2.85rem;
  }

  .rank-border-detail-profile__copy {
    align-content: start;
  }

  .rank-border-detail-profile__score {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    gap: 0.125rem;
  }

  .rank-border-detail-rank {
    font-size: 1.625rem;
  }

  .rank-border-detail-score {
    min-width: 0;
    overflow: visible;
    font-size: 0.9375rem;
    overflow-wrap: anywhere;
    white-space: normal;
  }
}
</style>
