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
import { resolveSekaiGameAssetUrl } from "@/shared/sekai/data-sources"
import { resolveSekaiEnumLabel } from "@/shared/sekai/labels"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { useEventRewards } from "@/modules/events/composables/useEventRewards"
import HonorBadge from "@/modules/rank-border/components/HonorBadge.vue"
import { buildHonorView } from "@/modules/rank-border/lib/honor-visuals"
import type { EventRankingReward, EventRankingRewardRange } from "@/modules/events/lib/event-rewards"
import type { RankBorderHonorView } from "@/modules/rank-border/lib/rank-border-types"

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

/**
 * Honor views, memoized per reward key. Composed the way the game (and the
 * drawing API's `HonorBadgeBox`) draws a sub honor: background, rarity frame,
 * the `TOP n` rank plate at its offset — not two images stretched over a box.
 */
const honorViews = computed(() => {
  const views = new Map<string, RankBorderHonorView>()
  for (const row of rewards.rows.value) {
    for (const reward of row.rewards) {
      if (reward.kind !== "honor") {
        continue
      }
      views.set(reward.key, buildHonorView({
        key: `event-reward:${reward.key}`,
        label: reward.honor.name,
        honor: reward.honor.master,
        group: reward.honor.group,
        honorId: reward.honor.id,
        level: reward.level,
        mode: "sub",
      }, { region: props.region, assetEndpoint: props.assetEndpoint }))
    }
  }
  return views
})

function honorView(reward: Extract<EventRankingReward, { kind: "honor" }>): RankBorderHonorView {
  return honorViews.value.get(reward.key) ?? buildHonorView({
    key: `event-reward:${reward.key}`,
    label: reward.honor.name,
    honor: reward.honor.master,
    group: reward.honor.group,
    honorId: reward.honor.id,
    level: reward.level,
    mode: "sub",
  }, { region: props.region, assetEndpoint: props.assetEndpoint })
}

type ResourceReward = Extract<EventRankingReward, { kind: "resource" }>

/** The resource's own name ("Wish Piece") where the master data has one, else its type ("Material"). */
function resourceName(reward: ResourceReward): string {
  return reward.name ?? resolveSekaiEnumLabel({ t, te }, "eventCatalog.rewards.resourceType", reward.resourceType)
}

function resourceQuantity(reward: ResourceReward): string {
  return `×${reward.quantity.toLocaleString()}`
}

/** Read out and shown on hover: the thumbnail alone does not say what the item is. */
function resourceLabel(reward: ResourceReward): string {
  return reward.quantity > 1 ? `${resourceName(reward)} ${resourceQuantity(reward)}` : resourceName(reward)
}

// A thumbnail that did not load (an item newer than the asset mirror) falls back to the name.
const missingIcons = ref(new Set<string>())

function resourceIcon(reward: ResourceReward): string | null {
  return reward.iconPath && !missingIcons.value.has(reward.iconPath)
    ? resolveSekaiGameAssetUrl(props.region, reward.iconPath, props.assetEndpoint)
    : null
}

function markIconMissing(reward: ResourceReward) {
  if (reward.iconPath) {
    missingIcons.value = new Set(missingIcons.value).add(reward.iconPath)
  }
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
      <!-- Container queries, not viewport breakpoints: this card sits in the
           detail page's 20rem sidebar, where a rank label beside a badge
           overflows the card at any viewport width. -->
      <div class="flex flex-col divide-y divide-border/60 rounded-md border border-border/60 @container">
        <div
          v-for="row in rewards.rows.value"
          :key="`${row.fromRank}-${row.toRank}`"
          class="flex flex-col gap-2 px-3 py-2 @lg:flex-row @lg:items-center"
        >
          <div class="flex shrink-0 items-center gap-1.5 @lg:w-40">
            <span class="text-sm font-medium tabular-nums">{{ rankLabel(row) }}</span>
            <Badge v-if="row.isToRankBorder" variant="amber" size="sm">{{ t("eventCatalog.rewards.border") }}</Badge>
          </div>
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            <template v-for="reward in row.rewards" :key="reward.key">
              <span
                v-if="reward.kind === 'honor'"
                class="inline-flex shrink-0 items-center"
                :title="reward.honor.name"
                role="img"
                :aria-label="reward.honor.name"
              >
                <HonorBadge :honor="honorView(reward)" variant="reward" />
              </span>
              <span
                v-else-if="resourceIcon(reward)"
                class="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-muted py-0.5 pl-0.5 pr-2.5 text-xs font-medium tabular-nums text-foreground"
                :title="resourceLabel(reward)"
                role="img"
                :aria-label="resourceLabel(reward)"
                data-testid="event-reward-resource"
              >
                <span class="relative size-7 shrink-0 overflow-hidden rounded-md">
                  <SekaiAssetImage
                    :sources="[resourceIcon(reward)]"
                    alt=""
                    fit="contain"
                    :shimmer="false"
                    @exhausted="markIconMissing(reward)"
                  />
                </span>
                {{ resourceQuantity(reward) }}
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
