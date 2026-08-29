<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LucideArrowLeft,
  LucideArrowUpRight,
  LucideCalendarDays,
  LucideExternalLink,
  LucideImageOff,
} from "lucide-vue-next"
import { formatLocalizedDate, formatLocalizedDateTime } from "@/lib/date-time"
import { goBackOr, hasInAppHistory } from "@/lib/router-back"
import type { SekaiUnit } from "@/shared/sekai/catalog"
import { buildCatalogCardThumbnail, cardRarityHasTrainedArt, SEKAI_UNITS } from "@/shared/sekai/catalog"
import { resolveCardAttrRoundIconUrl, resolveCostumeThumbnailUrl, resolveUnitLogoUrl } from "@/shared/sekai/data-sources"
import { useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import { CARD_FULL_ART_ASPECT_CLASS, resolveCardFullArtUrls } from "@/modules/cards/lib/card-assets"
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
  selectCardPickupGachas,
  selectSameCharacterCards,
  type CardCostumeColor,
  type CardCostumeGroup,
} from "@/modules/cards/lib/card-detail"
import { useCardCatalog } from "@/modules/cards/composables/useCardCatalog"
import { useCardCostumes } from "@/modules/cards/composables/useCardCostumes"
import {
  buildGachaBannerAliasMap,
  buildGachaImageCandidates,
  normalizeCatalogGachas,
} from "@/modules/gachas/lib/gacha-catalog"
import EventBannerImage from "@/modules/events/components/EventBannerImage.vue"
import GachaAssetImage from "@/modules/gachas/components/GachaAssetImage.vue"
import CardThumbnail from "@/shared/components/SekaiCardThumbnail.vue"
import CostumeViewer, { type CostumeViewerRecipe } from "@/modules/costumes/components/CostumeViewer.vue"
import { useCostumeRoleData } from "@/modules/costumes/composables/useCostumeRoleData"

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
  worldBloomCardIds,
  rawCards,
  rawSkills,
  rawEvents,
  rawEventCards,
  rawGachas,
  reload,
} = useCardCatalog()

const cardIdNumber = computed(() => Number(props.cardId))

const costumeCardId = computed(() => (Number.isInteger(cardIdNumber.value) ? cardIdNumber.value : null))

function costumeThumbnailUrl(assetbundleName: string): string {
  return resolveCostumeThumbnailUrl(region.value, assetbundleName, assetEndpoint.value)
}

// Regional asset mirrors miss some costume thumbnails; retry from the jp mirror once.
function handleCostumeThumbnailError(event: Event, assetbundleName: string) {
  const image = event.target as HTMLImageElement | null
  if (!image || region.value === "jp") {
    return
  }

  const fallback = resolveCostumeThumbnailUrl("jp", assetbundleName, assetEndpoint.value)
  if (image.src !== fallback) {
    image.src = fallback
  }
}

const card = computed(() => cards.value.find((candidate) => candidate.id === cardIdNumber.value) ?? null)

const notFound = computed(() => !loading.value && !error.value && cards.value.length > 0 && card.value == null)

const hasTrainedArt = computed(() => card.value != null && cardRarityHasTrainedArt(card.value.cardRarityType))

const artTab = ref<"normal" | "trained">("normal")
const artFailed = ref(false)

watch([cardIdNumber, hasTrainedArt], () => {
  artTab.value = "normal"
})

const artCandidates = computed<string[]>(() => {
  if (!card.value) {
    return []
  }

  return resolveCardFullArtUrls(
    region.value,
    card.value.assetbundleName,
    artTab.value === "trained" && hasTrainedArt.value,
    assetEndpoint.value,
  )
})

const artCandidateIndex = ref(0)
const artUrl = computed(() => artCandidates.value[artCandidateIndex.value] ?? null)

watch(artCandidates, () => {
  artCandidateIndex.value = 0
  artFailed.value = false
})

function handleArtError() {
  if (artCandidateIndex.value < artCandidates.value.length - 1) {
    artCandidateIndex.value += 1
  } else {
    artFailed.value = true
  }
}

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
  ? resolveCardSupplyType(card.value, supplyTypeMap.value, worldBloomCardIds.value)
  : null))

