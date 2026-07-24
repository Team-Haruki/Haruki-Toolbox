<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import type { SekaiCardThumbnailView } from "@/shared/sekai/catalog"

const props = withDefaults(defineProps<{
  thumbnail: SekaiCardThumbnailView
  size?: "fluid" | "xs" | "sm" | "md" | "lg"
  trained?: boolean
  unreleased?: boolean
  title?: string | null
  cornerBadge?: string | null
}>(), {
  size: "fluid",
  trained: false,
  unreleased: false,
  title: null,
  cornerBadge: null,
})

const { t } = useI18n()

const sizeClass = computed(() => {
  if (props.size === "xs") {
    return "size-[clamp(3rem,16vw,3.75rem)] rounded-sm"
  }

  if (props.size === "sm") {
    return "size-11 rounded-sm sm:size-12 md:size-14 xl:size-16"
  }

  if (props.size === "md") {
    return "size-20 rounded-md"
  }

  if (props.size === "lg") {
    return "size-28 rounded-lg"
  }

  return "aspect-square w-full rounded-md"
})

const artUrl = computed(() => {
  if (props.trained && props.thumbnail.trainedThumbnailUrl) {
    return props.thumbnail.trainedThumbnailUrl
  }

  return props.thumbnail.thumbnailUrl
})

const artFailed = ref(false)

watch(artUrl, () => {
  artFailed.value = false
})

const rareIndexes = computed(() => Array.from({ length: props.thumbnail.rareCount }, (_, index) => index))
</script>

<template>
  <div
    :class="[
      'relative shrink-0 select-none overflow-hidden bg-muted text-muted-foreground ring-1 ring-border',
      sizeClass,
    ]"
    :aria-label="title ?? thumbnail.title ?? `#${thumbnail.cardId}`"
  >
    <img
      v-if="artUrl && !artFailed"
      :src="artUrl"
      alt=""
      class="absolute inset-0 h-full w-full object-cover"
      loading="lazy"
      @error="artFailed = true"
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
    <div
      v-if="thumbnail.rareIconUrl && rareIndexes.length > 0"
      class="absolute bottom-[5%] left-[6%] flex w-[74%] gap-px"
    >
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
      v-if="!unreleased && !cornerBadge && thumbnail.canvasIconUrl"
      :src="thumbnail.canvasIconUrl"
      alt=""
      class="absolute right-1 top-1 size-4 rounded bg-background/85 p-0.5"
      loading="lazy"
    >
    <span
      v-if="!unreleased && cornerBadge"
      class="absolute right-1 top-1 max-w-[72%] truncate rounded bg-primary px-1 py-0.5 font-mono text-[10px] font-semibold leading-none text-primary-foreground shadow-sm"
    >
      {{ cornerBadge }}
    </span>
    <span
      v-if="unreleased"
      class="absolute right-1 top-1 rounded bg-red-600 px-1 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm"
    >
      {{ t("sekaiUnreleased.badge") }}
    </span>
  </div>
</template>
