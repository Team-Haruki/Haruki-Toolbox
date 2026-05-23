<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { PlusIcon, Trash2Icon } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
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
const pendingCardId = ref<string | null>(null)
const cardOptionMap = computed(() =>
  new Map(props.cardOptions.map((option) => [option.id, option])),
)
const availableCardOptions = computed<ComboboxOption[]>(() => {
  const usedIds = new Set(props.modelValue.map((item) => item.cardId))
  return props.cardOptions
    .filter((option) => !usedIds.has(option.id))
    .map((option) => ({
      value: option.value,
      label: option.label,
      description: option.unitProfileName ?? option.description,
      tags: createCardTags(option),
      iconUrl: option.thumbnailUrl,
      keywords: option.keywords,
    }))
})

watch(
  () => props.cardOptions.map((option) => option.id).join(","),
  () => {
    if (pendingCardId.value && !props.cardOptions.some((option) => option.value === pendingCardId.value)) {
      pendingCardId.value = null
    }
  },
)

function addPendingCard() {
  const cardId = pendingCardId.value ? Number(pendingCardId.value) : null
  const option = cardId ? cardOptionMap.value.get(cardId) : null
  if (!cardId || !option || props.modelValue.some((item) => item.cardId === cardId)) {
    return
  }

  emit("update:modelValue", [
    ...props.modelValue,
    {
      cardId,
      disabled: false,
      level: option.maxLevel,
      skillLevel: option.maxSkillLevel,
      masterRank: 5,
      episodeState: "both",
      canvas: false,
    },
  ])
  pendingCardId.value = null
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
  return [
    option.rarity
      ? {
          label: t(`deckRecommend.training.rarities.${option.rarity}`),
          class: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
        }
      : null,
    option.attr
      ? {
          label: t(`deckRecommend.cardTags.attrs.${option.attr}`),
          class: resolveAttrTagClass(option.attr),
        }
      : null,
    option.unit
      ? {
          label: option.unitProfileName ?? t(`deckRecommend.eventUnits.${option.unit}`),
          class: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-200",
        }
      : null,
  ].filter((tag): tag is { label: string; class: string } => tag != null)
}

function resolveAttrTagClass(attr: NonNullable<DeckRecommendMasterCardOption["attr"]>) {
  switch (attr) {
    case "happy":
      return "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200"
    case "cute":
      return "border-pink-200 bg-pink-50 text-pink-800 dark:border-pink-500/30 dark:bg-pink-500/10 dark:text-pink-200"
    case "cool":
      return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200"
    case "pure":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
    case "mysterious":
      return "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200"
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
      <div class="grid gap-2">
        <Label>{{ t("deckRecommend.singleCard.card") }}</Label>
        <Combobox
          v-model="pendingCardId"
          :options="availableCardOptions"
          :disabled="props.disabled || availableCardOptions.length === 0"
          :placeholder="t('deckRecommend.singleCard.cardPlaceholder')"
          :search-placeholder="t('deckRecommend.singleCard.cardSearchPlaceholder')"
          :empty-text="t('deckRecommend.singleCard.cardEmpty')"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        class="self-end"
        :disabled="props.disabled || !pendingCardId"
        @click="addPendingCard"
      >
        <PlusIcon class="size-4" />
        {{ t("deckRecommend.singleCard.add") }}
      </Button>
    </div>

    <div v-if="props.modelValue.length === 0" class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
      {{ t("deckRecommend.singleCard.empty") }}
    </div>
    <Table v-else class="min-w-[1040px]">
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
                <div class="truncate text-xs text-muted-foreground">
                  {{ cardOption(item.cardId)?.description }}
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
            <Select
              :model-value="item.episodeState ?? 'inherit'"
              :disabled="props.disabled || item.disabled"
              @update:model-value="value => updateEpisodeState(item.cardId, value)"
            >
              <SelectTrigger class="h-8 w-full">
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
