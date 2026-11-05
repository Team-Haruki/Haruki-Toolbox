<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideArrowUpRight, LucideCalendarDays, LucideInfo } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { Badge } from "@/components/ui/badge"
import CatalogAssetName from "@/shared/components/catalog/CatalogAssetName.vue"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import CatalogInfoList from "@/shared/components/catalog/CatalogInfoList.vue"
import CatalogInfoRow from "@/shared/components/catalog/CatalogInfoRow.vue"
import CatalogTimeZoneHint from "@/shared/components/catalog/CatalogTimeZoneHint.vue"
import CatalogZonedTime from "@/shared/components/catalog/CatalogZonedTime.vue"
import SekaiAttrIcon from "@/shared/components/SekaiAttrIcon.vue"
import SekaiCharacterAvatar from "@/shared/components/SekaiCharacterAvatar.vue"
import SekaiRarityStars from "@/shared/components/SekaiRarityStars.vue"
import SekaiUnitLogo from "@/shared/components/SekaiUnitLogo.vue"
import type { CatalogCharacter, CatalogMasterCard, SekaiUnit } from "@/shared/sekai/catalog"
import { resolveSekaiRarityLabel, resolveSekaiSupplyLabel } from "@/shared/sekai/labels"
import type { CardIndexExtras } from "@/modules/cards/composables/useCardsIndex"
import { resolveCardSupplyBadgeVariant } from "@/modules/cards/lib/card-display"

const props = defineProps<{
  card: CatalogMasterCard
  /** The server the card belongs to; its zone is shown next to the release time. */
  region: SekaiRegion
  character: CatalogCharacter | null
  unit: SekaiUnit | null
  supportUnit: SekaiUnit | null
  supplyType: string | null
  unitColorMap: ReadonlyMap<SekaiUnit, string>
  extras: CardIndexExtras | null
}>()

const { t, te } = useI18n()
const labels = { t, te }

const rarityLabel = computed(() => resolveSekaiRarityLabel(labels, props.card.cardRarityType))
const supplyLabel = computed(() => resolveSekaiSupplyLabel(labels, props.supplyType))
const supplyVariant = computed(() => resolveCardSupplyBadgeVariant(props.supplyType) ?? "muted")
const characterRoute = computed(() => (props.character
  ? { name: "cards.list", query: { chars: String(props.character.id) } }
  : null))
</script>

<template>
  <CatalogDetailSection :title="t('cardCatalog.detail.info.title')" :icon="LucideInfo">
    <template #action>
      <CatalogTimeZoneHint :region="region" />
    </template>
    <CatalogInfoList>
      <CatalogInfoRow :label="t('cardCatalog.detail.info.character')">
        <RouterLink
          v-if="character && characterRoute"
          :to="characterRoute"
          class="inline-flex min-w-0 items-center gap-2 rounded-md transition-colors hover:text-primary pointer-coarse:min-h-10"
          :title="t('cardCatalog.detail.viewCharacterCards')"
        >
          <SekaiCharacterAvatar :character-id="character.id" :name="character.name" size="sm" />
          <span class="truncate">{{ character.name }}</span>
          <LucideArrowUpRight class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </RouterLink>
      </CatalogInfoRow>

      <CatalogInfoRow :label="t('cardCatalog.detail.info.unit')">
        <SekaiUnitLogo v-if="unit" :unit="unit" size="md" show-label :color="unitColorMap.get(unit) ?? null" />
      </CatalogInfoRow>

      <CatalogInfoRow v-if="supportUnit" :label="t('cardCatalog.detail.info.supportUnit')">
        <SekaiUnitLogo :unit="supportUnit" size="md" show-label :color="unitColorMap.get(supportUnit) ?? null" />
      </CatalogInfoRow>

      <CatalogInfoRow :label="t('cardCatalog.detail.info.attr')">
        <SekaiAttrIcon v-if="card.attr" :attr="card.attr" size="md" show-label />
      </CatalogInfoRow>

      <CatalogInfoRow :label="t('cardCatalog.detail.info.rarity')">
        <SekaiRarityStars :card-rarity-type="card.cardRarityType" :trained="card.trainedByDefault" size="sm" />
        <span>{{ rarityLabel }}</span>
      </CatalogInfoRow>

      <CatalogInfoRow :label="t('cardCatalog.detail.info.supply')">
        <Badge v-if="supplyType" :variant="supplyVariant">{{ supplyLabel }}</Badge>
      </CatalogInfoRow>

      <!-- Local time with the server time one hover (or one line) away, like
           the event timeline: a JST midnight release is not "yesterday 23:00". -->
      <CatalogInfoRow :label="t('cardCatalog.detail.info.releaseAt')" :icon="LucideCalendarDays">
        <CatalogZonedTime v-if="card.releaseAt != null" :value="card.releaseAt" :region="region" options="dateTime" />
      </CatalogInfoRow>

      <CatalogInfoRow v-if="extras?.gachaPhrase" :label="t('cardCatalog.detail.info.gachaPhrase')">
        <span class="italic">{{ extras.gachaPhrase }}</span>
      </CatalogInfoRow>

      <CatalogInfoRow v-if="extras?.flavorText" :label="t('cardCatalog.detail.info.flavorText')" value-class="whitespace-pre-line">
        <span>{{ extras.flavorText }}</span>
      </CatalogInfoRow>

      <!-- Internal name: last, dimmed, behind a copy affordance. -->
      <CatalogAssetName :name="card.assetbundleName" />
    </CatalogInfoList>
  </CatalogDetailSection>
</template>
