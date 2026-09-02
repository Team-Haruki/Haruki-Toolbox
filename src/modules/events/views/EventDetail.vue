<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideChartLine, LucideLayoutGrid } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatLocalizedDate } from "@/lib/date-time"
import CatalogDetailShell from "@/shared/components/catalog/CatalogDetailShell.vue"
import CatalogStatusBadge from "@/shared/components/catalog/CatalogStatusBadge.vue"
import SekaiUnitLogo from "@/shared/components/SekaiUnitLogo.vue"
import { useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import { useSettingsStore } from "@/shared/stores/settings"
import EventBonusSection from "@/modules/events/components/EventBonusSection.vue"
import EventCardsSection from "@/modules/events/components/EventCardsSection.vue"
import EventChaptersSection from "@/modules/events/components/EventChaptersSection.vue"
import EventHero from "@/modules/events/components/EventHero.vue"
import EventMusicsSection from "@/modules/events/components/EventMusicsSection.vue"
import EventRelatedGachasSection from "@/modules/events/components/EventRelatedGachasSection.vue"
import EventRewardsSection from "@/modules/events/components/EventRewardsSection.vue"
import EventStorySection from "@/modules/events/components/EventStorySection.vue"
import EventTeamsSection from "@/modules/events/components/EventTeamsSection.vue"
import EventTimelineSection from "@/modules/events/components/EventTimelineSection.vue"
import EventTypeBadge from "@/modules/events/components/EventTypeBadge.vue"
import { useEventDetail } from "@/modules/events/composables/useEventDetail"
import { buildEventDeckRecommendLink, buildEventRankBorderLink } from "@/modules/events/lib/event-links"

const props = defineProps<{
  eventId: string
}>()

const { t } = useI18n()
const settingsStore = useSettingsStore()
const { region } = useEffectiveCatalogRegion()
const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)

const eventIdNumber = computed(() => {
  const parsed = Number(props.eventId)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
})

const detail = useEventDetail(region, eventIdNumber)
const { event, status, now } = detail

const listRoute = { name: "events.list" } as const

const dateFormat: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit" }
const subtitle = computed(() => {
  if (!event.value) {
    return null
  }
  const fallback = t("events.common.dateFallback")
  return `${formatLocalizedDate(event.value.startAt, dateFormat, fallback)} – ${formatLocalizedDate(event.value.aggregateAt, dateFormat, fallback)}`
})

const rankBorderLink = computed(() => (
  event.value && status.value
    ? buildEventRankBorderLink(event.value, region.value, status.value, detail.chapters.value, now.value)
    : null
))

const deckRecommendLink = computed(() => (
  status.value ? buildEventDeckRecommendLink(region.value, status.value, detail.bonusGroups.value) : null
))

const bannerAliasMap = computed(() => detail.gachasIndex.data.value?.bannerAliasMap ?? null)
const isWorldBloom = computed(() => event.value?.eventType === "world_bloom")
const isCheerfulCarnival = computed(() => event.value?.eventType === "cheerful_carnival")
</script>

