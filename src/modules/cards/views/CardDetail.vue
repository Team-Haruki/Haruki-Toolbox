<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideBookOpen, LucideUsers } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { isNarrowViewport } from "@/composables/useCatalogViewPreference"
import CatalogDetailShell from "@/shared/components/catalog/CatalogDetailShell.vue"
import { applyCatalogRegionQuery } from "@/shared/sekai/catalog-region"
import { useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import CardCostumesSection from "@/modules/cards/components/CardCostumesSection.vue"
import CardHero from "@/modules/cards/components/CardHero.vue"
import CardPowerSection from "@/modules/cards/components/CardPowerSection.vue"
import CardRelatedEventsSection from "@/modules/cards/components/CardRelatedEventsSection.vue"
import CardRelatedGachasSection from "@/modules/cards/components/CardRelatedGachasSection.vue"
import CardSameCharacterSection from "@/modules/cards/components/CardSameCharacterSection.vue"
import CardSkillSection from "@/modules/cards/components/CardSkillSection.vue"
import { useCardDetail } from "@/modules/cards/composables/useCardDetail"
import { buildStoryPlayerLink, firstPlayableScenario } from "@/modules/story"

const props = defineProps<{
  cardId: string
}>()

const { t } = useI18n()

const cardId = computed(() => {
  const parsed = Number(props.cardId)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
})

// A shared link names its server (`?region=`): apply it before the detail reads the region.
applyCatalogRegionQuery()
const detail = useCardDetail(cardId)
const { hideUnreleased, blurUnreleased } = useUnreleasedContentDisplay()

const card = detail.card
const title = computed(() => (card.value ? card.value.prefix ?? `#${card.value.id}` : null))
const notFound = computed(() => detail.notFound.value || (cardId.value == null && !detail.loading.value))
const blurArt = computed(() => detail.unreleased.value && blurUnreleased.value)
// side stories open in the player once the card is released
const storyPlayable = computed(() => card.value != null && !detail.unreleased.value)
const storyLink = computed(() => {
  const scenarioId = storyPlayable.value ? firstPlayableScenario(detail.episodes.value, null, 0) : null
  return scenarioId ? buildStoryPlayerLink(scenarioId) : null
})

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
    <template #actions>
      <Button v-if="characterRoute" as-child variant="outline" size="sm">
        <RouterLink :to="characterRoute">
          <LucideUsers class="size-4" />
          {{ t("cardCatalog.detail.viewCharacterCards") }}
        </RouterLink>
      </Button>
      <Button v-if="storyLink" as-child variant="outline" size="sm">
        <RouterLink :to="storyLink">
          <LucideBookOpen class="size-4" />
          {{ t("cardCatalog.detail.playStory") }}
        </RouterLink>
      </Button>
    </template>

    <template #skeleton>
      <Skeleton class="h-80 w-full rounded-2xl" />
      <div class="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Skeleton class="h-80 w-full rounded-xl" />
        <Skeleton class="h-80 w-full rounded-xl" />
      </div>
    </template>

    <!-- The header block carries the title, so the shell's own heading is replaced. -->
    <template v-if="card" #heading>
      <CardHero
        :card="card"
        :region="detail.region.value"
        :asset-endpoint="detail.assetEndpoint.value"
        :blur="blurArt"
        :unreleased="detail.unreleased.value"
        :character="detail.character.value"
        :unit="detail.unit.value"
        :support-unit="detail.supportUnit.value"
        :supply-type="detail.supplyType.value"
        :unit-color-map="detail.unitColorMap.value"
        :extras="detail.extras.value"
      >
        <template v-if="detail.relatedEvents.value.length > 0 || detail.relatedGachas.value.length > 0" #footer>
          <div class="grid gap-x-6 gap-y-3 lg:grid-cols-2">
            <CardRelatedEventsSection
              :events="detail.relatedEvents.value"
              :region="detail.region.value"
              :asset-endpoint="detail.assetEndpoint.value"
            />
            <CardRelatedGachasSection
              :gachas="detail.relatedGachas.value"
              :banner-alias-map="detail.gachaBannerAliasMap.value"
              :region="detail.region.value"
              :asset-endpoint="detail.assetEndpoint.value"
            />
          </div>
        </template>
      </CardHero>
    </template>

    <template v-if="card">
      <!-- Two cards under the header: what the card is worth (its side
           stories feed the number, so they live in that list) and its skill. -->
      <div class="grid gap-4 lg:grid-cols-2 lg:items-start">
        <CardPowerSection
          :table="detail.powerTable.value"
          :extras="detail.extras.value"
          :rarity="detail.rarityInfo.value"
          :episodes="detail.episodes.value"
          :master-lessons="detail.masterLessons.value"
          :canvas-bonus="detail.canvasBonus.value"
          :can-train="detail.hasTrainedArt.value"
          :trained-by-default="card.trainedByDefault === true"
          :material-names="detail.materialNames.value"
          :playable="storyPlayable"
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
