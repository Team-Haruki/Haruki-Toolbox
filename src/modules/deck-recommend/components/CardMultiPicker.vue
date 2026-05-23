<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { XIcon } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import type { DeckRecommendMasterCardOption } from "../lib/card-options"

const props = defineProps<{
  modelValue: readonly number[]
  cardOptions: readonly DeckRecommendMasterCardOption[]
  disabled?: boolean
  placeholder?: string
  maxCards?: number | null
  uniqueCharacter?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: number[]]
}>()

const { t } = useI18n()
const pendingCardId = ref<string | null>(null)
const selectedIds = computed(() => props.modelValue ?? [])
const selectedIdSet = computed(() => new Set(selectedIds.value))
const selectedCharacterIdSet = computed(() => {
  const ids = new Set<number>()
  if (!props.uniqueCharacter) {
    return ids
  }

  for (const id of selectedIds.value) {
    const characterId = cardOptionMap.value.get(id)?.characterId
    if (characterId) {
      ids.add(characterId)
    }
  }
  return ids
})
const canSelectMore = computed(() => props.maxCards == null || selectedIds.value.length < props.maxCards)
const cardOptionMap = computed(() =>
  new Map(props.cardOptions.map((option) => [option.id, option])),
)
const selectedCards = computed(() =>
  selectedIds.value.map((id) => cardOptionMap.value.get(id) ?? createUnknownCardOption(id)),
)
const availableOptions = computed<ComboboxOption[]>(() =>
  props.cardOptions
    .filter((option) =>
      !selectedIdSet.value.has(option.id)
      && (!props.uniqueCharacter || !option.characterId || !selectedCharacterIdSet.value.has(option.characterId)),
    )
    .map((option) => ({
      value: option.value,
      label: option.label,
      description: option.unitProfileName ?? option.description,
      tags: createCardTags(option),
      iconUrl: option.thumbnailUrl,
      keywords: option.keywords,
    })),
)

watch(
  () => props.cardOptions.map((option) => option.id).join(","),
  () => {
    if (pendingCardId.value && !props.cardOptions.some((option) => option.value === pendingCardId.value)) {
      pendingCardId.value = null
    }
  },
)

function handlePendingCardUpdate(value: string | null) {
  pendingCardId.value = null
  const cardId = value ? Number(value) : null
  if (!cardId || !Number.isInteger(cardId) || selectedIdSet.value.has(cardId) || !canSelectMore.value) {
    return
  }

  const option = cardOptionMap.value.get(cardId)
  if (
    props.uniqueCharacter
    && option?.characterId
    && selectedCharacterIdSet.value.has(option.characterId)
  ) {
    return
  }

  emit("update:modelValue", [...selectedIds.value, cardId])
}

function removeCard(cardId: number) {
  emit("update:modelValue", selectedIds.value.filter((id) => id !== cardId))
}

function createUnknownCardOption(cardId: number): DeckRecommendMasterCardOption {
  return {
    id: cardId,
    value: String(cardId),
    label: `#${cardId}`,
    description: "",
    characterId: null,
    unit: null,
    unitProfileName: null,
    rarity: null,
    attr: null,
    maxLevel: 1,
    maxSkillLevel: 4,
    canSpecialTrain: false,
    thumbnailUrl: null,
    attrIconUrl: null,
    keywords: [String(cardId), `#${cardId}`],
  }
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
  <div class="grid gap-3">
    <Combobox
      :model-value="pendingCardId"
      :options="availableOptions"
      :disabled="props.disabled || !canSelectMore"
      :placeholder="props.placeholder ?? t('deckRecommend.options.constraints.cardSelectPlaceholder')"
      :search-placeholder="t('deckRecommend.options.constraints.cardSearchPlaceholder')"
      :empty-text="t('deckRecommend.options.constraints.cardEmpty')"
      @update:model-value="handlePendingCardUpdate"
    />

    <div v-if="selectedCards.length === 0" class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
      {{ t("deckRecommend.options.constraints.noSelectedCards") }}
    </div>
    <div v-else class="grid gap-2 sm:grid-cols-2">
      <div
        v-for="card in selectedCards"
        :key="card.id"
        class="flex min-w-0 items-center gap-2 rounded-md border bg-background/70 p-2"
      >
        <img
          v-if="card.thumbnailUrl"
          :src="card.thumbnailUrl"
          alt=""
          class="size-10 shrink-0 rounded-md object-cover"
          loading="lazy"
        >
        <div v-else class="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
          #{{ card.id }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-medium">{{ card.label }}</div>
          <div class="mt-1 flex flex-wrap gap-1">
            <span
              v-for="tag in createCardTags(card)"
              :key="`${card.id}-${tag.label}`"
              :class="[
                'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] font-medium leading-none',
                tag.class,
              ]"
            >
              {{ tag.label }}
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          class="size-8 shrink-0"
          :disabled="props.disabled"
          :aria-label="t('deckRecommend.options.constraints.removeCard')"
          @click="removeCard(card.id)"
        >
          <XIcon class="size-4" />
        </Button>
      </div>
    </div>
    <p class="text-xs text-muted-foreground">
      <template v-if="props.maxCards != null">
        {{ t("deckRecommend.options.constraints.selectedCardsLimitCount", { count: selectedCards.length, max: props.maxCards }) }}
      </template>
      <template v-else>
        {{ t("deckRecommend.options.constraints.selectedCardsCount", { count: selectedCards.length }) }}
      </template>
    </p>
  </div>
</template>
