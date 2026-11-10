<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucideChevronRight, LucideTicket } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { Badge } from "@/components/ui/badge"
import { formatLocalizedDateRange } from "@/lib/date-time"
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
}>()

const { t, te } = useI18n()

function imageSources(gacha: CatalogGachaSummary): string[] {
  return buildGachaImageCandidates(gacha, props.region, props.assetEndpoint, props.bannerAliasMap.get(gacha.id))
}

function typeLabel(gacha: CatalogGachaSummary): string | null {
  return gacha.gachaType ? resolveSekaiGachaTypeLabel({ t, te }, gacha.gachaType) : null
}

function period(gacha: CatalogGachaSummary): string {
  return formatLocalizedDateRange(gacha.startAt, gacha.endAt, "date", "?")
}
</script>

<template>
  <div v-if="gachas.length > 0" class="flex min-w-0 flex-col gap-1.5" data-testid="card-related-gachas">
    <p class="flex items-center gap-1.5 text-sm text-muted-foreground">
      <LucideTicket class="size-4 shrink-0" aria-hidden="true" />
      {{ t("cardCatalog.detail.relatedGachas.title") }}
    </p>
    <ul class="flex flex-col gap-1.5">
      <li v-for="gacha in gachas" :key="gacha.id">
        <RouterLink
          :to="{ name: 'gachas.detail', params: { gachaId: gacha.id } }"
          class="flex items-center gap-2.5 rounded-lg border bg-background/70 p-1.5 pr-2 outline-none transition-colors hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-accent/30"
        >
          <div class="relative aspect-[488/208] w-24 shrink-0 overflow-hidden rounded-md bg-muted">
            <SekaiAssetImage :sources="imageSources(gacha)" :alt="gacha.name" fit="contain" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ gacha.name }}</p>
            <div class="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
              <span class="tabular-nums">{{ period(gacha) }}</span>
              <Badge v-if="typeLabel(gacha)" variant="muted" size="sm">{{ typeLabel(gacha) }}</Badge>
            </div>
          </div>
          <LucideChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
