<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { ChevronDown, UserRound, X } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRankBorderContext } from "../composables/rank-border-context"
import { chartLabelTop } from "../lib/rank-border-chart"
import {
  DETAIL_CHART_HEIGHT,
  DETAIL_CHART_WIDTH,
  DETAIL_HEATMAP_HOURS_PER_DAY,
  HONOR_BONDS_MASK_URL,
  PERSONAL_COLLECTION_LIMIT,
} from "../lib/rank-border-constants"

const { t } = useI18n()

withDefaults(defineProps<{ showClose?: boolean }>(), {
  showClose: false,
})
const emit = defineEmits<{ close: [] }>()

const { detail, honors, ui } = useRankBorderContext()

const {
  detail: activeDetail,
  detailDialogTab,
  updateDetailDialogTab,
  comparisonRankInput,
  comparisonRank,
  comparisonLineRanks,
  comparisonSelectValue,
  comparisonSummary,
  updateComparisonSelect,
  applyComparisonInput,
  detailTraceScopeLabel,
  detailTraceLoading,
  detailTraceStats,
  comparisonStatLines,
  detailHeatmapDays,
  hasDetailHeatmap,
  detailUpdateRecords,
  detailCharts,
  selectHeatmapWindow,
  formatDetailRank,
  formatDetailBadge,
  detailBadgeClass,
  previousDetailLabel,
  nextDetailLabel,
  chartPointStyle,
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
  shouldRenderProfileAssets,
  detailScoreChanged,
  formatPt,
  formatGrowth,
  formatPerHour,
  formatTimestamp,
  formatLoopCount,
  formatRankShift,
  richUserLabelSegments,
  richNameSegmentStyle,
  showRankBorderTooltip,
  moveRankBorderTooltip,
  hideRankBorderTooltip,
} = ui

const comparisonOpen = ref(false)
</script>

