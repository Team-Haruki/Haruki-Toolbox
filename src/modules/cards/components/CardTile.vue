<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Badge } from "@/components/ui/badge"
import SekaiCardThumbnail from "@/shared/components/SekaiCardThumbnail.vue"
import type { CatalogCardThumbnail, CatalogMasterCard } from "@/shared/sekai/catalog"
import { resolveSekaiSupplyLabel } from "@/shared/sekai/labels"
import {
  resolveCardSupplyBadgeVariant,
  resolveCardTileArtSlots,
  resolveCardTileArts,
} from "@/modules/cards/lib/card-display"
import type { CardArtMode } from "@/modules/cards/lib/card-query"

/**
 * One card in the list grid: thumbnail(s) for the current art mode, title,
 * character name and a supply badge for limited / festival / birthday /
 * collab cards. Unreleased cards blur their art (settings) or carry a badge.
 */
const props = defineProps<{
  card: CatalogMasterCard
  thumbnail: CatalogCardThumbnail
  characterName: string | null
  supplyType: string | null
  unreleased: boolean
  blur: boolean
  artMode: CardArtMode
}>()

const { t, te } = useI18n()

const arts = computed(() => resolveCardTileArts(props.card, props.artMode))
// Slot width, not art count: in `both` mode a card with a single artwork keeps
// the half-width slot (centred) so every tile in the row is the same height.
// `basis-*` rather than `w-*` because the thumbnail root already carries
// `w-full` and the two would be an unordered conflict.
const artClass = computed(() => (resolveCardTileArtSlots(props.artMode) > 1 ? "basis-[calc(50%-0.125rem)]" : ""))
const supplyVariant = computed(() => resolveCardSupplyBadgeVariant(props.supplyType))
const supplyLabel = computed(() => resolveSekaiSupplyLabel({ t, te }, props.supplyType))
const title = computed(() => props.card.prefix ?? `#${props.card.id}`)
</script>

<template>
  <RouterLink
    :to="{ name: 'cards.detail', params: { cardId: card.id } }"
    class="group flex min-w-0 flex-col gap-1.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
    :title="title"
  >
    <div :class="['relative', blur ? 'overflow-hidden rounded-md' : '']">
      <div
        :class="[
          'flex justify-center gap-1 rounded-md bg-muted/30 p-1 ring-1 ring-border/60',
          blur ? 'scale-105 blur-md' : 'transition-transform group-hover:scale-[1.02]',
        ]"
      >
        <SekaiCardThumbnail
          v-for="art in arts"
          :key="art"
          :thumbnail="thumbnail"
          :trained="art === 'trained'"
          :unreleased="unreleased && !blur"
          :title="title"
          :class="artClass"
        />
      </div>
      <span
        v-if="blur"
        class="absolute right-1 top-1 rounded bg-red-600 px-1 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm"
      >
        {{ t("sekaiUnreleased.badge") }}
      </span>
    </div>
    <span class="line-clamp-2 text-xs leading-tight group-hover:underline">{{ title }}</span>
    <span v-if="characterName" class="truncate text-[11px] text-muted-foreground">{{ characterName }}</span>
    <Badge v-if="supplyVariant" :variant="supplyVariant" size="sm" class="max-w-full self-start truncate">
      {{ supplyLabel }}
    </Badge>
  </RouterLink>
</template>
