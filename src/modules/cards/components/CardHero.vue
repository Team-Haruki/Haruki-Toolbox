<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { LucideArrowUpRight, LucideCalendarDays, LucideCheck, LucideCopy, LucideExpand, LucideQuote } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import CatalogTimeZoneHint from "@/shared/components/catalog/CatalogTimeZoneHint.vue"
import CatalogZonedTime from "@/shared/components/catalog/CatalogZonedTime.vue"
import ImageLightbox, { type ImageLightboxItem } from "@/shared/components/ImageLightbox.vue"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import SekaiAttrIcon from "@/shared/components/SekaiAttrIcon.vue"
import SekaiCharacterAvatar from "@/shared/components/SekaiCharacterAvatar.vue"
import SekaiRarityStars from "@/shared/components/SekaiRarityStars.vue"
import SekaiUnitLogo from "@/shared/components/SekaiUnitLogo.vue"
import {
  cardRarityHasTrainedArt,
  cardShowsOnlyTrainedArt,
  type CatalogCharacter,
  type CatalogMasterCard,
  type SekaiUnit,
} from "@/shared/sekai/catalog"
import { resolveSekaiSupplyLabel } from "@/shared/sekai/labels"
import type { CardIndexExtras } from "@/modules/cards/composables/useCardsIndex"
import { CARD_FULL_ART_ASPECT_CLASS, resolveCardFullArtUrls } from "@/modules/cards/lib/card-assets"
import { resolveCardSupplyBadgeVariant, type CardArtKind } from "@/modules/cards/lib/card-display"

/**
 * The card page's header: the artwork (normal / trained, opening the
 * full-size viewer) beside everything that says what the card is — title,
 * character, rarity, attribute, supply, unit, release time and its lines.
 */
const props = defineProps<{
  card: CatalogMasterCard
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
  /** Unreleased art stays blurred and never opens the viewer. */
  blur: boolean
  unreleased: boolean
  character: CatalogCharacter | null
  unit: SekaiUnit | null
  supportUnit: SekaiUnit | null
  supplyType: string | null
  unitColorMap: ReadonlyMap<SekaiUnit, string>
  extras: CardIndexExtras | null
}>()

const { t, te } = useI18n()

const supplyLabel = computed(() => resolveSekaiSupplyLabel({ t, te }, props.supplyType))
const supplyVariant = computed(() => resolveCardSupplyBadgeVariant(props.supplyType) ?? "muted")
const characterRoute = computed(() => (props.character
  ? { name: "cards.list", query: { chars: String(props.character.id) } }
  : null))

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | null = null

async function copyAssetName() {
  try {
    await navigator.clipboard.writeText(props.card.assetbundleName)
  } catch {
    // Clipboard blocked: the name stays selectable.
    return
  }
  copied.value = true
  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copied.value = false
  }, 1500)
}


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

function selectArt(value: unknown) {
  if (value === "normal" || value === "trained") {
    art.value = value
  }
}
</script>

