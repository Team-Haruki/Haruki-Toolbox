<script setup lang="ts">
import { computed, ref } from "vue"
import { LayoutGrid, Trash2Icon } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Combobox, type ComboboxOption, type ComboboxOptionTag } from "@/components/ui/combobox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { DeckRecommendSingleCardOverride } from "../lib/user-data-preparation"
import type { DeckRecommendMasterCardOption } from "../lib/card-options"
import { createDeckRecommendCardTags } from "../lib/card-tags"
import CardBrowseDialog from "./CardBrowseDialog.vue"

const props = defineProps<{
  modelValue: DeckRecommendSingleCardOverride[]
  cardOptions: DeckRecommendMasterCardOption[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: DeckRecommendSingleCardOverride[]]
}>()

const { t } = useI18n()
const INHERIT_OPTION_VALUE = "__inherit__"
const browseOpen = ref(false)
const usedCardIds = computed(() => props.modelValue.map((item) => item.cardId))
const cardOptionMap = computed(() =>
  new Map(props.cardOptions.map((option) => [option.id, option])),
)

function addOverrideForOption(option: DeckRecommendMasterCardOption) {
  if (props.modelValue.some((item) => item.cardId === option.id)) {
    return
  }

  emit("update:modelValue", [
    ...props.modelValue,
    {
      cardId: option.id,
      disabled: false,
      level: option.maxLevel,
      skillLevel: option.maxSkillLevel,
      masterRank: 5,
      episodeState: "both",
      canvas: false,
    },
  ])
}

function updateOverride(cardId: number, patch: Partial<DeckRecommendSingleCardOverride>) {
  emit(
    "update:modelValue",
    props.modelValue.map((item) => {
      if (item.cardId !== cardId) {
        return item
      }

      return clampOverride({ ...item, ...patch })
    }),
  )
}

function removeOverride(cardId: number) {
  emit("update:modelValue", props.modelValue.filter((item) => item.cardId !== cardId))
}

function cardOption(cardId: number) {
  return cardOptionMap.value.get(cardId) ?? null
}

function cardTags(cardId: number): ComboboxOptionTag[] {
  const option = cardOption(cardId)
  return option ? createCardTags(option) : []
}

function updateNumber(cardId: number, key: "level" | "skillLevel" | "masterRank", value: string | null) {
  if (!value || value === INHERIT_OPTION_VALUE) {
    updateOverride(cardId, { [key]: null })
    return
  }

  const parsed = Number(value)
  updateOverride(cardId, {
    [key]: Number.isInteger(parsed) ? parsed : null,
  })
}

function numberComboboxValue(value: number | null) {
  return value == null ? INHERIT_OPTION_VALUE : String(value)
}

function levelOptions(cardId: number): ComboboxOption[] {
  return createNumberOptions(1, cardOption(cardId)?.maxLevel ?? 1, (value) =>
    t("deckRecommend.singleCard.levelOption", { value }),
  )
}

function skillLevelOptions(cardId: number): ComboboxOption[] {
  return createNumberOptions(1, cardOption(cardId)?.maxSkillLevel ?? 4, (value) =>
    t("deckRecommend.singleCard.skillLevelOption", { value }),
  )
}

function masterRankOptions(): ComboboxOption[] {
  return createNumberOptions(0, 5, (value) =>
    t("deckRecommend.singleCard.masterRankOption", { value }),
  )
}

function createNumberOptions(min: number, max: number, label: (value: number) => string): ComboboxOption[] {
  const options: ComboboxOption[] = [
    {
      value: INHERIT_OPTION_VALUE,
      label: t("deckRecommend.singleCard.inherit"),
    },
  ]
  for (let value = min; value <= max; value += 1) {
    options.push({
      value: String(value),
      label: label(value),
      keywords: [String(value)],
    })
  }
  return options
}

function updateEpisodeState(cardId: number, value: unknown) {
  if (value === "inherit") {
    updateOverride(cardId, { episodeState: null })
    return
  }
  if (value === "none" || value === "first" || value === "both") {
    updateOverride(cardId, { episodeState: value })
  }
}

function clampOverride(value: DeckRecommendSingleCardOverride): DeckRecommendSingleCardOverride {
  const option = cardOption(value.cardId)
  return {
    ...value,
    level: clampNumber(value.level, 1, option?.maxLevel ?? null),
    skillLevel: clampNumber(value.skillLevel, 1, option?.maxSkillLevel ?? 4),
    masterRank: clampNumber(value.masterRank, 0, 5),
  }
}

