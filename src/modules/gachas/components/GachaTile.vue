<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Card, CardContent } from "@/components/ui/card"
import { formatLocalizedDate } from "@/lib/date-time"
import CatalogStatusBadge from "@/shared/components/catalog/CatalogStatusBadge.vue"
import GachaAssetImage from "@/modules/gachas/components/GachaAssetImage.vue"
import GachaPickupAvatars from "@/modules/gachas/components/GachaPickupAvatars.vue"
import GachaTypeBadge from "@/modules/gachas/components/GachaTypeBadge.vue"
import type { GachaListTile } from "@/modules/gachas/composables/useGachaList"

const props = defineProps<{
  tile: GachaListTile
  /** Blur unreleased artwork instead of hiding the gacha. */
  blurUnreleased: boolean
}>()

const { t } = useI18n()

const blur = computed(() => props.tile.unreleased && props.blurUnreleased)

function formatDate(value: number | null): string {
  return formatLocalizedDate(value, { year: "numeric", month: "2-digit", day: "2-digit" }, t("gachas.common.dateFallback"))
}
</script>

<template>
  <RouterLink
    :to="{ name: 'gachas.detail', params: { gachaId: tile.gacha.id } }"
    class="group block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
    data-slot="gacha-tile"
  >
    <Card class="h-full gap-0 overflow-hidden py-0 transition-shadow group-hover:shadow-md">
      <div class="relative aspect-[2/1] w-full overflow-hidden bg-muted">
        <GachaAssetImage :sources="tile.imageSources" :alt="tile.gacha.name" :blur="blur" />
        <span
          v-if="tile.unreleased"
          class="absolute right-1.5 top-1.5 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm"
        >
          {{ t("sekaiUnreleased.badge") }}
        </span>
      </div>
      <CardContent class="flex flex-1 flex-col gap-1.5 p-2.5 sm:p-3">
        <h3 class="line-clamp-2 text-sm font-semibold leading-snug group-hover:underline">
          {{ tile.gacha.name }}
        </h3>
        <div class="flex flex-wrap items-center gap-1.5">
          <GachaTypeBadge :gacha-type="tile.gacha.gachaType" size="sm" />
          <CatalogStatusBadge :status="tile.status" :until-ms="tile.untilMs" size="sm" />
        </div>
        <div class="mt-auto flex items-end justify-between gap-2 pt-0.5">
          <p class="text-xs text-muted-foreground tabular-nums">
            {{ formatDate(tile.gacha.startAt) }} – {{ formatDate(tile.gacha.endAt) }}
          </p>
          <GachaPickupAvatars :characters="tile.pickupCharacters" :extra-count="tile.extraPickupCount" size="xs" />
        </div>
      </CardContent>
    </Card>
  </RouterLink>
</template>
