<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideBookOpen, LucideWalletCards } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import CatalogEntityGrid from "@/shared/components/catalog/CatalogEntityGrid.vue"
import CatalogErrorState from "@/shared/components/catalog/CatalogErrorState.vue"
import SekaiCardThumbnail from "@/shared/components/SekaiCardThumbnail.vue"
import { buildCatalogCardThumbnail, type CatalogCharacter } from "@/shared/sekai/catalog"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { isUnreleasedContent } from "@/shared/sekai/unreleased"
import type { EventDetailCard } from "@/modules/events/composables/useEventDetail"
import { formatBonusRate } from "@/modules/events/lib/event-bonus"

const props = withDefaults(defineProps<{
  cards: readonly EventDetailCard[]
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
  characterMap: ReadonlyMap<number, CatalogCharacter>
  nowMs: number
  loading?: boolean
  /** Cards index failure; renders an error state with retry instead of the grid. */
  error?: string | null
  retrying?: boolean
  blurUnreleased?: boolean
}>(), {
  loading: false,
  error: null,
  retrying: false,
  blurUnreleased: false,
})

const emit = defineEmits<{ retry: [] }>()

const { t } = useI18n()

const entries = computed(() => props.cards.map(({ card, link }) => {
  const name = card.characterId != null ? props.characterMap.get(card.characterId)?.name ?? null : null
  const title = card.prefix ? (name ? `${card.prefix} · ${name}` : card.prefix) : (name ?? `#${card.id}`)
  return {
    card,
    link,
    title,
    // en dumps lack `leaderBonusRate`; a zero value carries no information either.
    leaderBonus: link.leaderBonusRate != null && link.leaderBonusRate > 0 ? link.leaderBonusRate : null,
    thumbnail: buildCatalogCardThumbnail(card, props.region, props.assetEndpoint),
    unreleased: isUnreleasedContent(card.releaseAt, props.nowMs),
  }
}))
</script>

<template>
  <CatalogDetailSection
    :title="t('events.detail.cardsTitle')"
    :icon="LucideWalletCards"
    :loading="loading"
    :empty="!error && cards.length === 0"
    :empty-message="t('events.detail.cardsEmpty')"
  >
    <template #action>
      <span v-if="cards.length > 0" class="text-xs font-normal text-muted-foreground tabular-nums">{{ cards.length }}</span>
    </template>
    <template #skeleton>
      <CatalogEntityGrid columns="cards">
        <Skeleton v-for="index in 6" :key="index" class="aspect-square w-full rounded-md" />
      </CatalogEntityGrid>
    </template>
    <CatalogErrorState
      v-if="error"
      :message="t('catalog.detail.loadError')"
      :detail="error"
      :retrying="retrying"
      @retry="emit('retry')"
    />
    <CatalogEntityGrid v-else columns="cards">
      <RouterLink
        v-for="entry in entries"
        :key="entry.card.id"
        :to="`/cards/${entry.card.id}`"
        class="group flex flex-col gap-1 rounded-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        :aria-label="entry.title"
      >
        <div :class="['overflow-hidden rounded-md', entry.unreleased && blurUnreleased ? '[&_img]:blur-md' : '']">
          <SekaiCardThumbnail :thumbnail="entry.thumbnail" :title="entry.title" :unreleased="entry.unreleased" />
        </div>
        <span class="truncate text-center text-xs text-muted-foreground group-hover:text-foreground">{{ entry.title }}</span>
        <span
          v-if="entry.link.bonusRate != null || entry.leaderBonus != null || entry.link.isDisplayCardStory"
          class="flex flex-wrap items-center justify-center gap-1"
        >
          <Badge v-if="entry.link.bonusRate != null" variant="sky" size="sm" class="tabular-nums">
            {{ t("eventCatalog.cards.cardBonus", { rate: formatBonusRate(entry.link.bonusRate) }) }}
          </Badge>
          <Badge v-if="entry.leaderBonus != null" variant="violet" size="sm" class="tabular-nums">
            {{ t("eventCatalog.cards.leaderBonus", { rate: formatBonusRate(entry.leaderBonus) }) }}
          </Badge>
          <Badge v-if="entry.link.isDisplayCardStory" variant="outline" size="sm">
            <LucideBookOpen class="size-3" aria-hidden="true" />
            {{ t("eventCatalog.cards.story") }}
          </Badge>
        </span>
      </RouterLink>
    </CatalogEntityGrid>
  </CatalogDetailSection>
</template>
