<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucideChevronRight, LucideTicket } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { Badge } from "@/components/ui/badge"
import { formatLocalizedDate } from "@/lib/date-time"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import { resolveSekaiGachaTypeLabel } from "@/shared/sekai/labels"
import type { CatalogGachaSummary } from "@/modules/gachas"
import { buildGachaImageCandidates } from "@/modules/gachas/lib/gacha-catalog"

/**
 * Gachas that pick up the card, original run first. Banner candidates follow
 * the gacha module's rules (rerun banners alias their original run).
 */
const props = defineProps<{
  gachas: readonly CatalogGachaSummary[]
  bannerAliasMap: ReadonlyMap<number, number>
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
  loading: boolean
}>()

const { t, te } = useI18n()

function imageSources(gacha: CatalogGachaSummary): string[] {
  return buildGachaImageCandidates(gacha, props.region, props.assetEndpoint, props.bannerAliasMap.get(gacha.id))
}

function typeLabel(gacha: CatalogGachaSummary): string | null {
  return gacha.gachaType ? resolveSekaiGachaTypeLabel({ t, te }, gacha.gachaType) : null
}

function period(gacha: CatalogGachaSummary): string {
  const format = (value: number | null) => formatLocalizedDate(value, { dateStyle: "medium" }, "?")
  return `${format(gacha.startAt)} – ${format(gacha.endAt)}`
}
</script>

<template>
  <CatalogDetailSection
    :title="t('cardCatalog.detail.relatedGachas.title')"
    :icon="LucideTicket"
    :loading="loading && gachas.length === 0"
    :empty="!loading && gachas.length === 0"
    :empty-message="t('cardCatalog.detail.relatedGachas.empty')"
  >
    <ul class="flex flex-col gap-2">
      <li v-for="gacha in gachas" :key="gacha.id">
        <RouterLink
          :to="{ name: 'gachas.detail', params: { gachaId: gacha.id } }"
          class="flex items-center gap-3 rounded-md border bg-muted/20 p-2.5 transition-colors hover:bg-accent/50 dark:hover:bg-accent/30"
        >
          <div class="relative aspect-[2/1] w-28 shrink-0 overflow-hidden rounded-md bg-muted sm:w-36">
            <SekaiAssetImage :sources="imageSources(gacha)" :alt="gacha.name" />
          </div>
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <p class="truncate text-sm font-medium">{{ gacha.name }}</p>
            <div class="flex flex-wrap items-center gap-1">
              <Badge v-if="typeLabel(gacha)" variant="muted" size="sm">{{ typeLabel(gacha) }}</Badge>
              <span class="font-mono text-[11px] text-muted-foreground">#{{ gacha.id }}</span>
            </div>
            <p class="text-xs text-muted-foreground tabular-nums">{{ period(gacha) }}</p>
          </div>
          <LucideChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </RouterLink>
      </li>
    </ul>
  </CatalogDetailSection>
</template>
