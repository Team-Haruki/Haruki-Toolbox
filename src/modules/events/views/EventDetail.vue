<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideBookOpen, LucideChartLine, LucideLayoutGrid } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import CatalogDetailShell from "@/shared/components/catalog/CatalogDetailShell.vue"
import { applyCatalogRegionQuery, useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
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
import { useEventDetail } from "@/modules/events/composables/useEventDetail"
import { buildEventDeckRecommendLink, buildEventRankBorderLink } from "@/modules/events/lib/event-links"
import { buildStoryPlayerLink, firstPlayableScenario } from "@/modules/story"

const props = defineProps<{
  eventId: string
}>()

const { t } = useI18n()
const settingsStore = useSettingsStore()
// A shared link names its server (`?region=`): apply it before the region is read.
applyCatalogRegionQuery()
const { region } = useEffectiveCatalogRegion()
const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)

const eventIdNumber = computed(() => {
  const parsed = Number(props.eventId)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
})

const detail = useEventDetail(region, eventIdNumber)
const { event, status, now } = detail

const listRoute = { name: "events.list" } as const


const rankBorderLink = computed(() => (
  event.value && status.value
    ? buildEventRankBorderLink(event.value, region.value, status.value, detail.chapters.value, now.value)
    : null
))

const deckRecommendLink = computed(() => (
  status.value ? buildEventDeckRecommendLink(region.value, status.value, detail.bonusGroups.value) : null
))

// story episodes open in the player once the event has started
const storyPlayable = computed(() => event.value != null && (event.value.startAt == null || event.value.startAt <= now.value))
const storyLink = computed(() => {
  const scenarioId = detail.story.value ? firstPlayableScenario(detail.story.value.episodes, event.value?.startAt, now.value) : null
  return scenarioId ? buildStoryPlayerLink(scenarioId) : null
})

const bannerAliasMap = computed(() => detail.gachasIndex.data.value?.bannerAliasMap ?? null)
const isWorldBloom = computed(() => event.value?.eventType === "world_bloom")
const isCheerfulCarnival = computed(() => event.value?.eventType === "cheerful_carnival")
</script>

<template>
  <CatalogDetailShell
    :title="event?.name ?? null"
    :entity-id="eventIdNumber"
    :list-title="t('events.list.title')"
    :list-route="listRoute"
    :loading="detail.eventsIndex.loading.value"
    :error="detail.eventsIndex.error.value"
    :not-found="detail.notFound.value"
    :not-found-message="t('events.detail.notFound', { eventId: props.eventId })"
    :error-message="t('events.detail.loadFailed')"
    :retrying="detail.eventsIndex.refreshing.value"
    :unreleased="detail.unreleased.value"
    @retry="detail.eventsIndex.reload"
  >
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
      <Button v-if="storyLink" as-child variant="outline" size="sm">
        <RouterLink :to="storyLink">
          <LucideBookOpen class="size-4" />
          {{ t("events.detail.links.story") }}
        </RouterLink>
      </Button>
    </template>

    <template #skeleton>
      <Skeleton class="h-80 w-full rounded-2xl" />
      <div class="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Skeleton class="h-72 w-full rounded-xl" />
        <Skeleton class="h-72 w-full rounded-xl" />
      </div>
    </template>

    <!-- The header block carries the title, so the shell's own heading is replaced. -->
    <template v-if="event" #heading>
      <EventHero
        :event="event"
        :region="region"
        :asset-endpoint="assetEndpoint"
        :status="status"
        :unreleased="detail.unreleased.value"
        :blur="detail.unreleased.value && detail.blurUnreleased.value"
      >
        <EventTimelineSection v-if="status" :event="event" :status="status" :now-ms="now" :region="region" />
        <template
          v-if="detail.gachasSection.error.value || detail.relatedGachas.value.gachas.length > 0"
          #footer
        >
          <EventRelatedGachasSection
            :result="detail.relatedGachas.value"
            :region="region"
            :asset-endpoint="assetEndpoint"
            :banner-alias-map="bannerAliasMap"
            :now-ms="now"
            :error="detail.gachasSection.error.value"
            :retrying="detail.gachasSection.retrying.value"
            @retry="detail.gachasSection.reload"
          />
        </template>
      </EventHero>
    </template>

    <template v-if="event && status">
      <!-- Under the header, two stacks whose heights are the data's: how the
           event scores (bonuses, its chapters or teams) on the left, what it
           brought (cards, songs) on the right. The reference sections that
           open on demand (rewards, story) close the page. -->
      <div class="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div class="flex min-w-0 flex-col gap-4">
          <EventBonusSection
            :groups="detail.bonusGroups.value"
            :character-map="detail.characterMap.value"
            :rarity-table="detail.rarityBonusTable.value"
            :table-loading="detail.extras.loading.value"
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

        <div class="flex min-w-0 flex-col gap-4">
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
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-2 lg:items-start">
        <EventRewardsSection
          :ranges="detail.rewardRanges.value"
          :region="region"
          :asset-endpoint="assetEndpoint"
        />

        <EventStorySection v-if="detail.story.value" :story="detail.story.value" :playable="storyPlayable" />
      </div>
    </template>
  </CatalogDetailShell>
</template>