<template>
            <div v-if="activeDetail" class="rank-border-detail-panel grid gap-3 p-3 sm:p-4">
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
                    <span
                      v-for="honor in profileHonorViews(activeDetail.result, 3, detailHonorKeyScope(activeDetail))"
                      :key="honor.key"
                      class="rank-border-honor rank-border-honor--detail"
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
                </section>

                <Tabs
                  v-if="activeDetail.result.rank <= PERSONAL_COLLECTION_LIMIT"
                  :model-value="detailDialogTab"
                  class="rank-border-detail-tabs"
                  @update:model-value="updateDetailDialogTab"
                >
                  <TabsList class="h-8">
                    <TabsTrigger value="player" class="h-7 px-2.5 text-xs">{{ t("rankBorder.sections.playerTracking") }}</TabsTrigger>
                    <TabsTrigger value="border" class="h-7 px-2.5 text-xs">{{ t("rankBorder.sections.borderTracking") }}</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div class="rank-border-comparison rounded-md border">
                  <button
                    type="button"
                    class="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm font-medium"
                    :aria-expanded="comparisonOpen"
                    @click="comparisonOpen = !comparisonOpen"
                  >
                    <span class="flex min-w-0 items-center gap-2">
                      <span>{{ t("rankBorder.comparison.label") }}</span>
                      <span v-if="comparisonRank != null" class="text-xs font-normal text-muted-foreground">T{{ comparisonRank }}</span>
                    </span>
                    <ChevronDown
                      class="size-4 shrink-0 text-muted-foreground transition-transform"
                      :class="comparisonOpen ? 'rotate-180' : ''"
                    />
                  </button>
                  <div v-show="comparisonOpen" class="grid gap-2 border-t px-3 py-2.5">
                    <div class="flex min-w-0 flex-wrap items-center gap-1.5">
                      <Select :model-value="comparisonSelectValue" @update:model-value="updateComparisonSelect">
                        <SelectTrigger class="h-8 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{{ t("rankBorder.comparison.none") }}</SelectItem>
                          <SelectItem v-for="rank in comparisonLineRanks" :key="`comparison-${rank}`" :value="String(rank)">
                            T{{ rank }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        v-model="comparisonRankInput"
                        class="h-8 w-24 text-xs"
                        :placeholder="t('rankBorder.comparison.customPlaceholder')"
                        @keyup.enter="applyComparisonInput"
                      />
                      <Button variant="outline" size="sm" class="h-8 px-2 text-xs" @click="applyComparisonInput">
                        {{ t("rankBorder.comparison.apply") }}
                      </Button>
                    </div>
                    <div v-if="comparisonSummary" class="rounded-md border bg-muted/15 px-2.5 py-1.5 text-xs text-muted-foreground">
                      {{ comparisonSummary }}
                    </div>
                  </div>
                </div>

                <div class="rank-border-detail-grid">
                <section class="rank-border-detail-stats rounded-md border bg-muted/15 p-2 sm:p-3">
                  <div class="rank-border-stat">
                    <p>{{ t("rankBorder.result.hourlySpeed") }}</p>
                    <strong>{{ formatPerHour(detailTraceStats.hourlySpeed) }}</strong>
                    <span v-if="comparisonStatLines" class="rank-border-stat__comparison">
                      <span>T{{ comparisonRank }} {{ comparisonStatLines.hourlySpeed.value }}</span>
                      <span
                        v-if="comparisonStatLines.hourlySpeed.tone"
                        :class="comparisonStatLines.hourlySpeed.tone === 'up' ? 'text-emerald-500' : 'text-red-500'"
                      >
                        {{ comparisonStatLines.hourlySpeed.tone === "up" ? "▲" : "▼" }} {{ comparisonStatLines.hourlySpeed.diff }}
                      </span>
                    </span>
                  </div>
                  <div class="rank-border-stat">
                    <p>{{ t("rankBorder.result.recentAveragePt") }}</p>
                    <strong>{{ formatPt(detailTraceStats.recentAveragePt) }}</strong>
                    <span v-if="comparisonStatLines" class="rank-border-stat__comparison">
                      <span>T{{ comparisonRank }} {{ comparisonStatLines.recentAveragePt.value }}</span>
                      <span
                        v-if="comparisonStatLines.recentAveragePt.tone"
                        :class="comparisonStatLines.recentAveragePt.tone === 'up' ? 'text-emerald-500' : 'text-red-500'"
                      >
                        {{ comparisonStatLines.recentAveragePt.tone === "up" ? "▲" : "▼" }} {{ comparisonStatLines.recentAveragePt.diff }}
                      </span>
                    </span>
                  </div>
                  <div class="rank-border-stat">
                    <p>{{ t("rankBorder.result.latestPointGrowth") }}</p>
                    <strong>{{ formatGrowth(detailTraceStats.latestPointGrowth) }}</strong>
                    <span v-if="comparisonStatLines" class="rank-border-stat__comparison">
                      <span>T{{ comparisonRank }} {{ comparisonStatLines.latestPointGrowth.value }}</span>
                      <span
                        v-if="comparisonStatLines.latestPointGrowth.tone"
                        :class="comparisonStatLines.latestPointGrowth.tone === 'up' ? 'text-emerald-500' : 'text-red-500'"
                      >
                        {{ comparisonStatLines.latestPointGrowth.tone === "up" ? "▲" : "▼" }} {{ comparisonStatLines.latestPointGrowth.diff }}
                      </span>
                    </span>
                  </div>
                  <div class="rank-border-stat">
                    <p>{{ t("rankBorder.result.twentyMinTripleSpeed") }}</p>
                    <strong>{{ formatPerHour(detailTraceStats.threeWindowSpeed) }}</strong>
                    <span v-if="comparisonStatLines" class="rank-border-stat__comparison">
                      <span>T{{ comparisonRank }} {{ comparisonStatLines.threeWindowSpeed.value }}</span>
                      <span
                        v-if="comparisonStatLines.threeWindowSpeed.tone"
                        :class="comparisonStatLines.threeWindowSpeed.tone === 'up' ? 'text-emerald-500' : 'text-red-500'"
                      >
                        {{ comparisonStatLines.threeWindowSpeed.tone === "up" ? "▲" : "▼" }} {{ comparisonStatLines.threeWindowSpeed.diff }}
                      </span>
                    </span>
                  </div>
                  <div class="rank-border-stat">
                    <p>{{ t("rankBorder.result.loopCount") }}</p>
                    <strong>{{ formatLoopCount(detailTraceStats.loopCount) }}</strong>
                    <span v-if="comparisonStatLines" class="rank-border-stat__comparison">
                      <span>T{{ comparisonRank }} {{ comparisonStatLines.loopCount.value }}</span>
                      <span
                        v-if="comparisonStatLines.loopCount.tone"
                        :class="comparisonStatLines.loopCount.tone === 'up' ? 'text-emerald-500' : 'text-red-500'"
                      >
                        {{ comparisonStatLines.loopCount.tone === "up" ? "▲" : "▼" }} {{ comparisonStatLines.loopCount.diff }}
                      </span>
                    </span>
                  </div>
                  <div class="rank-border-stat">
                    <p>{{ t("rankBorder.result.rankShift") }}</p>
                    <strong>{{ formatRankShift(detailTraceStats.rankShift) }}</strong>
                  </div>
                  <div class="rank-border-stat">
                    <p>{{ previousDetailLabel(activeDetail) }}</p>
                    <strong>{{ formatGrowth(detailTraceStats.previousGap) }}</strong>
                  </div>
                  <div class="rank-border-stat">
                    <p>{{ nextDetailLabel(activeDetail) }}</p>
                    <strong>{{ formatGrowth(detailTraceStats.nextGap) }}</strong>
                  </div>
                </section>

	                <section class="rank-border-trend-panel grid min-w-0 gap-2 rounded-md border bg-muted/15 p-3">
	                  <div class="flex items-center justify-between gap-2">
	                    <h3 class="text-sm font-semibold">{{ t("rankBorder.result.trendSection") }}</h3>
	                    <span class="text-xs text-muted-foreground">{{ detailTraceScopeLabel }}</span>
	                  </div>

                  <div v-if="detailTraceLoading && !detailTraceStats.hasChart" class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    {{ t("rankBorder.result.waitingTrace") }}
                  </div>
                  <div v-else-if="detailTraceStats.hasChart" class="rank-border-trend-grid">
                    <div class="min-h-0 rounded-md border bg-background/70 p-2.5">
                      <div class="mb-1.5 flex items-center justify-between gap-2">
                        <p class="text-sm font-medium">{{ t("rankBorder.result.rtrChart") }}</p>
                        <span class="text-xs text-muted-foreground">RT</span>
                      </div>
                      <div class="rank-border-chart-frame rank-border-chart-frame--detail">
                        <div class="rank-border-chart-plot">
                          <svg
                            class="rank-border-chart-svg text-sky-600 dark:text-sky-300"
                            :viewBox="`0 0 ${DETAIL_CHART_WIDTH} ${DETAIL_CHART_HEIGHT}`"
                            preserveAspectRatio="none"
                            aria-label="rank trend"
                          >
                            <line
                              v-for="line in detailCharts.rankReferenceLines"
                              :key="`dialog-rtr-grid-${line.value}`"
                              class="rank-border-chart-grid"
                              x1="0"
                              :x2="DETAIL_CHART_WIDTH"
                              :y1="line.y"
                              :y2="line.y"
                            />
                            <path class="rank-border-detail-line" :d="detailCharts.rankPath" />
                          </svg>
                          <button
                            v-for="point in detailCharts.rankPoints"
                            :key="point.key"
                            type="button"
                            class="rank-border-chart-point"
                            :style="chartPointStyle(point)"
                            :aria-label="point.label"
                            @mouseenter="showRankBorderTooltip($event, point.label)"
                            @mousemove="moveRankBorderTooltip($event)"
                            @mouseleave="hideRankBorderTooltip"
                          />
                        </div>
                        <div class="rank-border-chart-labels" aria-hidden="true">
                          <span
                            v-for="line in detailCharts.rankReferenceLines"
                            :key="`dialog-rtr-label-${line.value}`"
                            class="rank-border-chart-label"
                            :style="{ top: chartLabelTop(line) }"
                          >
                            {{ line.label }}
                          </span>
                        </div>
                      </div>
                      <div class="rank-border-chart-time-axis" aria-hidden="true">
                        <span
                          v-for="tick in detailCharts.timeTicks"
                          :key="tick.key"
                          :style="{ left: tick.left }"
                        >
                          {{ tick.label }}
                        </span>
                      </div>
                    </div>

                    <div class="min-h-0 rounded-md border bg-background/70 p-2.5">
                      <div class="mb-1.5 flex items-center justify-between gap-2">
                        <p class="text-sm font-medium">{{ t("rankBorder.result.ptrChart") }}</p>
                        <span class="text-xs text-muted-foreground">pt</span>
                      </div>
                      <div class="rank-border-chart-frame rank-border-chart-frame--detail">
                        <div class="rank-border-chart-plot">
                          <svg
                            class="rank-border-chart-svg text-cyan-600 dark:text-cyan-300"
                            :viewBox="`0 0 ${DETAIL_CHART_WIDTH} ${DETAIL_CHART_HEIGHT}`"
                            preserveAspectRatio="none"
                            aria-label="score trend"
                          >
                            <line
                              v-for="line in detailCharts.scoreReferenceLines"
                              :key="`dialog-ptr-grid-${line.value}`"
                              class="rank-border-chart-grid"
                              x1="0"
                              :x2="DETAIL_CHART_WIDTH"
                              :y1="line.y"
                              :y2="line.y"
                            />
                            <line
                              v-for="line in detailCharts.plannerLines"
                              :key="`dialog-ptr-plan-${line.key}`"
                              :class="[
                                'rank-border-chart-plan-line',
                                line.tone === 'target' ? 'rank-border-chart-plan-line--target' : '',
                              ]"
                              x1="0"
                              :x2="DETAIL_CHART_WIDTH"
                              :y1="line.y"
                              :y2="line.y"
                            />
                            <path
                              v-if="detailCharts.comparisonScorePath"
                              class="rank-border-detail-line rank-border-detail-line--comparison"
                              :d="detailCharts.comparisonScorePath"
                            />
                            <path class="rank-border-detail-line" :d="detailCharts.scorePath" />
                          </svg>
                          <button
                            v-for="point in detailCharts.scorePoints"
                            :key="point.key"
                            type="button"
                            class="rank-border-chart-point"
                            :style="chartPointStyle(point)"
                            :aria-label="point.label"
                            @mouseenter="showRankBorderTooltip($event, point.label)"
                            @mousemove="moveRankBorderTooltip($event)"
                            @mouseleave="hideRankBorderTooltip"
                          />
                        </div>
                        <div class="rank-border-chart-labels" aria-hidden="true">
                          <span
                            v-for="line in detailCharts.scoreReferenceLines"
                            :key="`dialog-ptr-label-${line.value}`"
                            class="rank-border-chart-label"
                            :style="{ top: chartLabelTop(line) }"
                          >
                            {{ line.label }}
                          </span>
                        </div>
                      </div>
                      <div class="rank-border-chart-time-axis" aria-hidden="true">
                        <span
                          v-for="tick in detailCharts.timeTicks"
                          :key="tick.key"
                          :style="{ left: tick.left }"
                        >
                          {{ tick.label }}
                        </span>
                      </div>
                      <div
                        v-if="detailCharts.plannerLines.length > 0 || detailCharts.comparisonScorePath"
                        class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground"
                      >
                        <span v-if="detailCharts.comparisonScorePath" class="inline-flex items-center gap-1">
                          <span class="inline-block h-0.5 w-4 rounded-full bg-purple-500/90" />
                          {{ t("rankBorder.comparison.legend", { rank: comparisonRank != null ? `T${comparisonRank}` : "-" }) }}
                        </span>
                        <span
                          v-for="line in detailCharts.plannerLines"
                          :key="`ptr-legend-${line.key}`"
                          class="inline-flex items-center gap-1"
                        >
                          <span
                            class="inline-block h-0.5 w-4 rounded-full"
                            :class="line.tone === 'target' ? 'bg-amber-500/90' : 'bg-emerald-500/90'"
                          />
                          {{ line.label }} {{ formatPt(line.value) }}
                        </span>
                      </div>
                    </div>

                    <div class="min-h-0 rounded-md border bg-background/70 p-2.5">
                      <div class="mb-1.5 flex items-center justify-between gap-2">
                        <p class="text-sm font-medium">{{ t("rankBorder.result.speedChart") }}</p>
                        <span class="text-xs text-muted-foreground">pt/h</span>
                      </div>
                      <div class="rank-border-chart-frame rank-border-chart-frame--detail">
                        <div class="rank-border-chart-plot">
                          <svg
                            class="rank-border-chart-svg text-emerald-600 dark:text-emerald-300"
                            :viewBox="`0 0 ${DETAIL_CHART_WIDTH} ${DETAIL_CHART_HEIGHT}`"
                            preserveAspectRatio="none"
                            aria-label="speed trend"
                          >
                            <line
                              v-for="line in detailCharts.speedReferenceLines"
                              :key="`dialog-spd-grid-${line.value}`"
                              class="rank-border-chart-grid"
                              x1="0"
                              :x2="DETAIL_CHART_WIDTH"
                              :y1="line.y"
                              :y2="line.y"
                            />
                            <path
                              v-if="detailCharts.comparisonSpeedPath"
                              class="rank-border-detail-line rank-border-detail-line--comparison"
                              :d="detailCharts.comparisonSpeedPath"
                            />
                            <path class="rank-border-detail-line" :d="detailCharts.speedPath" />
                          </svg>
                          <button
                            v-for="point in detailCharts.speedPoints"
                            :key="point.key"
                            type="button"
                            class="rank-border-chart-point"
                            :style="chartPointStyle(point)"
                            :aria-label="point.label"
                            @mouseenter="showRankBorderTooltip($event, point.label)"
                            @mousemove="moveRankBorderTooltip($event)"
                            @mouseleave="hideRankBorderTooltip"
                          />
                        </div>
                        <div class="rank-border-chart-labels" aria-hidden="true">
                          <span
                            v-for="line in detailCharts.speedReferenceLines"
                            :key="`dialog-spd-label-${line.value}`"
                            class="rank-border-chart-label"
                            :style="{ top: chartLabelTop(line) }"
                          >
                            {{ line.label }}
                          </span>
                        </div>
                      </div>
                      <div class="rank-border-chart-time-axis" aria-hidden="true">
                        <span
                          v-for="tick in detailCharts.timeTicks"
                          :key="tick.key"
                          :style="{ left: tick.left }"
                        >
                          {{ tick.label }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div v-else class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    {{ t("rankBorder.result.emptyTrace") }}
                  </div>
                </section>

                <div class="rank-border-detail-history">
                  <section class="rank-border-heatmap-section grid min-w-0 gap-2 rounded-md border bg-muted/15 p-3">
                    <div class="flex items-center justify-between gap-2">
                      <h3 class="text-sm font-semibold">{{ t("rankBorder.result.heatmapTitle") }}</h3>
                      <span class="text-right text-xs text-muted-foreground">
                        {{ t("rankBorder.result.dailyHours") }} · {{ t("rankBorder.result.heatmapHint") }}
                      </span>
                    </div>
                    <div v-if="hasDetailHeatmap" class="rank-border-heatmap-panel">
                      <div class="rank-border-heatmap-row rank-border-heatmap-row--header" aria-hidden="true">
                        <span class="rank-border-heatmap-corner" />
                        <div class="rank-border-heatmap-hours">
                          <span v-for="hour in DETAIL_HEATMAP_HOURS_PER_DAY" :key="`heatmap-hour-${hour}`">{{ hour - 1 }}</span>
                        </div>
                      </div>
                      <div
                        v-for="day in detailHeatmapDays"
                        :key="day.key"
                        class="rank-border-heatmap-row"
                      >
                        <span class="rank-border-heatmap-day-label">
                          <span>{{ day.label }}</span>
                        </span>
                        <div class="rank-border-heatmap rank-border-heatmap--detail">
	                          <button
	                            v-for="cell in day.cells"
	                            :key="cell.key"
	                            type="button"
	                            :class="[
	                              'rank-border-heatmap-cell',
	                              `rank-border-heatmap-cell--${cell.status}`,
	                              cell.selectable ? 'rank-border-heatmap-cell--selectable' : '',
	                              cell.selected ? 'rank-border-heatmap-cell--selected' : '',
	                            ]"
	                            :disabled="!cell.selectable"
	                            :style="{ backgroundColor: cell.color, color: cell.textColor }"
	                            :aria-pressed="cell.selected"
	                            :aria-label="cell.label"
	                            @click="selectHeatmapWindow(cell)"
	                            @mouseenter="showRankBorderTooltip($event, cell.label)"
	                            @mousemove="moveRankBorderTooltip($event)"
	                            @mouseleave="hideRankBorderTooltip"
	                          >
	                            {{ cell.displayLabel }}
	                          </button>
                        </div>
                      </div>
                    </div>
                    <div v-else class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                      {{ t("rankBorder.result.heatmapEmpty") }}
                    </div>
                  </section>

	                  <section v-if="detailUpdateRecords.length > 0" class="rank-border-update-section grid min-w-0 gap-2 rounded-md border bg-muted/15 p-3">
	                    <div class="flex items-center justify-between gap-2">
	                      <h3 class="text-sm font-semibold">{{ t("rankBorder.result.updateLog") }}</h3>
	                      <span class="text-xs text-muted-foreground">{{ detailTraceScopeLabel }}</span>
	                    </div>
                    <div class="rank-border-update-log">
                      <div class="rank-border-update-log__header">
                        <span>{{ t("rankBorder.table.hourPoint") }}</span>
                        <span>{{ t("rankBorder.table.rank") }}</span>
                        <span>{{ t("rankBorder.table.growth") }}</span>
                        <span>{{ t("rankBorder.table.pt") }}</span>
                      </div>
                      <div class="rank-border-update-log__rows">
                        <div
                          v-for="record in detailUpdateRecords"
                          :key="record.key"
                          class="rank-border-update-log__row"
                        >
                          <span>{{ record.time }}</span>
                          <span>{{ record.rank }}</span>
                          <span>{{ record.growth }}</span>
                          <span>{{ record.score }}</span>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
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