<template>
  <CatalogDetailShell
    :title="event?.name ?? null"
    :subtitle="subtitle"
    :entity-id="eventIdNumber"
    :list-title="t('events.list.title')"
    :list-route="listRoute"
    :loading="detail.eventsIndex.loading.value"
    :error="detail.eventsIndex.error.value"
    :not-found="detail.notFound.value"
    :not-found-message="t('events.detail.notFound')"
    :error-message="t('events.detail.loadFailed')"
    :retrying="detail.eventsIndex.refreshing.value"
    :unreleased="detail.unreleased.value"
    @retry="detail.eventsIndex.reload"
  >
    <template #badges>
      <template v-if="event">
        <EventTypeBadge :event-type="event.eventType" />
        <CatalogStatusBadge v-if="status" :status="status" />
        <SekaiUnitLogo v-if="event.unit" :unit="event.unit" size="sm" show-label class="text-xs text-muted-foreground" />
      </template>
    </template>

    <template #actions>
      <Button v-if="rankBorderLink" as-child variant="outline" size="sm">
        <RouterLink :to="rankBorderLink">
          <LucideChartLine class="size-4" />
          {{ t("events.detail.links.rankBorder") }}
        </RouterLink>
      </Button>
      <Button v-if="deckRecommendLink" as-child variant="outline" size="sm">
        <RouterLink :to="deckRecommendLink">
          <LucideLayoutGrid class="size-4" />
          {{ t("events.detail.links.deckRecommend") }}
        </RouterLink>
      </Button>
    </template>

    <template #skeleton>
      <div class="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        <div class="flex flex-col gap-4">
          <Skeleton class="h-56 w-full rounded-xl" />
          <Skeleton class="h-72 w-full rounded-xl" />
        </div>
        <div class="flex flex-col gap-4">
          <Skeleton class="h-64 w-full rounded-xl" />
          <Skeleton class="h-56 w-full rounded-xl" />
        </div>
      </div>
    </template>

    <template v-if="event && status">
      <!-- Sidebar + main, like the music page: no two sections ever have to
           line up. The sidebar is what the event *is* — its art and its
           dates — and, under that, the reference sections that open on
           demand (gachas, rewards, story). The main column is what it
           *contains*: bonuses, cards, songs, chapters, teams. The main column
           spans both grid rows, so the references sit directly under the
           timeline on wide screens and after everything else on narrow ones.
           `auto 1fr` rows matter: without them the spanning main column
           spreads its height into row 1 and pushes the references ~130px
           below the timeline. -->
      <div class="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:items-start">
        <div class="flex min-w-0 flex-col gap-4">
          <EventHero
            :event="event"
            :region="region"
            :asset-endpoint="assetEndpoint"
            :blur="detail.unreleased.value && detail.blurUnreleased.value"
            stacked
          />

          <EventTimelineSection :event="event" :status="status" :now-ms="now" />
        </div>

        <div class="flex min-w-0 flex-col gap-4 lg:row-span-2">
          <EventBonusSection
            :groups="detail.bonusGroups.value"
            :character-map="detail.characterMap.value"
            :rarity-table="detail.rarityBonusTable.value"
            :table-loading="detail.extras.loading.value"
          />

          <EventCardsSection
            :cards="detail.cards.value"
            :region="region"
            :asset-endpoint="assetEndpoint"
            :character-map="detail.characterMap.value"
            :now-ms="now"
            :loading="detail.cardsSection.loading.value"
            :error="detail.cardsSection.error.value"
            :retrying="detail.cardsSection.retrying.value"
            :blur-unreleased="detail.blurUnreleased.value"
            @retry="detail.cardsSection.reload"
          />

          <EventMusicsSection
            :musics="detail.musics.value"
            :region="region"
            :asset-endpoint="assetEndpoint"
            :loading="detail.musicsSection.loading.value"
            :error="detail.musicsSection.error.value"
            :retrying="detail.musicsSection.retrying.value"
            @retry="detail.musicsSection.reload"
          />

          <EventChaptersSection
            v-if="isWorldBloom && detail.chapters.value.length > 0"
            :chapters="detail.chapters.value"
            :character-map="detail.characterMap.value"
            :now-ms="now"
          />

          <EventTeamsSection
            v-if="isCheerfulCarnival && detail.teams.value.length > 0"
            :teams="detail.teams.value"
            :event-assetbundle-name="event.assetbundleName"
            :region="region"
            :asset-endpoint="assetEndpoint"
          />
        </div>

        <div class="flex min-w-0 flex-col gap-4 lg:col-start-1">
          <EventRelatedGachasSection
            :result="detail.relatedGachas.value"
            :region="region"
            :asset-endpoint="assetEndpoint"
            :banner-alias-map="bannerAliasMap"
            :now-ms="now"
            :loading="detail.gachasSection.loading.value"
            :error="detail.gachasSection.error.value"
            :retrying="detail.gachasSection.retrying.value"
            @retry="detail.gachasSection.reload"
          />

          <EventRewardsSection
            :ranges="detail.rewardRanges.value"
            :region="region"
            :asset-endpoint="assetEndpoint"
          />

          <EventStorySection v-if="detail.story.value" :story="detail.story.value" />
        </div>
      </div>
    </template>
  </CatalogDetailShell>
</template>