<template>
  <header class="overflow-hidden rounded-2xl border bg-card shadow-xs" data-testid="card-detail-hero">
    <div class="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div class="relative">
        <button
          type="button"
          :class="[
            'group relative block w-full overflow-hidden bg-muted outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50',
            CARD_FULL_ART_ASPECT_CLASS,
            blur ? 'cursor-default' : 'cursor-pointer',
          ]"
          :aria-label="t('catalog.detail.zoom')"
          :disabled="blur"
          @click="openLightbox"
        >
          <SekaiAssetImage :sources="sources" :alt="title" eager :blur="blur" />
          <span
            v-if="!blur"
            class="pointer-events-none absolute right-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 pointer-coarse:opacity-100"
            aria-hidden="true"
          >
            <LucideExpand class="size-3.5" />
            {{ t("catalog.detail.zoom") }}
          </span>
        </button>
        <!-- 40 px tall on touch: the art toggle is the most-tapped control on the page. -->
        <ToggleGroup
          v-if="arts.length > 1"
          type="single"
          variant="segment"
          size="sm"
          :model-value="art"
          :aria-label="t('cardCatalog.artMode.label')"
          class="absolute top-2.5 left-2.5 bg-background/85 shadow-sm backdrop-blur-sm"
          data-testid="card-art-toggle"
          @update:model-value="selectArt"
        >
          <ToggleGroupItem v-for="kind in arts" :key="kind" :value="kind" class="px-3 pointer-coarse:min-h-10 pointer-coarse:px-4">
            {{ t(`cardCatalog.detail.art.${kind}`) }}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div class="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
        <div class="flex flex-col gap-2">
          <div class="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <h1 class="min-w-0 text-2xl leading-tight font-bold">{{ title }}</h1>
            <span class="font-mono text-sm text-muted-foreground">#{{ card.id }}</span>
          </div>
          <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <span
              v-if="unreleased"
              class="rounded bg-red-600 px-1.5 py-0.5 text-xs leading-none font-semibold text-white shadow-sm"
            >
              {{ t("sekaiUnreleased.badge") }}
            </span>
            <SekaiRarityStars :card-rarity-type="card.cardRarityType" :trained="card.trainedByDefault" size="sm" />
            <SekaiAttrIcon v-if="card.attr" :attr="card.attr" size="sm" show-label class="text-sm" />
            <Badge v-if="supplyType" :variant="supplyVariant" size="sm">{{ supplyLabel }}</Badge>
          </div>
        </div>

        <dl class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2.5 text-sm">
          <template v-if="character">
            <dt class="text-muted-foreground">{{ t("cardCatalog.detail.info.character") }}</dt>
            <dd class="min-w-0">
              <RouterLink
                v-if="characterRoute"
                :to="characterRoute"
                class="inline-flex max-w-full items-center gap-2 rounded-md font-medium outline-none transition-colors hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:min-h-10"
                :title="t('cardCatalog.detail.viewCharacterCards')"
              >
                <SekaiCharacterAvatar :character-id="character.id" :name="character.name" size="sm" />
                <span class="truncate">{{ character.name }}</span>
                <LucideArrowUpRight class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              </RouterLink>
            </dd>
          </template>

          <template v-if="unit">
            <dt class="text-muted-foreground">{{ t("cardCatalog.detail.info.unit") }}</dt>
            <dd class="min-w-0"><SekaiUnitLogo :unit="unit" size="md" show-label :color="unitColorMap.get(unit) ?? null" /></dd>
          </template>

          <template v-if="supportUnit">
            <dt class="text-muted-foreground">{{ t("cardCatalog.detail.info.supportUnit") }}</dt>
            <dd class="min-w-0"><SekaiUnitLogo :unit="supportUnit" size="md" show-label :color="unitColorMap.get(supportUnit) ?? null" /></dd>
          </template>

          <!-- Local time with the server time one hover (or one line) away:
               a JST midnight release is not "yesterday 23:00". -->
          <template v-if="card.releaseAt != null">
            <dt class="flex items-center gap-1.5 text-muted-foreground">
              <LucideCalendarDays class="size-4 shrink-0" aria-hidden="true" />
              {{ t("cardCatalog.detail.info.releaseAt") }}
            </dt>
            <dd class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <CatalogZonedTime :value="card.releaseAt" :region="region" options="dateTime" />
              <CatalogTimeZoneHint :region="region" switchable />
            </dd>
          </template>
        </dl>

        <div v-if="extras?.gachaPhrase || extras?.flavorText" class="flex flex-col gap-2 rounded-xl bg-muted/40 px-3.5 py-3 text-sm">
          <p v-if="extras?.gachaPhrase" class="flex items-start gap-2" :title="t('cardCatalog.detail.info.gachaPhrase')">
            <LucideQuote class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span class="sr-only">{{ t("cardCatalog.detail.info.gachaPhrase") }}</span>
            <span class="min-w-0 font-medium break-words">{{ extras.gachaPhrase }}</span>
          </p>
          <p v-if="extras?.flavorText" class="min-w-0 text-xs leading-relaxed break-words whitespace-pre-line text-muted-foreground">
            <span class="sr-only">{{ t("cardCatalog.detail.info.flavorText") }}</span>
            {{ extras.flavorText }}
          </p>
        </div>

        <button
          v-if="card.assetbundleName"
          type="button"
          class="mt-auto inline-flex min-h-6 max-w-full items-center gap-1.5 self-start rounded-md border border-dashed px-1.5 text-left font-mono text-xs break-all text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:min-h-8"
          :aria-label="`${t('catalog.detail.copyAssetName')}: ${card.assetbundleName}`"
          :title="t('catalog.detail.copyAssetName')"
          data-slot="catalog-asset-name"
          @click="copyAssetName"
        >
          <span>{{ card.assetbundleName }}</span>
          <LucideCheck v-if="copied" class="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <LucideCopy v-else class="size-3 shrink-0" aria-hidden="true" />
          <span class="sr-only" aria-live="polite">{{ copied ? t("catalog.detail.assetNameCopied") : "" }}</span>
        </button>
      </div>
    </div>

    <!-- Where the card came from (its events and gachas), across the full width. -->
    <div v-if="$slots.footer" class="border-t px-4 py-3.5 sm:px-5" data-testid="card-hero-footer">
      <slot name="footer" />
    </div>

    <ImageLightbox
      v-model:open="lightboxOpen"
      v-model:index="lightboxIndex"
      :items="lightboxItems"
      :title="title"
    />
  </header>
</template>