.rank-border-detail-tabs {
  flex: 0 0 auto;
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

.rank-border-honor--detail {
  width: 6rem;
  aspect-ratio: 9 / 4;
}

.rank-border-detail-panel__header {
  min-width: 0;
}

.rank-border-detail-grid {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr);
  grid-auto-rows: auto;
  grid-template-areas:
    "stats"
    "trend"
    "heatmap";
  align-content: start;
  gap: 0.75rem;
}

.rank-border-detail-profile,
.rank-border-trend-panel,
.rank-border-detail-history,
.rank-border-heatmap-section,
.rank-border-update-section {
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

.rank-border-detail-stats {
  display: grid;
  grid-area: stats;
  min-width: 0;
  min-height: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-self: start;
  align-content: start;
  gap: 0.5rem;
  overflow: hidden;
}

.rank-border-trend-grid {
  display: grid;
  min-height: 0;
  min-width: 0;
  grid-template-rows: repeat(3, minmax(9.75rem, 1fr));
  gap: 0.5rem;
}

.rank-border-trend-panel {
  grid-area: trend;
}

.rank-border-detail-history {
  display: grid;
  grid-area: heatmap;
  min-width: 0;
  min-height: 0;
  grid-template-rows: minmax(0, auto) minmax(8rem, 1fr);
  align-content: stretch;
  gap: 0.75rem;
  overflow: visible;
}

.rank-border-heatmap-section {
  display: grid;
  grid-template-rows: auto minmax(0, auto);
  align-content: start;
  min-height: 0;
}

.rank-border-update-section {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  align-content: stretch;
  min-height: 0;
}

.rank-border-sparkline,
.rank-border-detail-line {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.rank-border-sparkline {
  stroke-width: 2.25;
}

.rank-border-detail-line {
  stroke-width: 1.85;
  vector-effect: non-scaling-stroke;
}

.rank-border-detail-line--comparison {
  stroke: rgb(168 85 247 / 0.85);
  stroke-width: 1.5;
  stroke-dasharray: 4 3;
}

.rank-border-chart-plan-line {
  fill: none;
  stroke: rgb(16 185 129 / 0.9);
  stroke-width: 1.5;
  stroke-dasharray: 5 3;
  vector-effect: non-scaling-stroke;
}

.rank-border-chart-plan-line--target {
  stroke: rgb(245 158 11 / 0.9);
}

.rank-border-stat {
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  background: color-mix(in oklab, var(--background) 74%, transparent);
  padding: 0.5rem;
}

.rank-border-stat__comparison {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 0.125rem 0.375rem;
  margin-top: 0.25rem;
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  color: var(--muted-foreground);
}

.rank-border-stat p {
  overflow: hidden;
  color: var(--muted-foreground);
  font-size: 0.75rem;
  line-height: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-stat strong {
  display: block;
  overflow: hidden;
  margin-top: 0.25rem;
  font-size: 0.9375rem;
  font-variant-numeric: tabular-nums;
  font-weight: 650;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-chart-frame {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 4.75rem;
  gap: 0.5rem;
  height: 6rem;
  min-width: 0;
}

.rank-border-chart-frame--dialog {
  height: 8.75rem;
}

.rank-border-chart-frame--detail {
  height: 7.15rem;
}

.rank-border-chart-plot {
  position: relative;
  min-width: 0;
  height: 100%;
}

.rank-border-chart-svg {
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

.rank-border-chart-labels {
  position: relative;
  min-width: 0;
  height: 100%;
}

.rank-border-chart-label {
  position: absolute;
  right: 0;
  max-width: 100%;
  transform: translateY(-50%);
  color: var(--muted-foreground);
  font-size: 0.625rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-sparkline-baseline,
.rank-border-chart-grid {
  fill: none;
  stroke: var(--border);
  stroke-width: 1;
  opacity: 0.7;
}

.rank-border-chart-grid {
  stroke-dasharray: 3 3;
  opacity: 0.74;
}

.rank-border-chart-point {
  position: absolute;
  z-index: 2;
  width: 1.05rem;
  height: 1.05rem;
  transform: translate(-50%, -50%);
  border: 0.125rem solid transparent;
  border-radius: 9999px;
  background: transparent;
  cursor: crosshair;
  opacity: 0;
  padding: 0;
  transition: background-color 140ms ease, border-color 140ms ease, opacity 140ms ease, transform 140ms ease, box-shadow 140ms ease;
}

.rank-border-chart-point:hover {
  transform: translate(-50%, -50%) scale(1);
  border-color: currentColor;
  background: var(--background);
  box-shadow: 0 0 0 0.2rem color-mix(in oklab, currentColor 14%, transparent);
  opacity: 1;
}

.rank-border-chart-time-axis {
  position: relative;
  height: 1.15rem;
  margin-top: 0.45rem;
  margin-right: 5.25rem;
  border-top: 1px solid color-mix(in oklab, var(--border) 68%, transparent);
  color: var(--muted-foreground);
  font-size: 0.625rem;
  font-variant-numeric: tabular-nums;
}

.rank-border-chart-time-axis span {
  position: absolute;
  top: 0.35rem;
  border-radius: 9999px;
  background: color-mix(in oklab, var(--background) 92%, transparent);
  padding-inline: 0.18rem;
  transform: translateX(-50%);
  white-space: nowrap;
}

.rank-border-heatmap {
  display: grid;
  min-width: 0;
}

.rank-border-heatmap-panel {
  display: grid;
  --rank-border-heatmap-label-width: 2.75rem;
  --rank-border-heatmap-gap: 0.125rem;
  --rank-border-heatmap-min-cell-size: 1.08rem;
  --rank-border-heatmap-cell-size: clamp(1.08rem, 1.56vw, 1.34rem);
  --rank-border-heatmap-grid-width: max(
    calc(100% - var(--rank-border-heatmap-label-width) - 0.375rem),
    calc(var(--rank-border-heatmap-min-cell-size) * 24 + var(--rank-border-heatmap-gap) * 23)
  );
  min-width: 0;
  min-height: 0;
  max-height: 15.75rem;
  gap: 0.25rem;
  overflow-x: auto;
  overflow-y: auto;
  overscroll-behavior-x: contain;
  padding-block: 0.0625rem 0.625rem;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.rank-border-heatmap-row {
  display: grid;
  width: 100%;
  min-width: 100%;
  grid-template-columns: var(--rank-border-heatmap-label-width) var(--rank-border-heatmap-grid-width);
  gap: 0.375rem;
  align-items: center;
  min-height: var(--rank-border-heatmap-cell-size);
}

.rank-border-heatmap-row--header {
  color: var(--muted-foreground);
}

.rank-border-heatmap-day-label {
  position: sticky;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  overflow: visible;
  padding-right: 0.125rem;
  background: linear-gradient(90deg, var(--background) 72%, color-mix(in oklab, var(--background) 0%, transparent));
  color: var(--muted-foreground);
  font-size: 0.625rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
}

.rank-border-heatmap-day-label span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.1rem;
  height: 1.1rem;
  border: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
  border-radius: 9999px;
  background: color-mix(in oklab, var(--background) 88%, var(--muted));
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.06);
}

.rank-border-heatmap-corner {
  position: sticky;
  left: 0;
  z-index: 3;
  background: linear-gradient(90deg, var(--background) 72%, color-mix(in oklab, var(--background) 0%, transparent));
}

.rank-border-heatmap-hours {
  display: grid;
  width: var(--rank-border-heatmap-grid-width);
  grid-template-columns: repeat(24, minmax(var(--rank-border-heatmap-min-cell-size), 1fr));
  gap: var(--rank-border-heatmap-gap);
  justify-content: stretch;
  color: var(--muted-foreground);
  font-size: 0.625rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-align: center;
}

.rank-border-heatmap-cell {
  appearance: none;
  border: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: var(--rank-border-heatmap-cell-size);
  aspect-ratio: 1;
  min-height: var(--rank-border-heatmap-min-cell-size);
  min-width: 0;
  border-radius: 2px;
  background-clip: padding-box;
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.16);
  cursor: default;
  font-size: 0.56rem;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1;
  overflow: hidden;
  text-align: center;
  transition: box-shadow 120ms ease, filter 120ms ease;
  user-select: none;
}

.rank-border-heatmap-cell--selectable {
  cursor: pointer;
}

.rank-border-heatmap-cell--selectable:hover {
  filter: brightness(1.05);
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.32), 0 0 0 0.125rem color-mix(in oklab, currentColor 16%, transparent);
}

.rank-border-heatmap-cell--selectable:focus-visible {
  outline: 2px solid color-mix(in oklab, var(--primary) 70%, transparent);
  outline-offset: 2px;
}

.rank-border-heatmap-cell--selected {
  filter: saturate(1.12) brightness(1.04);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.55),
    0 0 0 0.1875rem color-mix(in oklab, var(--primary) 40%, transparent),
    inset 0 0 0 1px rgb(15 23 42 / 0.28);
}

.rank-border-heatmap--detail {
  width: var(--rank-border-heatmap-grid-width);
  grid-template-columns: repeat(24, minmax(var(--rank-border-heatmap-min-cell-size), 1fr));
  gap: var(--rank-border-heatmap-gap);
  min-height: 0;
  justify-content: stretch;
  overflow: visible;
}

.rank-border-heatmap-cell--before,
.rank-border-heatmap-cell--future {
  cursor: default;
  filter: grayscale(0.2);
}

.rank-border-heatmap-cell:disabled {
  opacity: 0.75;
}

.rank-border-update-log {
  display: grid;
  align-self: stretch;
  height: clamp(11rem, 24svh, 15rem);
  min-height: 0;
  max-height: clamp(11rem, 24svh, 15rem);
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  background: color-mix(in oklab, var(--background) 74%, transparent);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.rank-border-update-log__title {
  border-bottom: 1px solid var(--border);
  padding: 0.32rem 0.5rem;
  color: var(--foreground);
  font-size: 0.75rem;
  font-weight: 650;
  line-height: 1.15;
}

.rank-border-update-log__header,
.rank-border-update-log__row {
  display: grid;
  grid-template-columns: 3.8rem 3rem 5rem minmax(7.25rem, 1fr);
  gap: 0.5rem;
  align-items: center;
  min-width: 0;
  padding: 0.26rem 0.5rem;
  line-height: 1.2;
}

.rank-border-update-log__header {
  border-bottom: 1px solid var(--border);
  color: var(--muted-foreground);
  font-weight: 600;
}

.rank-border-update-log__rows {
  min-height: 0;
  padding-bottom: 0.375rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.rank-border-update-log__row {
  color: var(--foreground);
}

.rank-border-update-log__row span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-update-log__header span:last-child,
.rank-border-update-log__row span:last-child {
  text-align: right;
}

.rank-border-update-log__row:nth-child(odd) {
  background: color-mix(in oklab, var(--muted) 42%, transparent);
}

@media (min-width: 768px) and (max-width: 1180px) {
  .rank-border-detail-grid {
    gap: 0.625rem;
  }

  .rank-border-leader--dialog {
    width: 3.25rem;
    height: 3.25rem;
  }

  .rank-border-honor--detail {
    width: 4.75rem;
  }

  .rank-border-detail-profile,
  .rank-border-trend-panel,
  .rank-border-heatmap-section,
  .rank-border-update-section {
    padding: 0.75rem;
  }

  .rank-border-detail-profile__body {
    gap: 0.625rem;
  }

  .rank-border-detail-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.375rem;
    padding: 0.75rem;
  }

  .rank-border-stat {
    padding: 0.4375rem;
  }

  .rank-border-stat p {
    font-size: 0.6875rem;
  }

  .rank-border-stat strong {
    margin-top: 0.125rem;
    font-size: 0.8125rem;
  }

  .rank-border-chart-frame--detail {
    height: 6.5rem;
  }

  .rank-border-chart-frame {
    grid-template-columns: minmax(0, 1fr) 4.1rem;
    gap: 0.375rem;
  }

  .rank-border-chart-time-axis {
    margin-right: 4.5rem;
  }

  .rank-border-heatmap-row {
    --rank-border-heatmap-label-width: 2.35rem;
    gap: 0.25rem;
  }

  .rank-border-update-log__header,
  .rank-border-update-log__row {
    grid-template-columns: 3.4rem 2.8rem 4.8rem minmax(6.8rem, 1fr);
    gap: 0.25rem;
    padding: 0.2rem 0.375rem;
  }
}

@media (min-width: 768px) and (max-width: 900px) {
  .rank-border-detail-grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: none;
    grid-template-areas:
      "stats"
      "trend"
      "heatmap";
    padding-bottom: 0.625rem;
    overflow: visible;
  }

  .rank-border-detail-profile,
  .rank-border-trend-panel,
  .rank-border-detail-history,
  .rank-border-heatmap-section,
  .rank-border-update-section,
  .rank-border-detail-stats {
    min-height: auto;
    overflow: visible;
  }

  .rank-border-detail-history {
    grid-template-rows: auto minmax(10rem, auto);
    overflow: visible;
  }

  .rank-border-detail-profile__body--assets {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .rank-border-trend-grid {
    grid-template-rows: none;
  }

  .rank-border-update-log {
    height: auto;
    max-height: 14rem;
  }
}

@media (min-width: 768px) and (max-height: 840px) {
  .rank-border-detail-panel__header h2 {
    font-size: 1rem;
    line-height: 1.25;
  }

  .rank-border-detail-panel__header p {
    font-size: 0.75rem;
    line-height: 1.25;
  }

  .rank-border-detail-profile,
  .rank-border-trend-panel,
  .rank-border-heatmap-section,
  .rank-border-update-section,
  .rank-border-detail-stats {
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

  .rank-border-honor--detail {
    width: 4.25rem;
  }

  .rank-border-chart-frame--detail {
    height: 6.35rem;
  }

  .rank-border-trend-grid {
    gap: 0.375rem;
  }

  .rank-border-update-log__title,
  .rank-border-update-log__header,
  .rank-border-update-log__row {
    padding-block: 0.1875rem;
  }
}

@media (max-width: 767px) {
  .rank-border-detail-panel__header {
    min-height: 0;
    padding-right: 2.25rem;
  }

  .rank-border-detail-panel__header p {
    display: -webkit-box;
    overflow: hidden;
    line-height: 1.3;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .rank-border-detail-grid {
    display: grid;
    min-height: 0;
    grid-template-columns: minmax(0, 1fr);
    grid-auto-rows: auto;
    grid-template-areas:
      "stats"
      "trend"
      "heatmap";
    align-content: start;
    gap: 0.625rem;
    padding: 0.125rem 0.125rem 0.75rem;
  }

  .rank-border-detail-profile,
  .rank-border-trend-panel,
  .rank-border-detail-history,
  .rank-border-heatmap-section,
  .rank-border-update-section,
  .rank-border-detail-stats {
    min-height: auto;
    overflow: visible;
  }

  .rank-border-detail-history {
    grid-template-rows: auto auto;
    overflow: visible;
  }

  .rank-border-detail-profile,
  .rank-border-trend-panel,
  .rank-border-heatmap-section,
  .rank-border-update-section {
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

  .rank-border-honor--detail {
    width: 4.6rem;
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

  .rank-border-detail-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-content: start;
    padding: 0.5rem;
  }

  .rank-border-trend-grid {
    grid-template-rows: none;
    gap: 0.5rem;
  }

  .rank-border-heatmap-section,
  .rank-border-update-section {
    align-content: start;
  }

  .rank-border-heatmap-section {
    grid-template-rows: auto max-content;
  }

  .rank-border-update-section {
    grid-template-rows: auto auto;
  }

  .rank-border-trend-panel > div:first-child,
  .rank-border-heatmap-section > div:first-child,
  .rank-border-update-section > div:first-child {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .rank-border-chart-frame {
    grid-template-columns: minmax(0, 1fr) 3.75rem;
  }

  .rank-border-chart-frame--detail {
    height: 6.5rem;
  }

  .rank-border-chart-time-axis {
    margin-right: 4.25rem;
  }

  .rank-border-stat {
    padding: 0.4375rem;
  }

  .rank-border-stat p {
    font-size: 0.6875rem;
  }

  .rank-border-stat strong {
    font-size: 0.8125rem;
  }

  .rank-border-heatmap-row {
    --rank-border-heatmap-label-width: 2.2rem;
    gap: 0.25rem;
  }

  .rank-border-heatmap-panel {
    --rank-border-heatmap-min-cell-size: 1rem;
    --rank-border-heatmap-cell-size: clamp(1rem, 3.6vw, 1.18rem);
    --rank-border-heatmap-gap: 0.125rem;
    max-height: 13.75rem;
  }

  .rank-border-update-log {
    height: 14.5rem;
    max-height: 14.5rem;
    overflow: auto;
  }

  .rank-border-update-log__header,
  .rank-border-update-log__row {
    grid-template-columns: 3.25rem 2.75rem 4.25rem minmax(5.5rem, 1fr);
    gap: 0.25rem;
    padding-inline: 0.375rem;
  }
}

@media (max-width: 380px) {
  .rank-border-update-log__header,
  .rank-border-update-log__row {
    grid-template-columns: 3rem 2.35rem 3.75rem minmax(4.8rem, 1fr);
    font-size: 0.6875rem;
  }
}
</style>
