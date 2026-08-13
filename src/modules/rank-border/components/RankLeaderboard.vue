<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { ChartLine, RefreshCcw, UserRound } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { useRankBorderContext } from "../composables/rank-border-context"
import { HONOR_BONDS_MASK_URL } from "../lib/rank-border-constants"

const { t } = useI18n()

const { query, live, detail, honors, ui } = useRankBorderContext()

const { selectedEvent, intervalOptions, intervalSeconds } = query
const {
  tracker,
  liveRefreshing,
  canRefresh,
  top100Rows,
  hasTop100Data,
  segmentRows,
  hasSegmentData,
  refreshData,
} = live
const {
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
  rowHonorKeyScope,
  honorSvgId,
  honorFrameSvgAttrs,
  honorRankSvgAttrs,
  loadedHonorLevelStars,
  preloadedRankBorderImageUrl,
  isRankBorderImageLoaded,
  areRankBorderImagesLoaded,
  hideBrokenImage,
  resetRecoveredImage,
} = honors
const {
  detail: activeDetail,
  detailLoading,
  detailError,
  openRankDetail,
  openLineDetail,
  openMobileRankDetail,
  openMobileLineDetail,
  openDetailFromMobileFact,
  isMobileDetailExpanded,
  isMobileExpandedTarget,
  formatDetailRank,
  previousDetailLabel,
  nextDetailLabel,
  detailDelta,
  richDetailTitleSegments,
} = detail
const {
  isMobileViewport,
  shouldRenderProfileAssets,
  formatRank,
  formatTargetRank,
  formatPt,
  formatGrowth,
  formatElapsed,
  elapsedSince,
  richUserLabelSegments,
  richNameSegmentStyle,
} = ui
</script>

