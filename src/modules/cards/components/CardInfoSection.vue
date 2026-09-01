<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideArrowUpRight, LucideCalendarDays, LucideInfo } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { formatLocalizedDateTime } from "@/lib/date-time"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import CatalogInfoList from "@/shared/components/catalog/CatalogInfoList.vue"
import CatalogInfoRow from "@/shared/components/catalog/CatalogInfoRow.vue"
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
    <CatalogInfoList>
      <CatalogInfoRow :label="t('cardCatalog.detail.info.character')">
        <RouterLink
          v-if="character && characterRoute"
          :to="characterRoute"
          class="inline-flex min-w-0 items-center gap-2 rounded-md transition-colors hover:text-primary"
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

      <CatalogInfoRow :label="t('cardCatalog.detail.info.releaseAt')" :icon="LucideCalendarDays">
        <span v-if="card.releaseAt != null" class="tabular-nums">{{ formatLocalizedDateTime(card.releaseAt) }}</span>
      </CatalogInfoRow>

      <CatalogInfoRow v-if="extras?.gachaPhrase" :label="t('cardCatalog.detail.info.gachaPhrase')">
        <span class="italic">{{ extras.gachaPhrase }}</span>
      </CatalogInfoRow>

      <CatalogInfoRow v-if="extras?.flavorText" :label="t('cardCatalog.detail.info.flavorText')" value-class="whitespace-pre-line">
        <span>{{ extras.flavorText }}</span>
      </CatalogInfoRow>

      <CatalogInfoRow :label="t('catalog.detail.assetName')">
        <span v-if="card.assetbundleName" class="font-mono text-xs text-muted-foreground">{{ card.assetbundleName }}</span>
      </CatalogInfoRow>
    </CatalogInfoList>
  </CatalogDetailSection>
</template>