const { groups: costumeGroups, loading: costumesLoading } = useCardCostumes(region, costumeCardId)

// Stock head/hair for the card's character come from the 3D runtime role
// catalog — masterdata default ids are not guaranteed to exist in the runtime.
const costumeCharacterId = computed(() => card.value?.characterId ?? null)
const costumeRoleUnit = computed<string | null>(() => unit.value)
const { data: costumeRoleData } = useCostumeRoleData(
  region,
  assetEndpoint,
  costumeCharacterId,
  costumeRoleUnit,
)

// The costume master ships name/colorName blank on Nuverse regions (cn/tw/kr),
// but the 3D runtime registry carries them — the same source 服装搭配 uses, and
// it keeps ambiguous head accessories that the selectable options drop.
const costumeNameById = computed(
  () => costumeRoleData.value?.nameById ?? new Map<number, { name: string; colorName: string }>(),
)

function costumeGroupName(group: CardCostumeGroup): string {
  if (group.name) {
    return group.name
  }
  for (const color of group.colors) {
    const name = costumeNameById.value.get(color.costume3dId)?.name
    if (name) {
      return name
    }
  }
  // Some Nuverse accessories are absent from both the master (blank name) and
  // the runtime registry (never exported); fall back to a slot label so the
  // group reads meaningfully instead of showing a raw group id.
  const slot = group.colors[0]?.slot
  return slot ? t(`cards.detail.costumeSlot.${slot}`) : `#${group.costume3dGroupId}`
}

function costumeColorLabel(color: CardCostumeColor): string {
  return color.colorName || costumeNameById.value.get(color.costume3dId)?.colorName || ""
}

// 3D preview of an unlocked costume: the clicked body color plus the
// character's stock head/hair completes the engine recipe.
const selectedCostume3dId = ref<number | null>(null)

watch([costumeCardId, region], () => {
  selectedCostume3dId.value = null
})

const selectedCostume = computed(() => {
  if (selectedCostume3dId.value == null) {
    return null
  }

  for (const group of costumeGroups.value) {
    const color = group.colors.find((candidate) => candidate.costume3dId === selectedCostume3dId.value)
    if (color) {
      return color
    }
  }

  return null
})

const costumeViewerRecipe = computed<CostumeViewerRecipe | null>(() => {
  const characterId = card.value?.characterId
  const targetUnit = unit.value
  const roleDefaults = costumeRoleData.value?.defaults
  const selected = selectedCostume.value
  if (selected == null || characterId == null || targetUnit == null || roleDefaults == null) {
    return null
  }

  // Preview every same-color part of the group together; the character's stock
  // parts fill any slot this color does not provide.
  return {
    characterId,
    unit: targetUnit,
    bodyCostume3dId: selected.bodyCostume3dId ?? roleDefaults.bodyCostume3dId,
    headCostume3dId: selected.headCostume3dId ?? roleDefaults.headCostume3dId,
    hairCostume3dId: selected.hairCostume3dId ?? roleDefaults.hairCostume3dId,
  }
})

const dressupLink = computed(() => {
  const characterId = card.value?.characterId
  if (characterId == null) {
    return null
  }

  const selected = selectedCostume.value
  const query: Record<string, string> = { characterId: String(characterId) }
  if (selected != null) {
    if (selected.bodyCostume3dId != null) {
      query.body = String(selected.bodyCostume3dId)
    }
    if (selected.headCostume3dId != null) {
      query.head = String(selected.headCostume3dId)
    }
    if (selected.hairCostume3dId != null) {
      query.hair = String(selected.hairCostume3dId)
    }
  }
  return { name: "costumes.dressup", query }
})

function toggleCostumePreview(costume3dId: number) {
  selectedCostume3dId.value = selectedCostume3dId.value === costume3dId ? null : costume3dId
}

const { hideUnreleased, blurUnreleased } = useUnreleasedContentDisplay()

const unreleased = computed(() => card.value != null && isCardUnreleased(card.value.releaseAt))

