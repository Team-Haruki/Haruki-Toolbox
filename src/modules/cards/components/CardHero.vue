<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { LucideZoomIn } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ImageLightbox, { type ImageLightboxItem } from "@/shared/components/ImageLightbox.vue"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import { cardRarityHasTrainedArt, cardShowsOnlyTrainedArt, type CatalogMasterCard } from "@/shared/sekai/catalog"
import { CARD_FULL_ART_ASPECT_CLASS, resolveCardFullArtUrls } from "@/modules/cards/lib/card-assets"
import type { CardArtKind } from "@/modules/cards/lib/card-display"

/**
 * Full card art with Normal / Trained tabs (only when both exist) and a
 * click-to-open lightbox carrying both artworks as tabs.
 */
const props = defineProps<{
  card: CatalogMasterCard
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
  /** Unreleased art stays blurred and never opens the lightbox. */
  blur: boolean
}>()

const { t } = useI18n()

const arts = computed<CardArtKind[]>(() => {
  if (cardShowsOnlyTrainedArt(props.card)) {
    return ["trained"]
  }
  return cardRarityHasTrainedArt(props.card.cardRarityType) ? ["normal", "trained"] : ["normal"]
})

const art = ref<CardArtKind>(arts.value[0])

watch(() => props.card.id, () => {
  art.value = arts.value[0]
})

watch(arts, (list) => {
  if (!list.includes(art.value)) {
    art.value = list[0]
  }
})

const title = computed(() => props.card.prefix ?? `#${props.card.id}`)

function artSources(kind: CardArtKind): string[] {
  return resolveCardFullArtUrls(props.region, props.card.assetbundleName, kind === "trained", props.assetEndpoint)
}

const sources = computed(() => artSources(art.value))

const lightboxItems = computed<ImageLightboxItem[]>(() => arts.value.map((kind) => ({
  label: t(`cardCatalog.detail.art.${kind}`),
  sources: artSources(kind),
  alt: title.value,
})))

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

function openLightbox() {
  if (props.blur) {
    return
  }
  lightboxIndex.value = Math.max(0, arts.value.indexOf(art.value))
  lightboxOpen.value = true
}

function handleTab(value: string | number) {
  if (value === "normal" || value === "trained") {
    art.value = value
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <Tabs v-if="arts.length > 1" :model-value="art" @update:model-value="handleTab">
      <TabsList>
        <TabsTrigger v-for="kind in arts" :key="kind" :value="kind">
          {{ t(`cardCatalog.detail.art.${kind}`) }}
        </TabsTrigger>
      </TabsList>
    </Tabs>
    <button
      type="button"
      :class="[
        'group relative w-full overflow-hidden rounded-lg bg-muted ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring',
        CARD_FULL_ART_ASPECT_CLASS,
        blur ? 'cursor-default' : 'cursor-zoom-in',
      ]"
      :aria-label="t('catalog.detail.zoom')"
      :disabled="blur"
      @click="openLightbox"
    >
      <SekaiAssetImage :sources="sources" :alt="title" eager :blur="blur" />
      <span
        v-if="!blur"
        class="pointer-events-none absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md bg-background/80 px-2 py-1 text-xs text-foreground opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        aria-hidden="true"
      >
        <LucideZoomIn class="size-3.5" />
        {{ t("catalog.detail.zoom") }}
      </span>
    </button>
    <ImageLightbox
      v-model:open="lightboxOpen"
      v-model:index="lightboxIndex"
      :items="lightboxItems"
      :title="title"
    />
  </div>
</template>