<template>
  <div class="grid min-w-0 content-start gap-3">
  <section class="grid min-w-0 gap-3 rounded-md border bg-muted/10 p-2.5 sm:p-3">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <h2 class="truncate text-base font-semibold">{{ selectedEvent?.label ?? t("rankBorder.sections.lines") }}</h2>
        <p class="text-sm text-muted-foreground">
          {{ t("rankBorder.sections.linesDescription") }}
        </p>
      </div>
    </div>

    <div v-if="tracker.error.value" class="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0 space-y-1">
        <p class="text-sm font-medium text-destructive">{{ t("rankBorder.result.loadErrorTitle") }}</p>
        <p class="text-xs text-muted-foreground">{{ t("rankBorder.result.loadErrorHint") }}</p>
        <p class="break-all text-xs text-destructive/70">{{ tracker.error.value }}</p>
      </div>
      <Button variant="outline" size="sm" class="shrink-0" :disabled="!canRefresh || liveRefreshing" @click="refreshData(true)">
        <RefreshCcw :class="['size-4', liveRefreshing ? 'animate-spin' : '']" />
        {{ t("rankBorder.actions.retry") }}
      </Button>
    </div>

    <div v-if="!hasTop100Data" class="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
      {{ t("rankBorder.result.emptyLines") }}
    </div>
    <div v-else class="rank-border-table-shell rounded-md border bg-background/80">
      <div class="rank-border-table-header rank-border-top-header">
        <span>{{ t("rankBorder.table.rank") }}</span>
        <span>{{ t("rankBorder.table.player") }}</span>
        <span class="text-right">{{ t("rankBorder.table.score") }}</span>
      </div>
      <TransitionGroup name="rank-border-row" tag="div" class="rank-border-top-list">
        <div
          v-for="row in top100Rows"
          :key="row.key"
          :data-rank-border-row="row.rank"
          class="rank-border-top-item border-b last:border-b-0"
        >
          <button
            type="button"
            :class="[
              'rank-border-table-row rank-border-top-row text-left transition-colors hover:bg-cyan-50/60 dark:hover:bg-cyan-500/10',
              row.rank <= 3 ? 'bg-cyan-50/55 dark:bg-cyan-500/10' : 'bg-background/80',
              row.selected ? 'ring-1 ring-cyan-500/50' : '',
            ]"
            @click="isMobileViewport ? openMobileRankDetail(row.rank) : openRankDetail(row.rank)"
          >
            <div class="rank-border-rank-cell">
              <span
                :class="[
                  'inline-flex min-w-10 justify-center rounded-md border px-1.5 py-1 text-xs font-semibold tabular-nums sm:min-w-12 sm:px-2 sm:text-sm',
                  row.rank === 1 ? 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100' : '',
                  row.rank === 2 ? 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-100' : '',
                  row.rank === 3 ? 'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-100' : '',
                  row.rank > 3 ? 'bg-background text-foreground' : '',
                ]"
              >
                {{ formatRank(row.rank) }}
              </span>
            </div>

            <div class="rank-border-player-scroll">
              <div
                :class="[
                  'rank-border-player-track',
                  shouldRenderProfileAssets ? 'rank-border-player-track--assets' : 'rank-border-player-track--plain',
                ]"
              >
                <div
                  v-if="shouldRenderProfileAssets"
                  class="rank-border-leader rank-border-leader--row"
                >
                  <img
                    v-if="leaderThumbnailUrl(row.detail)"
                    class="rank-border-leader__base"
                    :src="leaderThumbnailUrl(row.detail) ?? ''"
                    :alt="leaderCardLabel(row.detail) ?? ''"
                    loading="lazy"
                    @load="resetRecoveredImage"
                    @error="hideBrokenImage"
                  >
                  <UserRound v-else class="rank-border-leader__fallback size-4" />
                  <span v-if="leaderThumbnailUrl(row.detail)" class="rank-border-leader__level-band" aria-hidden="true" />
                  <span v-if="leaderLevelLabel(row.detail)" class="rank-border-leader__level">{{ leaderLevelLabel(row.detail) }}</span>
                  <img
                    v-if="leaderCardFrameUrl(row.detail)"
                    class="rank-border-leader__frame"
                    :src="leaderCardFrameUrl(row.detail) ?? ''"
                    alt=""
                    loading="lazy"
                    @load="resetRecoveredImage"
                    @error="hideBrokenImage"
                  >
                  <img
                    v-if="leaderAttrIconUrl(row.detail)"
                    class="rank-border-leader__attr"
                    :src="leaderAttrIconUrl(row.detail) ?? ''"
                    alt=""
                    loading="lazy"
                    @load="resetRecoveredImage"
                    @error="hideBrokenImage"
                  >
                  <span v-if="leaderRareIconUrl(row.detail) && leaderRareCount(row.detail) > 0" class="rank-border-leader__stars" aria-hidden="true">
                    <img
                      v-for="starIndex in leaderRareCount(row.detail)"
                      :key="starIndex"
                      class="rank-border-leader__star"
                      :src="leaderRareIconUrl(row.detail) ?? ''"
                      alt=""
                      loading="lazy"
                      @load="resetRecoveredImage"
                      @error="hideBrokenImage"
                    >
                  </span>
                  <img
                    v-if="leaderMasterRankUrl(row.detail)"
                    class="rank-border-leader__train-rank"
                    :src="leaderMasterRankUrl(row.detail) ?? ''"
                    :alt="leaderMasterRankLabel(row.detail) ?? ''"
                    loading="lazy"
                    @load="resetRecoveredImage"
                    @error="hideBrokenImage"
                  >
                </div>
                <div class="rank-border-player-copy">
                  <p class="rank-border-player-name">
                    <span
                      v-for="segment in richUserLabelSegments(row.detail, t('rankBorder.result.noPlayer'))"
                      :key="segment.key"
                      :style="richNameSegmentStyle(segment)"
                    >
                      {{ segment.text }}
                    </span>
                  </p>
                  <div v-if="shouldRenderProfileAssets && profileHonorViews(row.detail, 3, rowHonorKeyScope(row)).length > 0" class="rank-border-honor-strip rank-border-honor-strip--row">
                  <span
                    v-for="honor in profileHonorViews(row.detail, 3, rowHonorKeyScope(row))"
                    :key="honor.key"
                    class="rank-border-honor rank-border-honor--row"
                  >
                    <span v-if="honor.type === 'normal' && honor.baseUrl" class="rank-border-honor-visual">
                      <svg
                        v-if="isRankBorderImageLoaded(honor.baseUrl)"
                        class="rank-border-honor-svg"
                        viewBox="0 0 180 80"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <image
                          v-if="preloadedRankBorderImageUrl(honor.baseUrl)"
                          :href="preloadedRankBorderImageUrl(honor.baseUrl) ?? ''" x="0" y="0" width="180" height="80" preserveAspectRatio="none"
                          @load="resetRecoveredImage"
                          @error="hideBrokenImage"
                        />
                        <image
                          v-if="preloadedRankBorderImageUrl(honor.frameUrl)"
                          :href="preloadedRankBorderImageUrl(honor.frameUrl) ?? ''"
                          v-bind="honorFrameSvgAttrs(honor)"
                          preserveAspectRatio="none"
                          @load="resetRecoveredImage"
                          @error="hideBrokenImage"
                        />
                        <image
                          v-if="preloadedRankBorderImageUrl(honor.rankUrl)"
                          :href="preloadedRankBorderImageUrl(honor.rankUrl) ?? ''"
                          v-bind="honorRankSvgAttrs(honor)"
                          preserveAspectRatio="none"
                          @load="resetRecoveredImage"
                          @error="hideBrokenImage"
                        />
                        <image
                          v-if="preloadedRankBorderImageUrl(honor.scrollUrl)"
                          :href="preloadedRankBorderImageUrl(honor.scrollUrl) ?? ''"
                          x="37"
                          y="3"
                          width="101"
                          height="75"
                          preserveAspectRatio="none"
                          @load="resetRecoveredImage"
                          @error="hideBrokenImage"
                        />
                        <image
                          v-for="star in loadedHonorLevelStars(honor)"
                          :key="star.key"
                          :href="star.url"
                          :x="50 + star.slot * 16"
                          y="61"
                          width="16"
                          height="16"
                          preserveAspectRatio="none"
                          @load="resetRecoveredImage"
                          @error="hideBrokenImage"
                        />
                        <text
                          v-if="honor.fcApCount"
                          class="rank-border-honor-fcap-text"
                          x="87"
                          y="57"
                          text-anchor="middle"
                          dominant-baseline="middle"
                        >
                          {{ honor.fcApCount }}
                        </text>
                      </svg>
                    </span>
                    <span v-else-if="honor.type === 'bonds' && honor.bondsLeftBgUrl && honor.bondsRightBgUrl" class="rank-border-honor-visual rank-border-honor-visual--bonds">
                      <svg
                        v-if="areRankBorderImagesLoaded(honor.bondsLeftBgUrl, honor.bondsRightBgUrl, HONOR_BONDS_MASK_URL)"
                        class="rank-border-honor-svg"
                        viewBox="0 0 180 80"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <defs>
                          <mask :id="honorSvgId(honor, 'mask')" maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="80" style="mask-type: alpha">
                            <image
                              v-if="preloadedRankBorderImageUrl(HONOR_BONDS_MASK_URL)"
                              :href="preloadedRankBorderImageUrl(HONOR_BONDS_MASK_URL) ?? ''" x="0" y="0" width="180" height="80" preserveAspectRatio="none"
                              @load="resetRecoveredImage"
                              @error="hideBrokenImage"
                            />
                          </mask>
                          <clipPath :id="honorSvgId(honor, 'left-bg')">
                            <rect x="0" y="0" width="93" height="80" />
                          </clipPath>
                          <clipPath :id="honorSvgId(honor, 'left-icon')">
                            <rect x="0" y="0" width="90" height="80" />
                          </clipPath>
                          <clipPath :id="honorSvgId(honor, 'right-icon')">
                            <rect x="90" y="0" width="90" height="80" />
                          </clipPath>
                        </defs>
                        <g :mask="`url(#${honorSvgId(honor, 'mask')})`">
                          <image
                            v-if="preloadedRankBorderImageUrl(honor.bondsRightBgUrl)"
                            :href="preloadedRankBorderImageUrl(honor.bondsRightBgUrl) ?? ''" x="0" y="0" width="180" height="80" preserveAspectRatio="none"
                            @load="resetRecoveredImage"
                            @error="hideBrokenImage"
                          />
                          <image
                            v-if="preloadedRankBorderImageUrl(honor.bondsLeftBgUrl)"
                            :href="preloadedRankBorderImageUrl(honor.bondsLeftBgUrl) ?? ''"
                            x="0"
                            y="0"
                            width="180"
                            height="80"
                            preserveAspectRatio="none"
                            :clip-path="`url(#${honorSvgId(honor, 'left-bg')})`"
                            @load="resetRecoveredImage"
                            @error="hideBrokenImage"
                          />
                          <image
                            v-if="preloadedRankBorderImageUrl(honor.bondsLeftIconUrl)"
                            :href="preloadedRankBorderImageUrl(honor.bondsLeftIconUrl) ?? ''"
                            x="-4"
                            y="-29"
                            width="128"
                            height="109"
                            preserveAspectRatio="none"
                            :clip-path="`url(#${honorSvgId(honor, 'left-icon')})`"
                            @load="resetRecoveredImage"
                            @error="hideBrokenImage"
                          />
                          <image
                            v-if="preloadedRankBorderImageUrl(honor.bondsRightIconUrl)"
                            :href="preloadedRankBorderImageUrl(honor.bondsRightIconUrl) ?? ''"
                            x="56"
                            y="-29"
                            width="128"
                            height="109"
                            preserveAspectRatio="none"
                            :clip-path="`url(#${honorSvgId(honor, 'right-icon')})`"
                            @load="resetRecoveredImage"
                            @error="hideBrokenImage"
                          />
                        </g>
                        <image
                          v-if="preloadedRankBorderImageUrl(honor.frameUrl)"
                          :href="preloadedRankBorderImageUrl(honor.frameUrl) ?? ''"
                          v-bind="honorFrameSvgAttrs(honor)"
                          preserveAspectRatio="none"
                          @load="resetRecoveredImage"
                          @error="hideBrokenImage"
                        />
                        <image
                          v-for="star in loadedHonorLevelStars(honor)"
                          :key="star.key"
                          :href="star.url"
                          :x="50 + star.slot * 16"
                          y="61"
                          width="16"
                          height="16"
                          preserveAspectRatio="none"
                          @load="resetRecoveredImage"
                          @error="hideBrokenImage"
                        />
                      </svg>
                    </span>
                    <span v-else class="rank-border-honor-fallback">{{ honor.label }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="rank-border-score-cell">
            <span
              :class="[
                'rank-border-live-number rank-border-row-score',
                row.scoreChanged ? 'rank-border-live-number--changed' : '',
              ]"
            >
              {{ formatPt(row.score) }}
            </span>
            <div class="rank-border-score-meta flex flex-wrap items-center justify-end gap-x-1.5 gap-y-0.5 text-[0.6875rem] leading-4 text-muted-foreground sm:gap-2 sm:text-xs">
              <span
                v-if="row.displayGrowth != null"
                :class="[
                  'rank-border-live-number inline-flex items-center gap-1',
                  row.displayGrowthChanged ? 'rank-border-live-number--changed' : '',
                  row.displayGrowth > 0 ? 'text-emerald-600 dark:text-emerald-300' : '',
                ]"
              >
                <span class="text-muted-foreground">{{ t("rankBorder.result.playerGrowthShort") }}</span>
                <span>{{ formatGrowth(row.displayGrowth) }}</span>
              </span>
              <span
                v-if="row.displayRankGrowth != null"
                :class="[
                  'rank-border-live-number inline-flex items-center gap-1',
                  row.displayRankGrowthChanged ? 'rank-border-live-number--changed' : '',
                  row.displayRankGrowth > 0 ? 'text-emerald-600 dark:text-emerald-300' : '',
                ]"
              >
                <span class="text-muted-foreground">{{ t("rankBorder.result.rankGrowthShort") }}</span>
                <span>{{ formatGrowth(row.displayRankGrowth) }}</span>
              </span>
              <span>{{ formatElapsed(elapsedSince(row.timestamp)) }}</span>
            </div>
          </div>
          </button>

          <div v-if="isMobileExpandedTarget('rank', row.rank)" class="rank-border-mobile-fact md:hidden">
            <div v-if="detailLoading && !isMobileDetailExpanded('rank', row.rank)" class="rank-border-mobile-fact__state">
              {{ t("rankBorder.result.waitingLiveData") }}
            </div>
            <div v-else-if="detailError && !isMobileDetailExpanded('rank', row.rank)" class="rank-border-mobile-fact__state rank-border-mobile-fact__state--error">
              {{ detailError }}
            </div>
            <template v-else-if="activeDetail && isMobileDetailExpanded('rank', row.rank)">
              <div class="rank-border-mobile-fact__head">
                <div class="min-w-0">
                  <p class="truncate text-xs text-muted-foreground">
                    <span
                      v-for="segment in richDetailTitleSegments(activeDetail)"
                      :key="segment.key"
                      :style="richNameSegmentStyle(segment)"
                    >
                      {{ segment.text }}
                    </span>
                  </p>
                  <p class="truncate text-xl font-semibold tabular-nums">{{ formatDetailRank(activeDetail) }}</p>
                </div>
                <Button type="button" variant="outline" size="sm" class="h-8 shrink-0" @click.stop="openDetailFromMobileFact">
                  <ChartLine class="size-4" />
                  {{ t("rankBorder.actions.showDetails") }}
                </Button>
              </div>
              <div class="rank-border-mobile-fact__metrics">
                <div>
                  <span>{{ t("rankBorder.result.score") }}</span>
                  <strong>{{ formatPt(activeDetail.result.score) }}</strong>
                </div>
                <div>
                  <span>{{ t("rankBorder.result.latestPlain") }}</span>
                  <strong>{{ formatElapsed(elapsedSince(activeDetail.result.timestamp)) }}</strong>
                </div>
                <div v-if="row.displayGrowth != null">
                  <span>{{ t("rankBorder.result.playerIntervalGrowth", { interval: intervalOptions.find((option) => option.value === intervalSeconds)?.label ?? "-" }) }}</span>
                  <strong :class="row.displayGrowth > 0 ? 'text-emerald-600 dark:text-emerald-300' : ''">{{ formatGrowth(row.displayGrowth) }}</strong>
                </div>
                <div v-if="row.displayRankGrowth != null">
                  <span>{{ t("rankBorder.result.rankIntervalGrowth", { interval: intervalOptions.find((option) => option.value === intervalSeconds)?.label ?? "-" }) }}</span>
                  <strong :class="row.displayRankGrowth > 0 ? 'text-emerald-600 dark:text-emerald-300' : ''">{{ formatGrowth(row.displayRankGrowth) }}</strong>
                </div>
                <div>
                  <span>{{ previousDetailLabel(activeDetail) }}</span>
                  <strong>{{ activeDetail.previous ? formatGrowth(detailDelta(activeDetail.previous, activeDetail.result)) : "-" }}</strong>
                </div>
                <div>
                  <span>{{ nextDetailLabel(activeDetail) }}</span>
                  <strong>{{ activeDetail.next ? formatGrowth(detailDelta(activeDetail.result, activeDetail.next)) : "-" }}</strong>
                </div>
              </div>
            </template>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </section>

  <section class="grid min-w-0 gap-3 rounded-md border bg-muted/10 p-2.5 sm:p-3">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <h2 class="truncate text-base font-semibold">{{ t("rankBorder.sections.segmentLines") }}</h2>
        <p class="text-sm text-muted-foreground">
          {{ t("rankBorder.sections.segmentLinesDescription", { interval: intervalOptions.find((option) => option.value === intervalSeconds)?.label ?? "-" }) }}
        </p>
      </div>
    </div>

    <div v-if="!hasSegmentData" class="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
      {{ t("rankBorder.result.emptySegments") }}
    </div>
    <div v-else class="rank-border-table-shell rounded-md border bg-background/80">
      <div class="rank-border-table-header rank-border-segment-header">
        <span>{{ t("rankBorder.table.target") }}</span>
        <span>{{ t("rankBorder.table.border") }}</span>
        <span class="text-right">{{ t("rankBorder.table.score") }}</span>
      </div>
      <div
        v-for="row in segmentRows"
        :key="row.rank"
        :data-rank-border-row="row.rank"
        class="border-b last:border-b-0"
      >
        <button
          type="button"
          :class="[
            'rank-border-table-row rank-border-segment-row bg-background/80 text-left transition-colors hover:bg-cyan-50/60 dark:hover:bg-cyan-500/10',
            row.selected ? 'ring-1 ring-cyan-500/50' : '',
          ]"
          @click="isMobileViewport ? openMobileLineDetail(row.rank) : openLineDetail(row.rank)"
          @keydown.enter.prevent="isMobileViewport ? openMobileLineDetail(row.rank) : openLineDetail(row.rank)"
          @keydown.space.prevent="isMobileViewport ? openMobileLineDetail(row.rank) : openLineDetail(row.rank)"
        >
          <div class="rank-border-rank-cell">
            <span class="inline-flex min-w-12 justify-center rounded-md border bg-background px-2 py-1 text-sm font-semibold tabular-nums text-foreground">
              {{ formatTargetRank(row.rank) }}
            </span>
          </div>

          <div class="rank-border-player-scroll">
            <div class="rank-border-player-track rank-border-player-track--plain">
              <p class="rank-border-player-name">
              {{ t("rankBorder.result.borderLine") }}
              </p>
            </div>
          </div>

          <div class="rank-border-score-cell">
            <span
              :class="[
                'rank-border-live-number rank-border-row-score',
                row.scoreChanged ? 'rank-border-live-number--changed' : '',
              ]"
            >
              {{ formatPt(row.score) }}
            </span>
            <div class="rank-border-score-meta flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:justify-end">
              <span
                v-if="row.growth?.growth != null"
                :class="[
                  'rank-border-live-number',
                  row.growthChanged ? 'rank-border-live-number--changed' : '',
                  row.growth.growth > 0 ? 'text-emerald-600 dark:text-emerald-300' : '',
                ]"
              >
                {{ formatGrowth(row.growth.growth) }}
              </span>
              <span>{{ formatElapsed(elapsedSince(row.timestamp)) }}</span>
            </div>
          </div>
        </button>

        <div v-if="isMobileExpandedTarget('line', row.rank)" class="rank-border-mobile-fact md:hidden">
          <div v-if="detailLoading && !isMobileDetailExpanded('line', row.rank)" class="rank-border-mobile-fact__state">
            {{ t("rankBorder.result.waitingLiveData") }}
          </div>
          <div v-else-if="detailError && !isMobileDetailExpanded('line', row.rank)" class="rank-border-mobile-fact__state rank-border-mobile-fact__state--error">
            {{ detailError }}
          </div>
          <template v-else-if="activeDetail && isMobileDetailExpanded('line', row.rank)">
            <div class="rank-border-mobile-fact__head">
              <div class="min-w-0">
                <p class="truncate text-xs text-muted-foreground">
                  <span
                    v-for="segment in richDetailTitleSegments(activeDetail)"
                    :key="segment.key"
                    :style="richNameSegmentStyle(segment)"
                  >
                    {{ segment.text }}
                  </span>
                </p>
                <p class="truncate text-xl font-semibold tabular-nums">{{ formatDetailRank(activeDetail) }}</p>
              </div>
              <Button type="button" variant="outline" size="sm" class="h-8 shrink-0" @click.stop="openDetailFromMobileFact">
                <ChartLine class="size-4" />
                {{ t("rankBorder.actions.showDetails") }}
              </Button>
            </div>
            <div class="rank-border-mobile-fact__metrics">
              <div>
                <span>{{ t("rankBorder.result.score") }}</span>
                <strong>{{ formatPt(activeDetail.result.score) }}</strong>
              </div>
              <div>
                <span>{{ t("rankBorder.result.latestPlain") }}</span>
                <strong>{{ formatElapsed(elapsedSince(activeDetail.result.timestamp)) }}</strong>
              </div>
              <div v-if="row.growth?.growth != null">
                <span>{{ t("rankBorder.result.intervalGrowth", { interval: intervalOptions.find((option) => option.value === intervalSeconds)?.label ?? "-" }) }}</span>
                <strong :class="row.growth.growth > 0 ? 'text-emerald-600 dark:text-emerald-300' : ''">{{ formatGrowth(row.growth.growth) }}</strong>
              </div>
              <div>
                <span>{{ previousDetailLabel(activeDetail) }}</span>
                <strong>{{ activeDetail.previous ? formatGrowth(detailDelta(activeDetail.previous, activeDetail.result)) : "-" }}</strong>
              </div>
              <div>
                <span>{{ nextDetailLabel(activeDetail) }}</span>
                <strong>{{ activeDetail.next ? formatGrowth(detailDelta(activeDetail.result, activeDetail.next)) : "-" }}</strong>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </section>
  </div>