const blurArt = computed(() => unreleased.value && blurUnreleased.value)

const extras = computed(() => extractCardDetailExtras(rawCards.value, cardIdNumber.value))

const skill = computed(() => (card.value
  ? normalizeCardSkill(rawSkills.value, card.value.skillId, { characterName: character.value?.name })
  : null))

// Bloom Fes dual skills: the special-training variant renders as a second
// block next to the base skill.
const trainedSkill = computed(() => (extras.value.specialTrainingSkillId != null
  ? normalizeCardSkill(rawSkills.value, extras.value.specialTrainingSkillId, { characterName: character.value?.name })
  : null))

const skillBlocks = computed(() => {
  const blocks: { key: string; labelKey: string | null; name: string | null; view: NonNullable<typeof skill.value> }[] = []
  if (skill.value) {
    blocks.push({
      key: "base",
      labelKey: trainedSkill.value ? "cards.detail.skillBeforeTraining" : null,
      name: extras.value.cardSkillName,
      view: skill.value,
    })
  }
  if (trainedSkill.value) {
    blocks.push({
      key: "trained",
      labelKey: "cards.detail.skillAfterTraining",
      name: extras.value.specialTrainingSkillName,
      view: trainedSkill.value,
    })
  }
  return blocks
})

const relatedEvents = computed(() => {
  if (!card.value) {
    return []
  }

  const eventIds = buildCardEventIndex(rawEventCards.value).get(card.value.id) ?? []
  return resolveCardEventSummaries(rawEvents.value, eventIds)
})

const allGachas = computed(() => normalizeCatalogGachas(rawGachas.value))
const gachaBannerAliases = computed(() => buildGachaBannerAliasMap(allGachas.value))

