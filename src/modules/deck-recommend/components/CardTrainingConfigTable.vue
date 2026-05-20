<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { resolveMySekaiCanvasIconUrl, resolveRarityTrainingIconUrl } from "@/shared/sekai/data-sources"
import type { CardTrainingConfig, DeckRecommendRarity } from "../lib/training-config"

const props = defineProps<{
  modelValue: CardTrainingConfig[]
}>()

const emit = defineEmits<{
  "update:modelValue": [value: CardTrainingConfig[]]
}>()

const { t } = useI18n()
const canvasIconUrl = resolveMySekaiCanvasIconUrl()

function updateRow(
  rarity: DeckRecommendRarity,
  key: keyof Omit<CardTrainingConfig, "rarity">,
  checked: boolean,
) {
  emit(
    "update:modelValue",
    props.modelValue.map((row) => row.rarity === rarity ? { ...row, [key]: checked } : row),
  )
}
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>{{ t("deckRecommend.training.rarity") }}</TableHead>
        <TableHead class="text-center">{{ t("deckRecommend.training.disabled") }}</TableHead>
        <TableHead class="text-center">{{ t("deckRecommend.training.maxLevel") }}</TableHead>
        <TableHead class="text-center">{{ t("deckRecommend.training.episodesRead") }}</TableHead>
        <TableHead class="text-center">{{ t("deckRecommend.training.maxMasterRank") }}</TableHead>
        <TableHead class="text-center">{{ t("deckRecommend.training.maxSkillLevel") }}</TableHead>
        <TableHead class="text-center">
          <span class="inline-flex items-center justify-center gap-1">
            <img :src="canvasIconUrl" alt="" class="size-5" loading="lazy">
            {{ t("deckRecommend.training.mySekaiCanvas") }}
          </span>
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="row in props.modelValue" :key="row.rarity">
        <TableCell>
          <span class="inline-flex items-center gap-2 font-medium">
            <img :src="resolveRarityTrainingIconUrl(row.rarity)" alt="" class="size-6" loading="lazy">
            {{ t(`deckRecommend.training.rarities.${row.rarity}`) }}
          </span>
        </TableCell>
        <TableCell class="text-center">
          <Checkbox
            :model-value="row.disabled"
            @update:model-value="checked => updateRow(row.rarity, 'disabled', checked === true)"
          />
        </TableCell>
        <TableCell class="text-center">
          <Checkbox
            :model-value="row.maxLevel"
            @update:model-value="checked => updateRow(row.rarity, 'maxLevel', checked === true)"
          />
        </TableCell>
        <TableCell class="text-center">
          <Checkbox
            :model-value="row.episodesRead"
            @update:model-value="checked => updateRow(row.rarity, 'episodesRead', checked === true)"
          />
        </TableCell>
        <TableCell class="text-center">
          <Checkbox
            :model-value="row.maxMasterRank"
            @update:model-value="checked => updateRow(row.rarity, 'maxMasterRank', checked === true)"
          />
        </TableCell>
        <TableCell class="text-center">
          <Checkbox
            :model-value="row.maxSkillLevel"
            @update:model-value="checked => updateRow(row.rarity, 'maxSkillLevel', checked === true)"
          />
        </TableCell>
        <TableCell class="text-center">
          <Checkbox
            :model-value="row.mySekaiCanvas"
            @update:model-value="checked => updateRow(row.rarity, 'mySekaiCanvas', checked === true)"
          />
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
