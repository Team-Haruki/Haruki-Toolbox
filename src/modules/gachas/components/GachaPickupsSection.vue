<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucideSparkles } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import GachaCardTile from "@/modules/gachas/components/GachaCardTile.vue"
import type { GachaPoolCard } from "@/modules/gachas/lib/gacha-pool"

/**
 * The gacha's PICK UP members as a strip of card tiles for the gacha header.
 * Renders nothing for a gacha without any.
 */
defineProps<{
  cards: readonly GachaPoolCard[]
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
  blurUnreleased: boolean
  wishSelectCount: number
}>()

const { t } = useI18n()
</script>

<template>
  <div v-if="cards.length > 0" class="flex min-w-0 flex-col gap-2" data-testid="gacha-pickups">
    <div class="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
      <p class="flex items-center gap-1.5 text-sm text-muted-foreground">
        <LucideSparkles class="size-4 shrink-0 self-center" aria-hidden="true" />
        {{ t("gachas.detail.pickups") }}
        <span class="tabular-nums">{{ cards.length }}</span>
      </p>
      <p v-if="wishSelectCount > 0" class="text-xs text-muted-foreground/80">
        {{ t("gachaCatalog.pickups.wishHint", { count: wishSelectCount }) }}
      </p>
    </div>
    <div class="flex flex-wrap gap-3">
      <GachaCardTile
        v-for="entry in cards"
        :key="entry.card.id"
        :card="entry.card"
        :region="region"
        :asset-endpoint="assetEndpoint"
        :character-name="entry.characterName"
        :rate="entry.rate"
        :unreleased="entry.unreleased"
        :blur-unreleased="blurUnreleased"
        :wish="entry.isWish && wishSelectCount > 0"
        class="w-20 sm:w-24"
      />
    </div>
  </div>
</template>