function clampNumber(value: number | null, min: number, max: number | null) {
  if (value == null || !Number.isInteger(value)) {
    return null
  }
  if (value < min) {
    return min
  }
  return max == null ? value : Math.min(value, max)
}

function createCardTags(option: DeckRecommendMasterCardOption) {
  return createDeckRecommendCardTags(option, t)
}
</script>

<template>
  <div class="min-w-0 space-y-3">
    <Button
      type="button"
      variant="outline"
      class="w-full justify-between gap-2 font-normal"
      :disabled="props.disabled || props.cardOptions.length === 0"
      @click="browseOpen = true"
    >
      <span class="flex min-w-0 items-center gap-2 text-muted-foreground">
        <LayoutGrid class="size-4 shrink-0" />
        <span class="truncate">{{ t("deckRecommend.singleCard.cardPlaceholder") }}</span>
      </span>
      <span class="shrink-0 text-xs text-muted-foreground">
        {{ t("deckRecommend.singleCard.selectedCount", { count: props.modelValue.length }) }}
      </span>
    </Button>

    <CardBrowseDialog
      v-model:open="browseOpen"
      :card-options="props.cardOptions"
      :selected-ids="usedCardIds"
      :disabled-ids="usedCardIds"
      :disabled="props.disabled"
      :footer-text="t('deckRecommend.singleCard.selectedCount', { count: props.modelValue.length })"
      @select="addOverrideForOption"
    />

    <div v-if="props.modelValue.length === 0" class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
      {{ t("deckRecommend.singleCard.empty") }}
    </div>
    <template v-else>
      <div class="grid min-w-0 gap-3 lg:hidden">
        <article
          v-for="item in props.modelValue"
          :key="item.cardId"
          class="grid min-w-0 gap-3 rounded-md border bg-background/60 p-2.5"
        >
          <div class="flex min-w-0 items-start justify-between gap-2">
            <div class="flex min-w-0 items-center gap-2">
                <img
                  v-if="cardOption(item.cardId)?.thumbnailUrl"
                  :src="cardOption(item.cardId)?.thumbnailUrl ?? ''"
                  alt=""
                  class="size-11 shrink-0 rounded-md object-cover"
                  loading="lazy"
                >
                <div class="min-w-0">
                  <div class="truncate text-sm font-medium">
                    {{ cardOption(item.cardId)?.label ?? `#${item.cardId}` }}
                  </div>
                  <div class="min-w-0 text-xs text-muted-foreground">
                    <span v-if="cardTags(item.cardId).length" class="flex flex-wrap gap-1">
                      <span
                        v-for="tag in cardTags(item.cardId)"
                        :key="tag.label"
                        :class="[
                          'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] font-medium leading-none',
                          tag.class,
                        ]"
                        :style="tag.style"
                      >
                        {{ tag.label }}
                      </span>
                    </span>
                    <span v-else class="block truncate">{{ cardOption(item.cardId)?.description }}</span>
                  </div>
                </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              :aria-label="t('deckRecommend.singleCard.remove')"
              :disabled="props.disabled"
              @click="removeOverride(item.cardId)"
            >
              <Trash2Icon class="size-4" />
            </Button>
          </div>

          <div class="grid min-w-0 gap-2 sm:grid-cols-2">
            <label :for="`single-card-disabled-${item.cardId}`" class="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-2.5 py-2 text-sm">
              <span class="font-medium">{{ t("deckRecommend.training.disabled") }}</span>
              <Checkbox
                :id="`single-card-disabled-${item.cardId}`"
                :model-value="item.disabled"
                :disabled="props.disabled"
                @update:model-value="checked => updateOverride(item.cardId, { disabled: checked === true })"
              />
            </label>

            <label :for="`single-card-canvas-${item.cardId}`" class="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-2.5 py-2 text-sm">
              <span class="font-medium">{{ t("deckRecommend.training.mySekaiCanvas") }}</span>
              <Checkbox
                :id="`single-card-canvas-${item.cardId}`"
                :model-value="item.canvas === true"
                :disabled="props.disabled || item.disabled"
                @update:model-value="checked => updateOverride(item.cardId, { canvas: checked === true })"
              />
            </label>

            <div class="grid min-w-0 gap-1.5">
              <Label :for="`single-card-level-${item.cardId}`">{{ t("deckRecommend.singleCard.level") }}</Label>
              <Combobox
                :trigger-id="`single-card-level-${item.cardId}`"
                :model-value="numberComboboxValue(item.level)"
                :options="levelOptions(item.cardId)"
                :disabled="props.disabled || item.disabled"
                :placeholder="t('deckRecommend.singleCard.inherit')"
                :search-placeholder="t('deckRecommend.singleCard.numberSearchPlaceholder')"
                :empty-text="t('deckRecommend.singleCard.numberEmpty')"
                trigger-class="h-9 px-2 text-xs"
                content-class="min-w-40 max-w-[calc(100vw-2rem)]"
                @update:model-value="value => updateNumber(item.cardId, 'level', value)"
              />
            </div>

            <div class="grid min-w-0 gap-1.5">
              <Label :for="`single-card-skill-${item.cardId}`">{{ t("deckRecommend.singleCard.skillLevel") }}</Label>
              <Combobox
                :trigger-id="`single-card-skill-${item.cardId}`"
                :model-value="numberComboboxValue(item.skillLevel)"
                :options="skillLevelOptions(item.cardId)"
                :disabled="props.disabled || item.disabled"
                :placeholder="t('deckRecommend.singleCard.inherit')"
                :search-placeholder="t('deckRecommend.singleCard.numberSearchPlaceholder')"
                :empty-text="t('deckRecommend.singleCard.numberEmpty')"
                trigger-class="h-9 px-2 text-xs"
                content-class="min-w-40 max-w-[calc(100vw-2rem)]"
                @update:model-value="value => updateNumber(item.cardId, 'skillLevel', value)"
              />
            </div>

            <div class="grid min-w-0 gap-1.5">
              <Label :for="`single-card-master-${item.cardId}`">{{ t("deckRecommend.singleCard.masterRank") }}</Label>
              <Combobox
                :trigger-id="`single-card-master-${item.cardId}`"
                :model-value="numberComboboxValue(item.masterRank)"
                :options="masterRankOptions()"
                :disabled="props.disabled || item.disabled"
                :placeholder="t('deckRecommend.singleCard.inherit')"
                :search-placeholder="t('deckRecommend.singleCard.numberSearchPlaceholder')"
                :empty-text="t('deckRecommend.singleCard.numberEmpty')"
                trigger-class="h-9 px-2 text-xs"
                content-class="min-w-40 max-w-[calc(100vw-2rem)]"
                @update:model-value="value => updateNumber(item.cardId, 'masterRank', value)"
              />
            </div>

            <div class="grid min-w-0 gap-1.5">
              <Label :id="`single-card-episodes-${item.cardId}-label`" :for="`single-card-episodes-${item.cardId}`">
                {{ t("deckRecommend.singleCard.episodes") }}
              </Label>
              <Select
                :id="`single-card-episodes-${item.cardId}`"
                :model-value="item.episodeState ?? 'inherit'"
                :disabled="props.disabled || item.disabled"
                @update:model-value="value => updateEpisodeState(item.cardId, value)"
              >
                <SelectTrigger class="h-9 w-full" :aria-labelledby="`single-card-episodes-${item.cardId}-label`">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">{{ t("deckRecommend.singleCard.episodeStates.inherit") }}</SelectItem>
                  <SelectItem value="none">{{ t("deckRecommend.singleCard.episodeStates.none") }}</SelectItem>
                  <SelectItem value="first">{{ t("deckRecommend.singleCard.episodeStates.first") }}</SelectItem>
                  <SelectItem value="both">{{ t("deckRecommend.singleCard.episodeStates.both") }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </article>
      </div>

      <div class="hidden min-w-0 lg:block">
        <Table class="min-w-[1040px]">
          <TableHeader>
            <TableRow>
              <TableHead>{{ t("deckRecommend.singleCard.card") }}</TableHead>
              <TableHead class="w-24 text-center">{{ t("deckRecommend.training.disabled") }}</TableHead>
              <TableHead class="w-32">{{ t("deckRecommend.singleCard.level") }}</TableHead>
              <TableHead class="w-32">{{ t("deckRecommend.singleCard.skillLevel") }}</TableHead>
              <TableHead class="w-36">{{ t("deckRecommend.singleCard.masterRank") }}</TableHead>
              <TableHead class="w-40">{{ t("deckRecommend.singleCard.episodes") }}</TableHead>
              <TableHead class="w-24 text-center">{{ t("deckRecommend.training.mySekaiCanvas") }}</TableHead>
              <TableHead class="w-14" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="item in props.modelValue" :key="item.cardId">
              <TableCell class="min-w-64 whitespace-normal">
                <div class="flex min-w-0 items-center gap-2">
                  <img
                    v-if="cardOption(item.cardId)?.thumbnailUrl"
                    :src="cardOption(item.cardId)?.thumbnailUrl ?? ''"
                    alt=""
                    class="size-10 shrink-0 rounded-md object-cover"
                    loading="lazy"
                  >
                  <div class="min-w-0">
                    <div class="truncate text-sm font-medium">
                      {{ cardOption(item.cardId)?.label ?? `#${item.cardId}` }}
                    </div>
                    <div class="min-w-0 text-xs text-muted-foreground">
                      <span v-if="cardTags(item.cardId).length" class="flex flex-wrap gap-1">
                        <span
                          v-for="tag in cardTags(item.cardId)"
                          :key="tag.label"
                          :class="[
                            'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] font-medium leading-none',
                            tag.class,
                          ]"
                          :style="tag.style"
                        >
                          {{ tag.label }}
                        </span>
                      </span>
                      <span v-else class="block truncate">{{ cardOption(item.cardId)?.description }}</span>
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell class="text-center">
                <Checkbox
                  :model-value="item.disabled"
                  :disabled="props.disabled"
                  @update:model-value="checked => updateOverride(item.cardId, { disabled: checked === true })"
                />
              </TableCell>
              <TableCell>
                <Combobox
                  :model-value="numberComboboxValue(item.level)"
                  :options="levelOptions(item.cardId)"
                  :disabled="props.disabled || item.disabled"
                  :placeholder="t('deckRecommend.singleCard.inherit')"
                  :search-placeholder="t('deckRecommend.singleCard.numberSearchPlaceholder')"
                  :empty-text="t('deckRecommend.singleCard.numberEmpty')"
                  trigger-class="h-8 px-2 text-xs"
                  content-class="min-w-40"
                  @update:model-value="value => updateNumber(item.cardId, 'level', value)"
                />
              </TableCell>
              <TableCell>
                <Combobox
                  :model-value="numberComboboxValue(item.skillLevel)"
                  :options="skillLevelOptions(item.cardId)"
                  :disabled="props.disabled || item.disabled"
                  :placeholder="t('deckRecommend.singleCard.inherit')"
                  :search-placeholder="t('deckRecommend.singleCard.numberSearchPlaceholder')"
                  :empty-text="t('deckRecommend.singleCard.numberEmpty')"
                  trigger-class="h-8 px-2 text-xs"
                  content-class="min-w-40"
                  @update:model-value="value => updateNumber(item.cardId, 'skillLevel', value)"
                />
              </TableCell>
              <TableCell>
                <Combobox
                  :model-value="numberComboboxValue(item.masterRank)"
                  :options="masterRankOptions()"
                  :disabled="props.disabled || item.disabled"
                  :placeholder="t('deckRecommend.singleCard.inherit')"
                  :search-placeholder="t('deckRecommend.singleCard.numberSearchPlaceholder')"
                  :empty-text="t('deckRecommend.singleCard.numberEmpty')"
                  trigger-class="h-8 px-2 text-xs"
                  content-class="min-w-40"
                  @update:model-value="value => updateNumber(item.cardId, 'masterRank', value)"
                />
              </TableCell>
              <TableCell>
                <Label :id="`single-card-table-episodes-${item.cardId}-label`" :for="`single-card-table-episodes-${item.cardId}`" class="sr-only">
                  {{ t("deckRecommend.singleCard.episodes") }}
                </Label>
                <Select
                  :id="`single-card-table-episodes-${item.cardId}`"
                  :model-value="item.episodeState ?? 'inherit'"
                  :disabled="props.disabled || item.disabled"
                  @update:model-value="value => updateEpisodeState(item.cardId, value)"
                >
                  <SelectTrigger class="h-8 w-full" :aria-labelledby="`single-card-table-episodes-${item.cardId}-label`">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inherit">{{ t("deckRecommend.singleCard.episodeStates.inherit") }}</SelectItem>
                    <SelectItem value="none">{{ t("deckRecommend.singleCard.episodeStates.none") }}</SelectItem>
                    <SelectItem value="first">{{ t("deckRecommend.singleCard.episodeStates.first") }}</SelectItem>
                    <SelectItem value="both">{{ t("deckRecommend.singleCard.episodeStates.both") }}</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell class="text-center">
                <Checkbox
                  :model-value="item.canvas === true"
                  :disabled="props.disabled || item.disabled"
                  @update:model-value="checked => updateOverride(item.cardId, { canvas: checked === true })"
                />
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  :aria-label="t('deckRecommend.singleCard.remove')"
                  :disabled="props.disabled"
                  @click="removeOverride(item.cardId)"
                >
                  <Trash2Icon class="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </template>
  </div>
</template>
