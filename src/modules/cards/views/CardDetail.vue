<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LucideArrowLeft,
  LucideCalendarDays,
  LucideExternalLink,
  LucideImageOff,
} from "lucide-vue-next"
import { formatLocalizedDateTime } from "@/lib/date-time"
import type { SekaiUnit } from "@/shared/sekai/catalog"
import { buildCatalogCardThumbnail, cardRarityHasTrainedArt, SEKAI_UNITS } from "@/shared/sekai/catalog"
import { useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import { CARD_FULL_ART_ASPECT_CLASS, resolveCardFullArtUrl } from "@/modules/cards/lib/card-assets"
import {
  excludeUnreleasedCards,
  isCardUnreleased,
  resolveCardSupplyType,
  resolveCardUnit,
} from "@/modules/cards/lib/card-filter"
import { normalizeCardSkill } from "@/modules/cards/lib/card-skill"
import {
  buildCardEventIndex,
  extractCardDetailExtras,
  resolveCardEventSummaries,
  selectSameCharacterCards,
} from "@/modules/cards/lib/card-detail"
import { useCardCatalog } from "@/modules/cards/composables/useCardCatalog"
import CardThumbnail from "@/shared/components/SekaiCardThumbnail.vue"

const props = defineProps<{
  cardId: string
}>()

const { t } = useI18n()
const router = useRouter()

const {
  loading,
  error,
  region,
  assetEndpoint,
  cards,
  characterMap,
  unitColorMap,
  supplyTypeMap,
  rawCards,
  rawSkills,
  rawEvents,
  rawEventCards,
  reload,
} = useCardCatalog()

const cardIdNumber = computed(() => Number(props.cardId))

const card = computed(() => cards.value.find((candidate) => candidate.id === cardIdNumber.value) ?? null)

const notFound = computed(() => !loading.value && !error.value && cards.value.length > 0 && card.value == null)

const hasTrainedArt = computed(() => card.value != null && cardRarityHasTrainedArt(card.value.cardRarityType))

const artTab = ref<"normal" | "trained">("normal")
const artFailed = ref(false)

watch([cardIdNumber, hasTrainedArt], () => {
  artTab.value = "normal"
})

const artUrl = computed(() => {
  if (!card.value) {
    return null
  }

  return resolveCardFullArtUrl(
    region.value,
    card.value.assetbundleName,
    artTab.value === "trained" && hasTrainedArt.value,
    assetEndpoint.value,
  )
})

watch(artUrl, () => {
  artFailed.value = false
})

const thumbnail = computed(() => (card.value
  ? buildCatalogCardThumbnail(card.value, region.value, assetEndpoint.value)
  : null))

const character = computed(() => (card.value?.characterId != null
  ? characterMap.value.get(card.value.characterId) ?? null
  : null))

const unit = computed(() => (card.value ? resolveCardUnit(card.value, characterMap.value) : null))

const supportUnit = computed<SekaiUnit | null>(() => {
  const value = card.value?.supportUnit
  if (!value || value === "none" || !(SEKAI_UNITS as readonly string[]).includes(value)) {
    return null
  }

  return value as SekaiUnit
})

const supplyType = computed(() => (card.value
  ? resolveCardSupplyType(card.value, supplyTypeMap.value)
  : null))

const { hideUnreleased, blurUnreleased } = useUnreleasedContentDisplay()

const unreleased = computed(() => card.value != null && isCardUnreleased(card.value.releaseAt))

const blurArt = computed(() => unreleased.value && blurUnreleased.value)

const extras = computed(() => extractCardDetailExtras(rawCards.value, cardIdNumber.value))

const skill = computed(() => (card.value ? normalizeCardSkill(rawSkills.value, card.value.skillId) : null))

const relatedEvents = computed(() => {
  if (!card.value) {
    return []
  }

  const eventIds = buildCardEventIndex(rawEventCards.value).get(card.value.id) ?? []
  return resolveCardEventSummaries(rawEvents.value, eventIds)
})

const sameCharacterCards = computed(() => {
  if (!card.value) {
    return []
  }

  const now = Date.now()
  return excludeUnreleasedCards(selectSameCharacterCards(cards.value, card.value), hideUnreleased.value, now)
    .map((other) => ({
      card: other,
      thumbnail: buildCatalogCardThumbnail(other, region.value, assetEndpoint.value),
      unreleased: isCardUnreleased(other.releaseAt, now),
    }))
})

const rareIndexes = computed(() => Array.from(
  { length: thumbnail.value?.rareCount ?? 0 },
  (_, index) => index,
))

function unitDotStyle(unitValue: SekaiUnit) {
  const color = unitColorMap.value.get(unitValue)
  return color ? { backgroundColor: color } : undefined
}

function goBack() {
  router.push({ name: "cards.list" })
}
</script>

<template>
  <div class="w-full max-w-5xl mx-auto flex flex-col gap-4">
    <div>
      <Button variant="ghost" size="sm" class="gap-1 -ml-2" @click="goBack">
        <LucideArrowLeft class="size-4" />
        {{ t("cards.detail.back") }}
      </Button>
    </div>

    <!-- Error -->
    <Card v-if="error && !loading">
      <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
        <p class="text-sm text-muted-foreground">{{ t("cards.common.loadError") }}</p>
        <p class="max-w-full truncate font-mono text-xs text-muted-foreground">{{ error }}</p>
        <Button variant="outline" size="sm" @click="reload">
          {{ t("cards.common.retry") }}
        </Button>
      </CardContent>
    </Card>

    <!-- Loading -->
    <template v-else-if="loading">
      <Skeleton :class="['w-full rounded-lg', CARD_FULL_ART_ASPECT_CLASS]" />
      <div class="flex flex-col gap-2">
        <Skeleton class="h-6 w-2/3" />
        <Skeleton class="h-4 w-1/3" />
        <Skeleton class="h-24 w-full" />
      </div>
    </template>

    <!-- Not found -->
    <Card v-else-if="notFound">
      <CardContent class="py-12 text-center text-muted-foreground">
        {{ t("cards.detail.notFound", { cardId: props.cardId }) }}
      </CardContent>
    </Card>

    <template v-else-if="card">
      <!-- Title -->
      <div class="flex flex-wrap items-center gap-2">
        <h1 class="text-2xl font-bold">{{ card.prefix ?? `#${card.id}` }}</h1>
        <span
          v-if="unreleased"
          class="rounded bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white"
        >
          {{ t("sekaiUnreleased.badge") }}
        </span>
        <span class="font-mono text-sm text-muted-foreground">#{{ card.id }}</span>
      </div>

      <!-- Full art -->
      <div class="flex flex-col gap-2">
        <Tabs v-if="hasTrainedArt" v-model="artTab">
          <TabsList>
            <TabsTrigger value="normal">{{ t("cards.detail.artNormal") }}</TabsTrigger>
            <TabsTrigger value="trained">{{ t("cards.detail.artTrained") }}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div
          :class="[
            'relative w-full overflow-hidden rounded-lg bg-muted ring-1 ring-border',
            CARD_FULL_ART_ASPECT_CLASS,
          ]"
        >
          <img
            v-if="artUrl && !artFailed"
            :src="artUrl"
            :alt="card.prefix ?? `#${card.id}`"
            :class="['absolute inset-0 h-full w-full object-cover', blurArt ? 'blur-md scale-105' : '']"
            loading="lazy"
            @error="artFailed = true"
          >
          <div
            v-else
            class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground"
          >
            <LucideImageOff class="size-8" />
            <span class="text-sm">{{ t("cards.detail.artLoadFailed") }}</span>
          </div>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <!-- Info panel -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">{{ t("cards.detail.info") }}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl class="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2.5 text-sm">
              <dt class="text-muted-foreground">{{ t("cards.detail.character") }}</dt>
              <dd class="flex items-center gap-2">
                <template v-if="character">
                  <img :src="character.iconUrl" alt="" class="size-6 rounded-full" loading="lazy">
                  <span>{{ character.name }}</span>
                </template>
                <span v-else>—</span>
              </dd>

              <dt class="text-muted-foreground">{{ t("cards.detail.unit") }}</dt>
              <dd class="flex items-center gap-2">
                <template v-if="unit">
                  <span class="size-2.5 rounded-full" :style="unitDotStyle(unit)" />
                  <span>{{ t(`cards.unit.${unit}`) }}</span>
                </template>
                <span v-else>—</span>
              </dd>

              <template v-if="supportUnit">
                <dt class="text-muted-foreground">{{ t("cards.detail.supportUnit") }}</dt>
                <dd class="flex items-center gap-2">
                  <span class="size-2.5 rounded-full" :style="unitDotStyle(supportUnit)" />
                  <span>{{ t(`cards.unit.${supportUnit}`) }}</span>
                </dd>
              </template>

              <dt class="text-muted-foreground">{{ t("cards.detail.attr") }}</dt>
              <dd class="flex items-center gap-2">
                <img
                  v-if="thumbnail?.attrIconUrl"
                  :src="thumbnail.attrIconUrl"
                  alt=""
                  class="size-5"
                  loading="lazy"
                >
                <span>{{ t(`cards.attr.${card.attr}`) }}</span>
              </dd>

              <dt class="text-muted-foreground">{{ t("cards.detail.rarity") }}</dt>
              <dd class="flex items-center gap-0.5">
                <template v-if="thumbnail?.rareIconUrl && rareIndexes.length > 0">
                  <img
                    v-for="index in rareIndexes"
                    :key="index"
                    :src="thumbnail.rareIconUrl"
                    alt=""
                    class="size-4"
                    loading="lazy"
                  >
                </template>
                <span class="ml-1">{{ t(`cards.rarity.${card.cardRarityType}`) }}</span>
              </dd>

              <dt class="text-muted-foreground">{{ t("cards.detail.supply") }}</dt>
              <dd>{{ supplyType ? t(`cards.supply.${supplyType}`) : "—" }}</dd>

              <dt class="text-muted-foreground">{{ t("cards.detail.releaseAt") }}</dt>
              <dd class="flex items-center gap-1.5">
                <LucideCalendarDays class="size-4 text-muted-foreground" />
                {{ formatLocalizedDateTime(card.releaseAt) }}
              </dd>

              <template v-if="extras.gachaPhrase">
                <dt class="text-muted-foreground">{{ t("cards.detail.gachaPhrase") }}</dt>
                <dd class="italic">{{ extras.gachaPhrase }}</dd>
              </template>
            </dl>
          </CardContent>
        </Card>

        <!-- Skill -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">{{ t("cards.detail.skill") }}</CardTitle>
          </CardHeader>
          <CardContent class="flex flex-col gap-3">
            <template v-if="skill">
              <p v-if="extras.cardSkillName" class="text-sm font-semibold">{{ extras.cardSkillName }}</p>
              <p class="text-sm text-muted-foreground">{{ skill.formattedDescription }}</p>
              <div v-if="skill.effectRows.length > 0" class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead>
                    <tr class="border-b text-muted-foreground">
                      <th class="py-1.5 pr-3 font-medium">{{ t("cards.detail.skillLevel") }}</th>
                      <th class="py-1.5 pr-3 font-medium">{{ t("cards.detail.skillValue") }}</th>
                      <th class="py-1.5 font-medium">{{ t("cards.detail.skillDuration") }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in skill.effectRows" :key="row.level" class="border-b last:border-b-0">
                      <td class="py-1.5 pr-3 tabular-nums">{{ row.level }}</td>
                      <td class="py-1.5 pr-3 tabular-nums">{{ row.value ?? "—" }}</td>
                      <td class="py-1.5 tabular-nums">{{ row.duration != null ? `${row.duration}s` : "—" }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
            <p v-else class="text-sm text-muted-foreground">{{ t("cards.detail.noSkill") }}</p>

            <template v-if="relatedEvents.length > 0">
              <p class="mt-1 text-sm font-semibold">{{ t("cards.detail.relatedEvents") }}</p>
              <ul class="flex flex-col gap-1">
                <li v-for="event in relatedEvents" :key="event.id">
                  <RouterLink
                    :to="`/events/${event.id}`"
                    class="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {{ event.name }}
                    <LucideExternalLink class="size-3.5" />
                  </RouterLink>
                </li>
              </ul>
            </template>
          </CardContent>
        </Card>
      </div>

      <!-- Same character cards -->
      <Card v-if="sameCharacterCards.length > 0">
        <CardHeader>
          <CardTitle class="text-base">{{ t("cards.detail.sameCharacter") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex gap-3 overflow-x-auto pb-2">
            <RouterLink
              v-for="view in sameCharacterCards"
              :key="view.card.id"
              :to="{ name: 'cards.detail', params: { cardId: view.card.id } }"
              class="flex w-24 shrink-0 flex-col gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div :class="['relative', view.unreleased && blurUnreleased ? 'overflow-hidden rounded-md' : '']">
                <CardThumbnail
                  :thumbnail="view.thumbnail"
                  size="fluid"
                  :unreleased="view.unreleased && !blurUnreleased"
                  :title="view.card.prefix"
                  :class="view.unreleased && blurUnreleased ? 'blur-md scale-105' : ''"
                />
                <span
                  v-if="view.unreleased && blurUnreleased"
                  class="absolute right-1 top-1 rounded bg-background/80 px-1 py-0.5 text-[10px] font-semibold"
                >
                  {{ t("sekaiUnreleased.badge") }}
                </span>
              </div>
              <span class="line-clamp-2 text-[11px] leading-tight">{{ view.card.prefix ?? `#${view.card.id}` }}</span>
            </RouterLink>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
