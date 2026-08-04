<script setup lang="ts">
import { computed, ref } from "vue"
import { LayoutGrid, XIcon } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import CardBrowseDialog from "./CardBrowseDialog.vue"
import type { DeckRecommendMasterCardOption } from "../lib/card-options"
import { createDeckRecommendCardTags } from "../lib/card-tags"

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
const browseOpen = ref(false)
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
const browseDisabledIds = computed(() =>
  props.cardOptions
    .filter((option) => !selectedIdSet.value.has(option.id) && !canAddCard(option))
    .map((option) => option.id),
)

const selectionCountText = computed(() =>
  props.maxCards != null
    ? t("deckRecommend.options.constraints.selectedCardsLimitCount", { count: selectedCards.value.length, max: props.maxCards })
    : t("deckRecommend.options.constraints.selectedCardsCount", { count: selectedCards.value.length }),
)

function canAddCard(option: DeckRecommendMasterCardOption): boolean {
  if (selectedIdSet.value.has(option.id) || !canSelectMore.value) {
    return false
  }

  return !props.uniqueCharacter
    || !option.characterId
    || !selectedCharacterIdSet.value.has(option.characterId)
}

function addCard(cardId: number) {
  const option = cardOptionMap.value.get(cardId)
  if (option == null || !canAddCard(option)) {
    return
  }

  emit("update:modelValue", [...selectedIds.value, cardId])
}

function toggleCard(option: DeckRecommendMasterCardOption) {
  if (selectedIdSet.value.has(option.id)) {
    removeCard(option.id)
  } else {
    addCard(option.id)
  }
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
    characterName: null,
    characterColorCode: null,
    unitColorCode: null,
  }
}

function createCardTags(option: DeckRecommendMasterCardOption) {
  return createDeckRecommendCardTags(option, t)
}
</script>

<template>
  <div class="grid gap-3">
    <Button
      type="button"
      variant="outline"
      class="w-full justify-between gap-2 font-normal"
      :disabled="props.disabled || props.cardOptions.length === 0"
      @click="browseOpen = true"
    >
      <span class="flex min-w-0 items-center gap-2 text-muted-foreground">
        <LayoutGrid class="size-4 shrink-0" />
        <span class="truncate">{{ props.placeholder ?? t('deckRecommend.options.constraints.cardSelectPlaceholder') }}</span>
      </span>
      <span class="shrink-0 text-xs text-muted-foreground">{{ selectionCountText }}</span>
    </Button>

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
              :style="tag.style"
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

    <CardBrowseDialog
      v-model:open="browseOpen"
      :card-options="props.cardOptions"
      :selected-ids="selectedIds"
      :disabled-ids="browseDisabledIds"
      :disabled="props.disabled"
      :footer-text="selectionCountText"
      @select="toggleCard"
    />
  </div>
</template>
