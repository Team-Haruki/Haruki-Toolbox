<script setup lang="ts">
import { computed, ref, watch } from "vue"
import type { CatalogCardThumbnail } from "@/shared/sekai/catalog"

const props = defineProps<{
  thumbnail: CatalogCardThumbnail
  title?: string | null
}>()

const artFailed = ref(false)

const artUrl = computed(() => props.thumbnail.thumbnailUrl)

watch(artUrl, () => {
  artFailed.value = false
})

const rareIndexes = computed(() => Array.from({ length: props.thumbnail.rareCount }, (_, index) => index))
</script>

<template>
  <div
    class="relative aspect-square w-full shrink-0 select-none overflow-hidden rounded-md bg-muted text-muted-foreground ring-1 ring-border"
    :aria-label="title ?? `#${thumbnail.cardId}`"
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
  </div>
</template>
