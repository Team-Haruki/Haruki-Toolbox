<script setup lang="ts">
import { computed, ref, toRef } from "vue"
import { useI18n } from "vue-i18n"
import { LucideTrophy } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import CatalogErrorState from "@/shared/components/catalog/CatalogErrorState.vue"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import { resolveSekaiHonorImageUrl } from "@/shared/sekai/data-sources"
import { resolveSekaiEnumLabel } from "@/shared/sekai/labels"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { useEventRewards } from "@/modules/events/composables/useEventRewards"
import { resolveEventHonorRankOverlayUrl } from "@/modules/events/lib/event-assets"
import type { EventRankingReward, EventRankingRewardRange, EventRewardHonor } from "@/modules/events/lib/event-rewards"

/**
 * Ranking rewards per rank range. The honors / resource-box tables are heavy
 * (tens of thousands of rows on jp), so the resource only loads on the first
 * `open` of this collapsible section — never on mount.
 */
const props = defineProps<{
  ranges: readonly EventRankingRewardRange[]
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
}>()

const { t, te } = useI18n()

const enabled = ref(false)
const rewards = useEventRewards(toRef(props, "region"), toRef(props, "ranges"), enabled)

const loading = computed(() => enabled.value && rewards.data.value == null && rewards.error.value == null)

function rankLabel(range: EventRankingRewardRange): string {
  return range.fromRank === range.toRank
    ? t("eventCatalog.rewards.rank", { rank: range.fromRank.toLocaleString() })
    : t("eventCatalog.rewards.rankRange", { from: range.fromRank.toLocaleString(), to: range.toRank.toLocaleString() })
}

function honorSources(honor: EventRewardHonor): string[] {
  return [resolveSekaiHonorImageUrl(props.region, honor.backgroundAssetbundleName ?? honor.assetbundleName, props.assetEndpoint)]
}

function honorOverlay(honor: EventRewardHonor): string | null {
  return honor.backgroundAssetbundleName
    ? resolveEventHonorRankOverlayUrl(props.region, honor.assetbundleName, props.assetEndpoint)
    : null
}

function resourceLabel(reward: Extract<EventRankingReward, { kind: "resource" }>): string {
  const name = resolveSekaiEnumLabel({ t, te }, "eventCatalog.rewards.resourceType", reward.resourceType)
  return reward.quantity > 1 ? `${name} ×${reward.quantity.toLocaleString()}` : name
}
</script>

<template>
  <CatalogDetailSection
    :title="t('eventCatalog.rewards.title')"
    :icon="LucideTrophy"
    collapsible
    :default-open="false"
    :loading="loading"
    :empty="ranges.length === 0"
    :empty-message="t('eventCatalog.rewards.empty')"
    content-class="flex flex-col gap-3"
    @open="enabled = true"
  >
    <template #summary>
      {{ t("eventCatalog.rewards.rangeCount", { count: ranges.length }) }}
    </template>
    <template #skeleton>
      <div class="flex flex-col gap-2">
        <Skeleton v-for="index in 4" :key="index" class="h-10 w-full" />
      </div>
    </template>

    <CatalogErrorState
      v-if="rewards.error.value"
      :message="t('catalog.detail.loadError')"
      :detail="rewards.error.value"
      :retrying="rewards.refreshing.value"
      @retry="rewards.reload"
    />
    <template v-else>
      <p v-if="rewards.unavailable.value" class="text-xs text-muted-foreground">
        {{ t("eventCatalog.rewards.unavailable") }}
      </p>
      <div class="flex flex-col divide-y divide-border/60 rounded-md border border-border/60">
        <div
          v-for="row in rewards.rows.value"
          :key="`${row.fromRank}-${row.toRank}`"
          class="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center"
        >
          <div class="flex shrink-0 items-center gap-1.5 sm:w-40">
            <span class="text-sm font-medium tabular-nums">{{ rankLabel(row) }}</span>
            <Badge v-if="row.isToRankBorder" variant="amber" size="sm">{{ t("eventCatalog.rewards.border") }}</Badge>
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            <template v-for="reward in row.rewards" :key="reward.key">
              <span
                v-if="reward.kind === 'honor'"
                class="relative h-8 w-[9.5rem] shrink-0 overflow-hidden rounded-sm bg-muted/40"
                :title="reward.honor.name"
                role="img"
                :aria-label="reward.honor.name"
              >
                <SekaiAssetImage :sources="honorSources(reward.honor)" :alt="reward.honor.name" fit="contain" />
                <SekaiAssetImage
                  v-if="honorOverlay(reward.honor)"
                  :sources="[honorOverlay(reward.honor)]"
                  alt=""
                  fit="contain"
                  img-class="object-right"
                  placeholder-class="hidden"
                />
              </span>
              <Badge v-else variant="muted" size="sm" class="tabular-nums">{{ resourceLabel(reward) }}</Badge>
            </template>
            <span v-if="row.rewards.length === 0" class="text-xs text-muted-foreground">—</span>
          </div>
        </div>
      </div>
    </template>
  </CatalogDetailSection>
</template>