const relatedGachas = computed(() => {
  if (!card.value) {
    return []
  }

  return selectCardPickupGachas(allGachas.value, card.value.id).map((gacha) => ({
    gacha,
    imageSources: buildGachaImageCandidates(
      gacha,
      region.value,
      assetEndpoint.value,
      gachaBannerAliases.value.get(gacha.id),
    ),
  }))
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

const failedUnitLogos = ref<Set<SekaiUnit>>(new Set())

function markUnitLogoFailed(unitValue: SekaiUnit) {
  failedUnitLogos.value = new Set(failedUnitLogos.value).add(unitValue)
}

function formatPeriod(startAt: number | null, endAt: number | null): string {
  return `${formatLocalizedDate(startAt, { dateStyle: "medium" }, "?")} - ${formatLocalizedDate(endAt, { dateStyle: "medium" }, "?")}`
}

function goBack() {
  goBackOr(router, { name: "cards.list" })
}

const route = useRoute()

/** Track the route so in-component navigation re-checks the history state. */
const canGoBack = computed(() => {
  return route.fullPath.length > 0 && hasInAppHistory()
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-4">
    <div>
      <Button variant="ghost" size="sm" class="gap-1 -ml-2" @click="goBack">
        <LucideArrowLeft class="size-4" />
        {{ canGoBack ? t("common.back") : t("cards.detail.back") }}
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
            decoding="async"
            v-if="artUrl && !artFailed"
            :src="artUrl"
            :alt="card.prefix ?? `#${card.id}`"
            :class="['absolute inset-0 h-full w-full object-cover', blurArt ? 'blur-md scale-105' : '']"
            loading="lazy"
            @error="handleArtError"
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
                  <img :src="character.iconUrl" alt="" class="size-6 rounded-full" loading="lazy" decoding="async">
                  <span>{{ character.name }}</span>
                </template>
                <span v-else>—</span>
              </dd>

              <dt class="text-muted-foreground">{{ t("cards.detail.unit") }}</dt>
              <dd class="flex items-center gap-2">
                <template v-if="unit">
                  <img
                    decoding="async"
                    v-if="!failedUnitLogos.has(unit)"
                    :src="resolveUnitLogoUrl(unit)"
                    alt=""
                    class="h-5 w-auto max-w-10 object-contain"
                    loading="lazy"
                    @error="markUnitLogoFailed(unit)"
                  >
                  <span v-else class="size-2.5 rounded-full" :style="unitDotStyle(unit)" />
                  <span>{{ t(`cards.unit.${unit}`) }}</span>
                </template>
                <span v-else>—</span>
              </dd>

              <template v-if="supportUnit">
                <dt class="text-muted-foreground">{{ t("cards.detail.supportUnit") }}</dt>
                <dd class="flex items-center gap-2">
                  <img
                    decoding="async"
                    v-if="!failedUnitLogos.has(supportUnit)"
                    :src="resolveUnitLogoUrl(supportUnit)"
                    alt=""
                    class="h-5 w-auto max-w-10 object-contain"
                    loading="lazy"
                    @error="markUnitLogoFailed(supportUnit)"
                  >
                  <span v-else class="size-2.5 rounded-full" :style="unitDotStyle(supportUnit)" />
                  <span>{{ t(`cards.unit.${supportUnit}`) }}</span>
                </dd>
              </template>

              <dt class="text-muted-foreground">{{ t("cards.detail.attr") }}</dt>
              <dd class="flex items-center gap-2">
                <img
                  decoding="async"
                  v-if="card.attr"
                  :src="resolveCardAttrRoundIconUrl(card.attr)"
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
                    decoding="async"
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
          <CardContent class="flex flex-col gap-5">
            <template v-if="skillBlocks.length > 0">
              <div
                v-for="block in skillBlocks"
                :key="block.key"
                class="flex flex-col gap-3"
                :class="block.key === 'trained' ? 'border-t pt-4' : ''"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    v-if="block.labelKey"
                    class="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
                  >
                    {{ t(block.labelKey) }}
                  </span>
                  <p v-if="block.name" class="text-sm font-semibold">{{ block.name }}</p>
                </div>
                <p class="text-sm text-muted-foreground">{{ block.view.formattedDescription }}</p>
                <div v-if="block.view.effectRows.length > 0" class="overflow-x-auto">
                  <table class="w-full text-left text-xs">
                    <thead>
                      <tr class="border-b text-muted-foreground">
                        <th class="py-1.5 pr-3 font-medium">{{ t("cards.detail.skillLevel") }}</th>
                        <th class="py-1.5 pr-3 font-medium">{{ t("cards.detail.skillValue") }}</th>
                        <th class="py-1.5 font-medium">{{ t("cards.detail.skillDuration") }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in block.view.effectRows" :key="row.level" class="border-b last:border-b-0">
                        <td class="py-1.5 pr-3 tabular-nums">{{ row.level }}</td>
                        <td class="py-1.5 pr-3 tabular-nums">{{ row.value ?? "—" }}</td>
                        <td class="py-1.5 tabular-nums">{{ row.duration != null ? `${row.duration}s` : "—" }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>
            <p v-else class="text-sm text-muted-foreground">{{ t("cards.detail.noSkill") }}</p>
          </CardContent>
        </Card>
      </div>

      <!-- Related events / gachas -->
      <div v-if="relatedEvents.length > 0 || relatedGachas.length > 0" class="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle class="text-base">{{ t("cards.detail.relatedEvents") }}</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <template v-if="relatedEvents.length > 0">
              <RouterLink
                v-for="event in relatedEvents"
                :key="event.id"
                :to="`/events/${event.id}`"
                class="flex flex-wrap items-center gap-3 rounded-md border bg-muted/20 p-3 transition-colors hover:bg-accent/50 dark:hover:bg-accent/30"
              >
                <div class="relative aspect-[2/1] w-full shrink-0 overflow-hidden rounded-md bg-muted sm:w-36">
                  <EventBannerImage
                    :region="region"
                    :assetbundle-name="event.assetbundleName"
                    :alt="event.name"
                    :preference="assetEndpoint"
                  />
                </div>
                <div class="min-w-0 flex-1 space-y-1">
                  <p class="truncate text-sm font-medium">{{ event.name }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ formatPeriod(event.startAt, event.aggregateAt) }}
                  </p>
                </div>
                <LucideExternalLink class="size-4 shrink-0 text-muted-foreground" />
              </RouterLink>
            </template>
            <p v-else class="text-sm text-muted-foreground">{{ t("cards.detail.relatedEventsEmpty") }}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-base">{{ t("cards.detail.relatedGachas") }}</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <template v-if="relatedGachas.length > 0">
              <RouterLink
                v-for="view in relatedGachas"
                :key="view.gacha.id"
                :to="`/gachas/${view.gacha.id}`"
                class="flex flex-wrap items-center gap-3 rounded-md border bg-muted/20 p-3 transition-colors hover:bg-accent/50 dark:hover:bg-accent/30"
              >
                <div class="relative aspect-[2/1] w-full shrink-0 overflow-hidden rounded-md bg-muted sm:w-36">
                  <GachaAssetImage
                    :sources="view.imageSources"
                    :alt="view.gacha.name"
                  />
                </div>
                <div class="min-w-0 flex-1 space-y-1">
                  <p class="truncate text-sm font-medium">{{ view.gacha.name }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ formatPeriod(view.gacha.startAt, view.gacha.endAt) }}
                  </p>
                </div>
                <LucideExternalLink class="size-4 shrink-0 text-muted-foreground" />
              </RouterLink>
            </template>
            <p v-else class="text-sm text-muted-foreground">{{ t("cards.detail.relatedGachasEmpty") }}</p>
          </CardContent>
        </Card>
      </div>

      <!-- Costumes -->
      <Card v-if="costumesLoading || costumeGroups.length > 0">
        <CardHeader>
          <CardTitle class="flex flex-wrap items-center justify-between gap-2 text-base">
            <span>{{ t("cards.detail.costumes") }}</span>
            <Button
              v-if="dressupLink"
              as-child
              variant="ghost"
              size="sm"
              class="h-7 gap-1 text-xs font-normal text-muted-foreground"
            >
              <RouterLink :to="dressupLink">
                {{ t("cards.detail.costumeDressup") }}
                <LucideArrowUpRight class="size-3.5" />
              </RouterLink>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div v-if="costumesLoading && costumeGroups.length === 0" class="flex gap-3">
            <Skeleton v-for="index in 4" :key="index" class="size-20 rounded-md" />
          </div>
          <p v-else class="text-xs text-muted-foreground">{{ t("cards.detail.costumePreviewHint") }}</p>
          <div
            v-for="group in costumeGroups"
            :key="group.costume3dGroupId"
            class="space-y-2"
          >
            <p class="text-sm font-medium">{{ costumeGroupName(group) }}</p>
            <div class="flex flex-wrap gap-3">
              <figure
                v-for="color in group.colors"
                :key="color.costume3dId"
                class="w-20 space-y-1"
              >
                <button
                  type="button"
                  :class="[
                    'block aspect-square w-full overflow-hidden rounded-md border bg-muted/20 transition-shadow',
                    selectedCostume3dId === color.costume3dId
                      ? 'ring-2 ring-primary'
                      : 'hover:ring-1 hover:ring-border',
                  ]"
                  :aria-pressed="selectedCostume3dId === color.costume3dId"
                  :title="t('cards.detail.costumePreviewHint')"
                  @click="toggleCostumePreview(color.costume3dId)"
                >
                  <img
                    decoding="async"
                    :src="costumeThumbnailUrl(color.assetbundleName)"
                    :alt="costumeColorLabel(color) || costumeGroupName(group)"
                    class="size-full object-contain"
                    loading="lazy"
                    @error="handleCostumeThumbnailError($event, color.assetbundleName)"
                  >
                </button>
                <figcaption
                  v-if="costumeColorLabel(color)"
                  class="truncate text-center text-[11px] text-muted-foreground"
                  :title="costumeColorLabel(color)"
                >
                  {{ costumeColorLabel(color) }}
                </figcaption>
              </figure>
            </div>
          </div>
          <div v-if="costumeViewerRecipe" class="mx-auto w-full max-w-xl">
            <CostumeViewer
              :region="region"
              :preference="assetEndpoint"
              :recipe="costumeViewerRecipe"
            />
          </div>
        </CardContent>
      </Card>

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
