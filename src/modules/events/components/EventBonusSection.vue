<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideSparkles } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import SekaiAttrIcon from "@/shared/components/SekaiAttrIcon.vue"
import SekaiCharacterAvatar from "@/shared/components/SekaiCharacterAvatar.vue"
import SekaiRarityStars from "@/shared/components/SekaiRarityStars.vue"
import type { CatalogCharacter } from "@/shared/sekai/catalog"
import { resolveSekaiAttrLabel, resolveSekaiRarityLabel } from "@/shared/sekai/labels"
import {
  formatBonusRate,
  resolveBonusCharacterIconId,
  type EventBonusCharacter,
  type EventBonusGroup,
} from "@/modules/events/lib/event-bonus"
import { EVENT_MASTER_RANKS, type EventRarityBonusRow } from "@/modules/events/lib/event-rarity-bonus"

const props = withDefaults(defineProps<{
  groups: readonly EventBonusGroup[]
  characterMap: ReadonlyMap<number, CatalogCharacter>
  rarityTable: readonly EventRarityBonusRow[]
  /** The rarity table is still loading (extras resource). */
  tableLoading?: boolean
}>(), {
  tableLoading: false,
})

/** Mirrors `TableHead` so the native cells below match the rest of the table. */
const TABLE_HEAD_CLASS = "text-muted-foreground h-10 px-3 first:pl-6 last:pr-6 text-left align-middle font-medium whitespace-nowrap"

const { t, te } = useI18n()

const empty = computed(() => props.groups.length === 0 && props.rarityTable.length === 0 && !props.tableLoading)

function characterName(character: EventBonusCharacter): string {
  return props.characterMap.get(character.gameCharacterId)?.name ?? `#${character.gameCharacterId}`
}

function attrLabel(attr: string): string {
  return resolveSekaiAttrLabel({ t, te }, attr)
}

function rarityLabel(rarity: string): string {
  return resolveSekaiRarityLabel({ t, te }, rarity)
}

/** What a character row applies to: the attribute's cards of these characters, or all of their cards. */
function groupLabel(group: EventBonusGroup): string {
  return group.cardAttr
    ? t("eventCatalog.bonus.attrAndCharacters", { attr: attrLabel(group.cardAttr) })
    : t("eventCatalog.bonus.charactersOnly")
}
</script>

<template>
  <CatalogDetailSection
    :title="t('events.detail.bonusTitle')"
    :icon="LucideSparkles"
    :empty="empty"
    :empty-message="t('events.detail.bonusEmpty')"
    content-class="flex flex-col gap-4"
  >
    <div v-if="groups.length > 0" class="flex flex-col gap-2">
      <!-- Every row says in words what it applies to: the avatars alone did
           not tell "unit + attribute" from "unit only". -->
      <div
        v-for="(group, index) in groups"
        :key="index"
        class="flex flex-col gap-1.5 rounded-md border border-border/60 px-3 py-2"
      >
        <div class="flex items-center gap-2">
          <SekaiAttrIcon v-if="group.cardAttr" :attr="group.cardAttr" size="sm" />
          <span class="min-w-0 flex-1 text-xs text-muted-foreground">
            {{ group.characters.length === 0
              ? t("events.detail.bonusAttrOnly", { attr: group.cardAttr ? attrLabel(group.cardAttr) : "" })
              : groupLabel(group) }}
          </span>
          <Badge variant="emerald" class="ml-auto shrink-0 text-sm tabular-nums">{{ formatBonusRate(group.bonusRate) }}</Badge>
        </div>
        <div v-if="group.characters.length > 0" class="flex min-w-0 flex-wrap items-center gap-1">
          <SekaiCharacterAvatar
            v-for="character in group.characters"
            :key="character.gameCharacterId"
            :character-id="resolveBonusCharacterIconId(character)"
            :name="characterName(character)"
            size="md"
          />
        </div>
      </div>
    </div>

    <div v-if="tableLoading && rarityTable.length === 0" class="flex flex-col gap-2">
      <Skeleton class="h-4 w-1/3" />
      <Skeleton class="h-24 w-full" />
    </div>
    <div v-else-if="rarityTable.length > 0" class="flex flex-col gap-2">
      <p class="text-xs font-medium text-muted-foreground">{{ t("eventCatalog.bonus.rarityTable") }}</p>
      <!-- No `overflow-x-auto` here: the shared Table owns the scroll
           container, and with it the edge fades that show more columns hide
           off-screen on phones. -->
      <div class="overflow-hidden rounded-md border">
        <Table class="text-xs sm:text-sm">
          <TableHeader>
            <TableRow>
              <!-- Native `th`, not `TableHead`: same classes, but the markup
                   linter only recognises a header cell it can see. -->
              <th scope="col" :class="TABLE_HEAD_CLASS">{{ t("eventCatalog.bonus.rarity") }}</th>
              <th
                v-for="rank in EVENT_MASTER_RANKS"
                :key="rank"
                scope="col"
                :class="[TABLE_HEAD_CLASS, 'text-right tabular-nums']"
              >
                {{ t("eventCatalog.bonus.masterRank", { rank }) }}
              </th>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="row in rarityTable" :key="row.cardRarityType">
              <TableCell class="whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5">
                  <SekaiRarityStars :card-rarity-type="row.cardRarityType" size="xs" />
                  <span class="sr-only">{{ rarityLabel(row.cardRarityType) }}</span>
                </span>
              </TableCell>
              <TableCell v-for="(rate, index) in row.rates" :key="index" class="text-right tabular-nums">
                {{ rate != null ? formatBonusRate(rate) : "—" }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  </CatalogDetailSection>
</template>
