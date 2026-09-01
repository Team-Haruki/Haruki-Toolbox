<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucideBookOpen } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import { resolveSekaiEnumLabel } from "@/shared/sekai/labels"
import type { CardEpisodeCost, CardEpisodeRow } from "@/modules/cards/lib/card-power"

/**
 * Side stories (`cardEpisodes`): part, title, power bonus and unlock costs.
 * Rewards are not rendered — tw/kr/cn dumps ship no `rewardResourceBoxIds`.
 */
defineProps<{
  episodes: readonly CardEpisodeRow[]
  loading: boolean
  defaultOpen: boolean
}>()

const { t, te } = useI18n()

function partLabel(episode: CardEpisodeRow): string {
  return resolveSekaiEnumLabel({ t, te }, "cardCatalog.detail.episodes.partType", episode.partType, `#${episode.seq}`)
}

function bonusTotal(episode: CardEpisodeRow): number {
  return episode.bonus.p1 + episode.bonus.p2 + episode.bonus.p3
}

function costLabel(cost: CardEpisodeCost): string {
  const resource = cost.resourceType === "material" && cost.resourceId != null
    ? t("cardCatalog.detail.episodes.material", { id: cost.resourceId })
    : `${cost.resourceType}${cost.resourceId != null ? ` #${cost.resourceId}` : ""}`
  return t("cardCatalog.detail.episodes.cost", { resource, quantity: cost.quantity })
}
</script>

<template>
  <CatalogDetailSection
    :title="t('cardCatalog.detail.episodes.title')"
    :icon="LucideBookOpen"
    collapsible
    :default-open="defaultOpen"
    :loading="loading && episodes.length === 0"
    :empty="!loading && episodes.length === 0"
    :empty-message="t('cardCatalog.detail.episodes.empty')"
  >
    <template #summary>
      {{ t("cardCatalog.detail.episodes.count", { count: episodes.length }) }}
    </template>

    <ul class="flex flex-col divide-y">
      <li v-for="episode in episodes" :key="episode.id" class="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
        <div class="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" size="sm">{{ partLabel(episode) }}</Badge>
          <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ episode.title || partLabel(episode) }}</span>
          <Badge variant="emerald" size="sm" class="tabular-nums">
            {{ t("cardCatalog.detail.episodes.powerBonus", { value: bonusTotal(episode).toLocaleString() }) }}
          </Badge>
        </div>
        <div v-if="episode.costs.length > 0" class="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span>{{ t("cardCatalog.detail.episodes.costs") }}</span>
          <Badge v-for="(cost, index) in episode.costs" :key="index" variant="outline" size="sm" class="tabular-nums">
            {{ costLabel(cost) }}
          </Badge>
        </div>
      </li>
    </ul>
  </CatalogDetailSection>
</template>
