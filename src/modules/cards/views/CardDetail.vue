<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideUsers } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { isNarrowViewport } from "@/composables/useCatalogViewPreference"
import CatalogDetailShell from "@/shared/components/catalog/CatalogDetailShell.vue"
import SekaiAttrIcon from "@/shared/components/SekaiAttrIcon.vue"
import SekaiRarityStars from "@/shared/components/SekaiRarityStars.vue"
import { resolveSekaiSupplyLabel } from "@/shared/sekai/labels"
import { useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import CardCostumesSection from "@/modules/cards/components/CardCostumesSection.vue"
import CardEpisodesSection from "@/modules/cards/components/CardEpisodesSection.vue"
import CardHero from "@/modules/cards/components/CardHero.vue"
import CardInfoSection from "@/modules/cards/components/CardInfoSection.vue"
import CardPowerSection from "@/modules/cards/components/CardPowerSection.vue"
import CardRelatedEventsSection from "@/modules/cards/components/CardRelatedEventsSection.vue"
import CardRelatedGachasSection from "@/modules/cards/components/CardRelatedGachasSection.vue"
import CardSameCharacterSection from "@/modules/cards/components/CardSameCharacterSection.vue"
import CardSkillSection from "@/modules/cards/components/CardSkillSection.vue"
import { useCardDetail } from "@/modules/cards/composables/useCardDetail"
import { CARD_FULL_ART_ASPECT_CLASS } from "@/modules/cards/lib/card-assets"
import { resolveCardSupplyBadgeVariant } from "@/modules/cards/lib/card-display"

const props = defineProps<{
  cardId: string
}>()

const { t, te } = useI18n()

const cardId = computed(() => {
  const parsed = Number(props.cardId)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
})

const detail = useCardDetail(cardId)
const { hideUnreleased, blurUnreleased } = useUnreleasedContentDisplay()

const card = detail.card
const title = computed(() => (card.value ? card.value.prefix ?? `#${card.value.id}` : null))
const notFound = computed(() => detail.notFound.value || (cardId.value == null && !detail.loading.value))
const blurArt = computed(() => detail.unreleased.value && blurUnreleased.value)
const supplyLabel = computed(() => resolveSekaiSupplyLabel({ t, te }, detail.supplyType.value))
const supplyVariant = computed(() => resolveCardSupplyBadgeVariant(detail.supplyType.value) ?? "muted")
const characterRoute = computed(() => (detail.character.value
  ? { name: "cards.list", query: { chars: String(detail.character.value.id) } }
  : null))
const sameCharacterEntries = computed(() => (hideUnreleased.value
  ? detail.sameCharacterCards.value.filter((entry) => !entry.unreleased)
  : detail.sameCharacterCards.value))

/** Secondary sections start collapsed on phones so the hero and info stay first. */
const sectionsOpen = !isNarrowViewport()
</script>

<template>
  <CatalogDetailShell
    :title="title"
    :subtitle="detail.character.value?.name ?? null"
    :entity-id="card?.id ?? cardId"
    :list-title="t('cards.list.title')"
    :list-route="{ name: 'cards.list' }"
    :loading="detail.loading.value"
    :error="detail.error.value"
    :not-found="notFound"
    :not-found-message="t('cards.detail.notFound', { cardId: props.cardId })"
    :error-message="t('cards.common.loadError')"
    :retrying="detail.refreshing.value"
    :unreleased="detail.unreleased.value"
    @retry="detail.reload"
  >
    <template #badges>
      <template v-if="card">
        <SekaiRarityStars :card-rarity-type="card.cardRarityType" :trained="card.trainedByDefault" size="sm" />
        <SekaiAttrIcon v-if="card.attr" :attr="card.attr" size="sm" show-label class="text-sm" />
        <Badge v-if="detail.supplyType.value" :variant="supplyVariant" size="sm">{{ supplyLabel }}</Badge>
      </template>
    </template>

    <template #actions>
      <Button v-if="characterRoute" as-child variant="outline" size="sm">
        <RouterLink :to="characterRoute">
          <LucideUsers class="size-4" />
          {{ t("cardCatalog.detail.viewCharacterCards") }}
        </RouterLink>
      </Button>
    </template>

    <template #skeleton>
      <Skeleton :class="['w-full rounded-lg', CARD_FULL_ART_ASPECT_CLASS]" />
      <div class="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div class="flex flex-col gap-4">
          <Skeleton class="h-64 w-full rounded-xl" />
          <Skeleton class="h-40 w-full rounded-xl" />
        </div>
        <div class="flex flex-col gap-4">
          <Skeleton class="h-80 w-full rounded-xl" />
          <Skeleton class="h-72 w-full rounded-xl" />
        </div>
      </div>
    </template>

    <template v-if="card">
      <CardHero
        :card="card"
        :region="detail.region.value"
        :asset-endpoint="detail.assetEndpoint.value"
        :blur="blurArt"
      />

      <!-- Two independent stacks, not three rows of pairs. Every section's
           height is decided by its data (an episode list, N events, N gachas,
           a skill table), so row-pairing always left one side of each row
           short. Each column flows on its own; only the column totals differ,
           and those are close: facts + episodes + related on the left, the
           two calculators on the right. -->
      <div class="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div class="flex min-w-0 flex-col gap-4">
          <CardInfoSection
            :card="card"
            :character="detail.character.value"
            :unit="detail.unit.value"
            :support-unit="detail.supportUnit.value"
            :supply-type="detail.supplyType.value"
            :unit-color-map="detail.unitColorMap.value"
            :extras="detail.extras.value"
          />
          <CardEpisodesSection
            :episodes="detail.episodes.value"
            :loading="detail.detailExtrasLoading.value"
            :default-open="sectionsOpen"
          />
          <CardRelatedEventsSection
            :events="detail.relatedEvents.value"
            :region="detail.region.value"
            :asset-endpoint="detail.assetEndpoint.value"
            :loading="detail.eventsLoading.value"
          />
          <CardRelatedGachasSection
            :gachas="detail.relatedGachas.value"
            :banner-alias-map="detail.gachaBannerAliasMap.value"
            :region="detail.region.value"
            :asset-endpoint="detail.assetEndpoint.value"
            :loading="detail.gachasLoading.value"
          />
        </div>

        <div class="flex min-w-0 flex-col gap-4">
          <CardPowerSection
            :table="detail.powerTable.value"
            :extras="detail.extras.value"
            :rarity="detail.rarityInfo.value"
            :episodes="detail.episodes.value"
            :master-lessons="detail.masterLessons.value"
            :canvas-bonus="detail.canvasBonus.value"
            :can-train="detail.hasTrainedArt.value"
            :trained-by-default="card.trainedByDefault === true"
            :loading="detail.detailExtrasLoading.value"
          />
          <CardSkillSection
            :skill="detail.skill.value"
            :trained-skill="detail.trainedSkill.value"
            :skill-name="card.skillName ?? null"
            :trained-skill-name="detail.extras.value?.specialTrainingSkillName ?? null"
            :character-name="detail.character.value?.name ?? null"
            :loading="detail.skillsLoading.value"
          />
        </div>
      </div>

      <CardCostumesSection
        :region="detail.region.value"
        :asset-endpoint="detail.assetEndpoint.value"
        :card-id="card.id"
        :character-id="card.characterId"
        :unit="detail.unit.value"
      />

      <CardSameCharacterSection
        :entries="sameCharacterEntries"
        :character-id="card.characterId"
        :total="detail.characterCardCount.value"
        :blur-unreleased="blurUnreleased"
        :default-open="sectionsOpen"
      />
    </template>
  </CatalogDetailShell>
</template>
