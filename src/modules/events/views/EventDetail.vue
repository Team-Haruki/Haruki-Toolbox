<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import {
  LucideArrowLeft,
  LucideCalendarCheck,
  LucideCalendarClock,
  LucideCalendarX,
  LucideChartLine,
  LucideLayoutGrid,
  LucideRefreshCcw,
  LucideTimer,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { buildCatalogCardThumbnail, type CatalogMasterCard } from "@/shared/sekai/catalog"
import { resolveCardAttrIconUrl, resolveCharacterIconUrl } from "@/shared/sekai/data-sources"
import { useSettingsStore } from "@/shared/stores/settings"
import { useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import { useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import EventBannerImage from "../components/EventBannerImage.vue"
import EventCardThumb from "../components/EventCardThumb.vue"
import EventStatusBadge from "../components/EventStatusBadge.vue"
import EventTypeBadge from "../components/EventTypeBadge.vue"
import { useEventDetail } from "../composables/useEventDetail"
import { resolveEventBackgroundUrl } from "../lib/event-assets"
import {
  formatBonusRate,
  resolveBonusCharacterIconId,
  type EventBonusCharacter,
} from "../lib/event-bonus"
import { isEventUnreleased, resolveEventStatus, splitEventCountdown } from "../lib/event-filter"

const props = defineProps<{
  eventId: string
}>()

const { t } = useI18n()
const router = useRouter()
const settingsStore = useSettingsStore()

const { region } = useEffectiveCatalogRegion()
const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)
const eventIdNumber = computed(() => {
  const parsed = Number(props.eventId)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
})

const {
  event,
  bonusGroups,
  chapters,
  eventCards,
  characterMap,
  loading,
  error,
  notFound,
  reload,
} = useEventDetail(region, eventIdNumber)

const nowMs = ref(Date.now())
const nowTimer = setInterval(() => {
  nowMs.value = Date.now()
}, 1000)

onBeforeUnmount(() => {
  clearInterval(nowTimer)
})

const status = computed(() => (event.value ? resolveEventStatus(event.value, nowMs.value) : null))

const { blurUnreleased } = useUnreleasedContentDisplay()
const unreleased = computed(() => event.value != null && isEventUnreleased(event.value, nowMs.value))

const countdown = computed(() => {
  if (!event.value || !status.value) {
    return null
  }

  if (status.value === "upcoming" && event.value.startAt != null) {
    return { labelKey: "events.detail.countdownToStart", parts: splitEventCountdown(event.value.startAt, nowMs.value) }
  }

  if (status.value === "ongoing" && event.value.aggregateAt != null) {
    return { labelKey: "events.detail.countdownToAggregate", parts: splitEventCountdown(event.value.aggregateAt, nowMs.value) }
  }

  return null
})

const backgroundUrl = computed(() =>
  event.value ? resolveEventBackgroundUrl(region.value, event.value.assetbundleName, assetEndpoint.value) : null,
)
const backgroundFailed = ref(false)

const isWorldBloom = computed(() => event.value?.eventType === "world_bloom")

const cardEntries = computed(() =>
  eventCards.value.map((card) => ({
    card,
    thumbnail: buildCatalogCardThumbnail(card, region.value, assetEndpoint.value),
  })),
)

const timelineRows = computed(() => {
  if (!event.value) {
    return []
  }

  return [
    { key: "start", icon: LucideCalendarClock, labelKey: "events.detail.timeline.start", value: event.value.startAt },
    { key: "aggregate", icon: LucideCalendarCheck, labelKey: "events.detail.timeline.aggregate", value: event.value.aggregateAt },
    { key: "closed", icon: LucideCalendarX, labelKey: "events.detail.timeline.closed", value: event.value.closedAt },
  ]
})

function formatEventDateTime(value: number | null) {
  return formatLocalizedDateTime(
    value,
    { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" },
    t("events.common.dateFallback"),
  )
}

function characterName(gameCharacterId: number | null) {
  if (gameCharacterId == null) {
    return null
  }

  return characterMap.value.get(gameCharacterId)?.name ?? `#${gameCharacterId}`
}

function bonusCharacterIconUrl(character: EventBonusCharacter) {
  return resolveCharacterIconUrl(resolveBonusCharacterIconId(character))
}

function cardTitle(card: CatalogMasterCard) {
  const name = characterName(card.characterId)
  return card.prefix ? (name ? `${card.prefix} · ${name}` : card.prefix) : (name ?? `#${card.id}`)
}

function goBack() {
  void router.push({ name: "events.list" })
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
    <div>
      <Button variant="ghost" size="sm" @click="goBack">
        <LucideArrowLeft class="mr-1 h-4 w-4" /> {{ t("events.detail.back") }}
      </Button>
    </div>

    <!-- Loading -->
    <template v-if="loading">
      <Skeleton class="h-48 w-full" />
      <Skeleton class="h-32 w-full" />
      <Skeleton class="h-32 w-full" />
    </template>

    <!-- Error -->
    <Card v-else-if="error">
      <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
        <p class="text-sm text-muted-foreground">{{ t("events.detail.loadFailed") }}</p>
        <Button variant="outline" size="sm" @click="reload">
          <LucideRefreshCcw class="mr-1 h-4 w-4" /> {{ t("events.detail.retry") }}
        </Button>
      </CardContent>
    </Card>

    <!-- Not found -->
    <Card v-else-if="notFound || !event">
      <CardContent class="py-12 text-center text-muted-foreground">
        {{ t("events.detail.notFound") }}
      </CardContent>
    </Card>

    <template v-else>
      <!-- Hero -->
      <Card class="relative overflow-hidden py-0">
        <img
          v-if="backgroundUrl && !backgroundFailed"
          :src="backgroundUrl"
          alt=""
          class="absolute inset-0 h-full w-full object-cover opacity-30 dark:opacity-20"
          :class="unreleased && blurUnreleased ? 'blur-md scale-105' : ''"
          aria-hidden="true"
          @error="backgroundFailed = true"
        >
        <div class="absolute inset-0 bg-gradient-to-r from-background/85 to-background/40" aria-hidden="true" />
        <CardContent class="relative flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-center">
          <div class="relative h-28 w-48 shrink-0 overflow-hidden rounded-md">
            <EventBannerImage
              :region="region"
              :assetbundle-name="event.assetbundleName"
              :alt="event.name"
              :preference="assetEndpoint"
              variant="logo"
              :class="unreleased && blurUnreleased ? 'blur-md scale-105' : ''"
            />
          </div>
          <div class="min-w-0 flex-1 text-center sm:text-left">
            <h1 class="flex flex-wrap items-center justify-center gap-2 text-xl font-bold sm:justify-start sm:text-2xl">
              {{ event.name }}
              <span
                v-if="unreleased"
                class="rounded bg-red-600 px-1.5 py-0.5 text-xs font-semibold leading-none text-white shadow-sm"
              >
                {{ t("sekaiUnreleased.badge") }}
              </span>
            </h1>
            <div class="mt-1 text-xs text-muted-foreground">{{ t("events.common.idLabel", { id: event.id }) }}</div>
            <div class="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <EventTypeBadge :event-type="event.eventType" />
              <EventStatusBadge v-if="status" :status="status" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Timeline -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">{{ t("events.detail.timelineTitle") }}</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col gap-3">
          <div
            v-for="row in timelineRows"
            :key="row.key"
            class="flex items-center justify-between gap-3 text-sm"
          >
            <span class="flex items-center gap-2 text-muted-foreground">
              <component :is="row.icon" class="h-4 w-4" />
              {{ t(row.labelKey) }}
            </span>
            <span class="tabular-nums">{{ formatEventDateTime(row.value) }}</span>
          </div>
          <div
            v-if="countdown?.parts"
            class="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-3 py-2 text-sm"
          >
            <span class="flex items-center gap-2 text-muted-foreground">
              <LucideTimer class="h-4 w-4" />
              {{ t(countdown.labelKey) }}
            </span>
            <span class="font-medium tabular-nums">
              {{ t("events.detail.countdownValue", countdown.parts) }}
            </span>
          </div>
        </CardContent>
      </Card>

      <!-- Bonus -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">{{ t("events.detail.bonusTitle") }}</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col gap-3">
          <p v-if="bonusGroups.length === 0" class="text-sm text-muted-foreground">
            {{ t("events.detail.bonusEmpty") }}
          </p>
          <div
            v-for="(group, index) in bonusGroups"
            :key="index"
            class="flex flex-wrap items-center gap-2 rounded-md border border-border/60 px-3 py-2"
          >
            <img
              v-if="group.cardAttr"
              :src="resolveCardAttrIconUrl(group.cardAttr)"
              :alt="t(`events.attr.${group.cardAttr}`)"
              :title="t(`events.attr.${group.cardAttr}`)"
              class="h-6 w-6"
            >
            <span v-if="group.characters.length === 0" class="text-sm text-muted-foreground">
              {{ t("events.detail.bonusAttrOnly", { attr: group.cardAttr ? t(`events.attr.${group.cardAttr}`) : "" }) }}
            </span>
            <div v-else class="flex min-w-0 flex-1 flex-wrap items-center gap-1">
              <img
                v-for="character in group.characters"
                :key="character.gameCharacterId"
                :src="bonusCharacterIconUrl(character)"
                :alt="characterName(character.gameCharacterId) ?? ''"
                :title="characterName(character.gameCharacterId) ?? undefined"
                class="h-8 w-8 rounded-full ring-1 ring-border"
                loading="lazy"
              >
            </div>
            <span class="ml-auto text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {{ formatBonusRate(group.bonusRate) }}
            </span>
          </div>
        </CardContent>
      </Card>

      <!-- World Link chapters -->
      <Card v-if="isWorldBloom && chapters.length > 0">
        <CardHeader>
          <CardTitle class="text-base">{{ t("events.detail.chaptersTitle") }}</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col gap-3">
          <div
            v-for="chapter in chapters"
            :key="chapter.id"
            class="flex flex-col gap-2 rounded-md border border-border/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="flex min-w-0 items-center gap-3">
              <img
                v-if="chapter.gameCharacterId != null"
                :src="resolveCharacterIconUrl(chapter.gameCharacterId)"
                :alt="characterName(chapter.gameCharacterId) ?? ''"
                class="h-9 w-9 shrink-0 rounded-full ring-1 ring-border"
                loading="lazy"
              >
              <div class="min-w-0">
                <div class="truncate text-sm font-medium">
                  {{ chapter.gameCharacterId != null
                    ? characterName(chapter.gameCharacterId)
                    : t("events.detail.chapterFinale") }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ t("events.detail.chapterLabel", { no: chapter.chapterNo ?? "-" }) }}
                </div>
              </div>
            </div>
            <div class="text-xs tabular-nums text-muted-foreground">
              {{ formatEventDateTime(chapter.chapterStartAt) }} – {{ formatEventDateTime(chapter.aggregateAt ?? chapter.chapterEndAt) }}
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Event cards -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">{{ t("events.detail.cardsTitle") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p v-if="cardEntries.length === 0" class="text-sm text-muted-foreground">
            {{ t("events.detail.cardsEmpty") }}
          </p>
          <div v-else class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            <RouterLink
              v-for="entry in cardEntries"
              :key="entry.card.id"
              :to="`/cards/${entry.card.id}`"
              class="group flex flex-col gap-1 rounded-md focus-visible:outline-2 focus-visible:outline-ring"
            >
              <EventCardThumb :thumbnail="entry.thumbnail" :title="cardTitle(entry.card)" />
              <span class="truncate text-center text-xs text-muted-foreground group-hover:text-foreground">
                {{ cardTitle(entry.card) }}
              </span>
            </RouterLink>
          </div>
        </CardContent>
      </Card>

      <!-- Quick links -->
      <div class="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" class="flex-1" as-child>
          <RouterLink to="/rank-border">
            <LucideChartLine class="mr-1 h-4 w-4" /> {{ t("events.detail.links.rankBorder") }}
          </RouterLink>
        </Button>
        <Button variant="outline" class="flex-1" as-child>
          <RouterLink to="/deck-recommend">
            <LucideLayoutGrid class="mr-1 h-4 w-4" /> {{ t("events.detail.links.deckRecommend") }}
          </RouterLink>
        </Button>
      </div>
    </template>
  </div>
</template>
