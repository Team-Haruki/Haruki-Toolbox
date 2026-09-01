<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { formatLocalizedDate } from "@/lib/date-time"
import CatalogStatusBadge from "@/shared/components/catalog/CatalogStatusBadge.vue"
import GachaAssetImage from "@/modules/gachas/components/GachaAssetImage.vue"
import GachaPickupAvatars from "@/modules/gachas/components/GachaPickupAvatars.vue"
import GachaTypeBadge from "@/modules/gachas/components/GachaTypeBadge.vue"
import type { GachaListTile } from "@/modules/gachas/composables/useGachaList"

const props = defineProps<{
  tile: GachaListTile
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
    class="group flex items-center gap-3 rounded-md border bg-card p-2 outline-none transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-accent/30"
    data-slot="gacha-list-row"
  >
    <div class="relative aspect-[2/1] w-24 shrink-0 overflow-hidden rounded-md bg-muted sm:w-32">
      <GachaAssetImage :sources="tile.imageSources" :alt="tile.gacha.name" :blur="blur" />
      <span
        v-if="tile.unreleased"
        class="absolute right-1 top-1 rounded bg-red-600 px-1 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm"
      >
        {{ t("sekaiUnreleased.badge") }}
      </span>
    </div>
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <p class="line-clamp-2 text-sm font-medium leading-snug group-hover:underline">{{ tile.gacha.name }}</p>
      <div class="flex flex-wrap items-center gap-1.5">
        <GachaTypeBadge :gacha-type="tile.gacha.gachaType" size="sm" />
        <CatalogStatusBadge :status="tile.status" :until-ms="tile.untilMs" size="sm" />
        <span class="font-mono text-[11px] text-muted-foreground">#{{ tile.gacha.id }}</span>
      </div>
      <p class="text-xs text-muted-foreground tabular-nums">
        {{ formatDate(tile.gacha.startAt) }} – {{ formatDate(tile.gacha.endAt) }}
      </p>
    </div>
    <GachaPickupAvatars
      :characters="tile.pickupCharacters"
      :extra-count="tile.extraPickupCount"
      size="sm"
      class="hidden shrink-0 sm:flex"
    />
  </RouterLink>
</template>
