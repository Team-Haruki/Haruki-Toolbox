<script setup lang="ts">
import { useRankBorderContext } from "../composables/rank-border-context"
import { HONOR_BONDS_MASK_URL } from "../lib/rank-border-constants"
import type { RankBorderHonorView } from "../lib/rank-border-types"

defineProps<{ honor: RankBorderHonorView }>()

const { honors } = useRankBorderContext()

const {
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
</script>

<template>
  <span class="rank-border-honor rank-border-honor--detail">
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
</template>

<style scoped>
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

@media (min-width: 768px) and (max-width: 1180px) {
  .rank-border-honor--detail {
    width: 4.75rem;
  }
}

@media (min-width: 768px) and (max-height: 840px) {
  .rank-border-honor--detail {
    width: 4.25rem;
  }
}

@media (max-width: 767px) {
  .rank-border-honor--detail {
    width: 4.6rem;
  }
}
</style>