</template>

<style scoped>
/* Duplicated from RankBorder.vue: shared by the leader visual and honor SVGs
   the rows render (also used by the detail dialog, which keeps its own copy). */
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

.rank-border-table-shell {
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
}

.rank-border-table-header,
.rank-border-table-row {
  display: grid;
  min-width: 0;
  align-items: center;
}

.rank-border-table-header {
  position: sticky;
  top: 0;
  z-index: 3;
  border-bottom: 1px solid var(--border);
  background: color-mix(in oklab, var(--muted) 45%, var(--background));
  color: var(--muted-foreground);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.5rem 0.75rem;
}

.rank-border-table-row {
  width: 100%;
  min-height: 4.375rem;
  border: 0;
  padding: 0.5rem 0.75rem;
}

.rank-border-top-list {
  position: relative;
  overflow: visible;
}

.rank-border-top-item {
  position: relative;
  transform: translateZ(0);
  will-change: transform;
}

.rank-border-row-move,
.rank-border-row-enter-active,
.rank-border-row-leave-active {
  transition:
    transform 420ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 180ms ease;
}

.rank-border-row-enter-from,
.rank-border-row-leave-to {
  opacity: 0.88;
  transform: translateY(0.125rem);
}

.rank-border-row-leave-active {
  position: absolute;
  right: 0;
  left: 0;
  z-index: 1;
}

