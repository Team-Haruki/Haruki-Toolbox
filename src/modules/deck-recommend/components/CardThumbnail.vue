<script setup lang="ts">
import { computed } from "vue"
import type { CardThumbnailView } from "../lib/card-thumbnail"

const props = withDefaults(defineProps<{
  thumbnail: CardThumbnailView
  size?: "sm" | "md"
  cornerBadge?: string | null
}>(), {
  size: "md",
  cornerBadge: null,
})

const rareIndexes = computed(() => Array.from({ length: props.thumbnail.rareCount }, (_, index) => index))
</script>

<template>
  <div
    :class="[
      'relative shrink-0 self-start overflow-hidden bg-muted text-muted-foreground ring-1 ring-border',
      size === 'sm' ? 'size-11 rounded-sm sm:size-12 md:size-14 xl:size-16' : 'size-20 rounded-md',
    ]"
    :aria-label="thumbnail.title ?? `#${thumbnail.cardId}`"
  >
    <img
      v-if="thumbnail.thumbnailUrl"
      :src="thumbnail.thumbnailUrl"
      alt=""
      class="absolute inset-0 h-full w-full object-cover"
      loading="lazy"
    >
    <div v-else class="absolute inset-0 flex items-center justify-center px-1 text-center font-mono text-xs">
      #{{ thumbnail.cardId }}
    </div>

    <img
      v-if="thumbnail.frameUrl"
      :src="thumbnail.frameUrl"
      alt=""
      class="absolute inset-0 h-full w-full object-cover"
      loading="lazy"
    >
    <img
      v-if="thumbnail.attrIconUrl"
      :src="thumbnail.attrIconUrl"
      alt=""
      class="absolute left-0 top-0 w-[24%]"
      loading="lazy"
    >
    <div v-if="thumbnail.rareIconUrl && rareIndexes.length > 0" class="absolute bottom-[6%] left-[6%] flex w-[72%] gap-px">
      <img
        v-for="index in rareIndexes"
        :key="index"
        :src="thumbnail.rareIconUrl"
        alt=""
        class="w-[18%] max-w-4"
        loading="lazy"
      >
    </div>
    <img
      v-if="thumbnail.trainRankUrl"
      :src="thumbnail.trainRankUrl"
      alt=""
      class="absolute bottom-0 right-0 w-[35%]"
      loading="lazy"
    >
    <img
      v-if="!cornerBadge && thumbnail.canvasIconUrl"
      :src="thumbnail.canvasIconUrl"
      alt=""
      class="absolute right-1 top-1 size-4 rounded bg-background/85 p-0.5"
      loading="lazy"
    >
    <span
      v-if="cornerBadge"
      class="absolute right-1 top-1 max-w-[72%] truncate rounded bg-primary px-1 py-0.5 font-mono text-[10px] font-semibold leading-none text-primary-foreground shadow-sm"
    >
      {{ cornerBadge }}
    </span>
  </div>
</template>
