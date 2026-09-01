<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucideSparkles } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import GachaCardTile from "@/modules/gachas/components/GachaCardTile.vue"
import type { GachaPoolCard } from "@/modules/gachas/lib/gacha-pool"

defineProps<{
  cards: readonly GachaPoolCard[]
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
  blurUnreleased: boolean
  loading: boolean
  wishSelectCount: number
}>()

const { t } = useI18n()
</script>

<template>
  <CatalogDetailSection
    :title="t('gachas.detail.pickups')"
    :icon="LucideSparkles"
    :loading="loading"
    :empty="cards.length === 0"
    :empty-message="t('gachaCatalog.pickups.empty')"
    :description="wishSelectCount > 0 ? t('gachaCatalog.pickups.wishHint', { count: wishSelectCount }) : null"
  >
    <template #skeleton>
      <div class="flex flex-wrap gap-3">
        <div v-for="index in 4" :key="index" class="flex w-24 flex-col gap-1.5 sm:w-28">
          <Skeleton class="aspect-square w-full rounded-md" />
          <Skeleton class="h-3 w-4/5" />
          <Skeleton class="h-3 w-1/2" />
        </div>
      </div>
    </template>
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
        class="w-24 sm:w-28"
      />
    </div>
  </CatalogDetailSection>
</template>