.rank-border-top-header,
.rank-border-top-row {
  grid-template-columns: 4.75rem minmax(0, 1fr) clamp(6.85rem, 13vw, 10.25rem);
  column-gap: 0.75rem;
}

.rank-border-segment-header,
.rank-border-segment-row {
  grid-template-columns: 4.75rem minmax(0, 1fr) clamp(6.75rem, 12vw, 9.25rem);
  column-gap: 0.75rem;
}

.rank-border-rank-cell {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
}

.rank-border-player-scroll {
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.rank-border-player-scroll::-webkit-scrollbar {
  display: none;
}

.rank-border-player-track {
  display: grid;
  width: max-content;
  min-width: 100%;
  align-items: center;
  justify-content: start;
  gap: 0.5rem;
  padding-block: 0.125rem;
  padding-inline-end: 0.75rem;
}

.rank-border-player-track--assets {
  grid-template-columns: max-content max-content;
}

.rank-border-player-track--plain {
  width: max-content;
  min-width: 100%;
}

.rank-border-player-copy {
  display: grid;
  width: max-content;
  min-width: 0;
  justify-items: start;
  gap: 0.375rem;
  text-align: left;
}

.rank-border-player-name {
  display: inline-flex;
  width: max-content;
  justify-self: start;
  min-width: max-content;
  max-width: none;
  align-items: baseline;
  justify-content: flex-start;
  overflow: visible;
  color: var(--foreground);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.35;
  text-align: left;
  white-space: nowrap;
}

.rank-border-score-cell {
  position: relative;
  z-index: 2;
  display: grid;
  min-width: min-content;
  justify-items: end;
  gap: 0.25rem;
  align-self: stretch;
  align-content: center;
  padding-inline-start: 0.25rem;
  text-align: right;
}

.rank-border-row-score {
  min-width: 0;
  max-width: 100%;
  overflow: visible;
  font-size: clamp(0.9375rem, 1.65vw, 1.25rem);
  font-variant-numeric: tabular-nums;
  font-weight: 650;
  line-height: 1.15;
  white-space: nowrap;
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

.rank-border-leader--row {
  width: 3.5rem;
  height: 3.5rem;
}

.rank-border-honor-strip {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.25rem;
  overflow: visible;
}

.rank-border-honor-strip--row {
  flex-wrap: nowrap;
  gap: 0.25rem 0.375rem;
  width: max-content;
  max-width: none;
  overflow-x: visible;
  overflow-y: hidden;
  scrollbar-width: none;
}

.rank-border-honor-strip--row::-webkit-scrollbar {
  display: none;
}

.rank-border-honor {
  display: inline-flex;
  min-width: 0;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--muted-foreground);
  font-size: 0.625rem;
  font-weight: 600;
  line-height: 1;
}

.rank-border-honor-visual {
  position: relative;
  container-type: inline-size;
  display: block;
  width: 100%;
  height: 100%;
  aspect-ratio: 9 / 4;
  overflow: hidden;
  border-radius: 0;
  contain: paint;
}

.rank-border-honor-visual--bonds {
  background: color-mix(in oklab, var(--muted) 64%, transparent);
}

.rank-border-honor-svg {
  display: block;
  width: 100%;
  height: 100%;
}

.rank-border-honor-fcap-text {
  fill: #fff;
  stroke: rgb(33 35 64 / 0.45);
  stroke-linejoin: round;
  stroke-width: 2;
  font-family: "RankBorderSourceHanSansSC", ui-sans-serif, system-ui, sans-serif;
  font-size: 22px;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  paint-order: stroke fill;
  pointer-events: none;
}

.rank-border-honor-fallback {
  display: block;
  max-width: 100%;
  overflow: hidden;
  padding: 0 0.25rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-honor--row {
  width: 5rem;
  aspect-ratio: 9 / 4;
}

.rank-border-mobile-fact {
  display: grid;
  gap: 0.625rem;
  border-top: 1px solid color-mix(in oklab, var(--border) 72%, transparent);
  background: color-mix(in oklab, var(--muted) 30%, transparent);
  padding: 0.625rem 0.75rem 0.75rem;
}

.rank-border-mobile-fact__head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.rank-border-mobile-fact__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.375rem;
}

.rank-border-mobile-fact__metrics div,
.rank-border-mobile-fact__state {
  min-width: 0;
  border: 1px solid color-mix(in oklab, var(--border) 78%, transparent);
  border-radius: 0.375rem;
  background: color-mix(in oklab, var(--background) 82%, transparent);
  padding: 0.45rem 0.5rem;
}

.rank-border-mobile-fact__metrics span {
  display: block;
  overflow: hidden;
  color: var(--muted-foreground);
  font-size: 0.6875rem;
  line-height: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-mobile-fact__metrics strong {
  display: block;
  overflow: hidden;
  margin-top: 0.125rem;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-mobile-fact__state {
  color: var(--muted-foreground);
  font-size: 0.8125rem;
}

.rank-border-mobile-fact__state--error {
  border-color: color-mix(in oklab, var(--destructive) 52%, var(--border));
  background: color-mix(in oklab, var(--destructive) 8%, var(--background));
  color: var(--destructive);
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

@media (min-width: 768px) and (max-width: 1100px) {
  .rank-border-top-header,
  .rank-border-top-row {
    grid-template-columns: 4.25rem minmax(0, 1fr) 8.4rem;
  }

  .rank-border-segment-header,
  .rank-border-segment-row {
    grid-template-columns: 4.25rem minmax(0, 1fr) 8rem;
  }

  .rank-border-player-name {
    max-width: none;
  }

  .rank-border-row-score {
    font-size: clamp(0.875rem, 1.55vw, 1.0625rem);
  }
}

@media (max-width: 767px) {
  .rank-border-table-header {
    display: none;
  }

  .rank-border-table-row {
    min-height: 3.75rem;
    padding: 0.5rem 0.625rem;
  }

  .rank-border-top-row {
    grid-template-columns: 3.1rem minmax(0, 1fr) minmax(6.9rem, 7.65rem);
    column-gap: 0.375rem;
  }

  .rank-border-segment-row {
    grid-template-columns: 4.2rem minmax(0, 1fr) minmax(6.45rem, 7rem);
    column-gap: 0.375rem;
  }

  .rank-border-player-track {
    gap: 0.5rem;
    padding-inline-end: 0.5rem;
  }

  .rank-border-player-track--assets {
    grid-template-columns: auto max-content;
  }

  .rank-border-player-name {
    font-size: 0.8125rem;
  }

  .rank-border-leader--row {
    width: 2.65rem;
    height: 2.65rem;
  }

  .rank-border-honor-strip--row {
    gap: 0.1875rem;
    max-width: none;
    overflow-x: visible;
  }

  .rank-border-honor--row {
    width: 3.9rem;
  }

  .rank-border-score-cell {
    gap: 0.15rem;
    min-width: 0;
    padding-inline-start: 0.125rem;
  }

  .rank-border-row-score {
    font-size: clamp(0.765rem, 2.95vw, 0.9375rem);
    letter-spacing: 0;
  }

  .rank-border-score-meta {
    display: grid;
    justify-items: end;
    gap: 0.0625rem;
    font-size: 0.75rem;
    line-height: 1.15;
  }

  .rank-border-score-meta span {
    min-width: 0;
    max-width: 100%;
    white-space: nowrap;
  }

  .rank-border-segment-row .rank-border-score-meta {
    font-size: 0.8125rem;
  }
}

@media (max-width: 380px) {
  .rank-border-top-row {
    grid-template-columns: 2.8rem minmax(0, 1fr) 6.75rem;
    padding-inline: 0.45rem;
  }

  .rank-border-segment-row {
    grid-template-columns: 3.75rem minmax(0, 1fr) 6.3rem;
    padding-inline: 0.45rem;
  }

  .rank-border-player-track--assets {
    grid-template-columns: auto max-content;
  }

  .rank-border-player-name {
    font-size: 0.75rem;
  }

  .rank-border-leader--row {
    width: 2.35rem;
    height: 2.35rem;
  }

  .rank-border-honor--row {
    width: 3.35rem;
  }

  .rank-border-row-score {
    font-size: 0.6875rem;
  }

  .rank-border-score-meta {
    font-size: 0.6875rem;
  }

  .rank-border-segment-row .rank-border-score-meta {
    font-size: 0.75rem;
  }
}
</style>
