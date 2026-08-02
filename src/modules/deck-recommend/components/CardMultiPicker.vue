<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { LayoutGrid, Search, XIcon } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import CatalogChipsField from "@/shared/components/catalog/CatalogChipsField.vue"
import CatalogSelectField from "@/shared/components/catalog/CatalogSelectField.vue"
import type { CatalogFieldOption } from "@/shared/components/catalog/types"
import type { DeckRecommendMasterCardOption } from "../lib/card-options"
import { createDeckRecommendCardTags } from "../lib/card-tags"

const RARITY_ORDER = ["rarity_1", "rarity_2", "rarity_3", "rarity_4", "rarity_birthday"] as const
const UNIT_ORDER = ["light_sound", "idol", "street", "theme_park", "school_refusal", "piapro"] as const
const ATTR_ORDER = ["cute", "cool", "pure", "happy", "mysterious"] as const

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

// Browse dialog with catalog-style filters over the same option list.
const browseOpen = ref(false)
const browseSearch = ref("")
const browseCharacterId = ref<string | null>(null)
const browseUnits = ref<string[]>([])
const browseAttrs = ref<string[]>([])
const browseRarities = ref<string[]>([])

const characterFieldOptions = computed<CatalogFieldOption[]>(() => {
  const seen = new Map<number, string>()
  for (const option of props.cardOptions) {
    if (option.characterId != null && !seen.has(option.characterId)) {
      seen.set(option.characterId, option.characterName ?? `#${option.characterId}`)
    }
  }
  return [...seen.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([id, name]) => ({ value: String(id), label: name }))
})

const unitFieldOptions = computed<CatalogFieldOption[]>(() => {
  const present = new Map(
    props.cardOptions
      .filter((option) => option.unit != null)
      .map((option) => [option.unit as string, option] as const),
  )
  return UNIT_ORDER
    .filter((unit) => present.has(unit))
    .map((unit) => ({
      value: unit,
      label: present.get(unit)?.unitProfileName ?? t(`deckRecommend.eventUnits.${unit}`),
      color: present.get(unit)?.unitColorCode ?? null,
    }))
})

const attrFieldOptions = computed<CatalogFieldOption[]>(() => {
  const present = new Map(
    props.cardOptions
      .filter((option) => option.attr != null)
      .map((option) => [option.attr as string, option] as const),
  )
  return ATTR_ORDER
    .filter((attr) => present.has(attr))
    .map((attr) => ({
      value: attr,
      label: t(`deckRecommend.cardTags.attrs.${attr}`),
      iconUrl: present.get(attr)?.attrIconUrl ?? null,
    }))
})

const rarityFieldOptions = computed<CatalogFieldOption[]>(() => {
  const present = new Set(props.cardOptions.map((option) => option.rarity))
  return RARITY_ORDER
    .filter((rarity) => present.has(rarity))
    .map((rarity) => ({ value: rarity, label: t(`deckRecommend.training.rarities.${rarity}`) }))
})

const browseResults = computed(() => {
  const query = browseSearch.value.trim().toLowerCase()
  const characterId = browseCharacterId.value != null ? Number(browseCharacterId.value) : null
  return props.cardOptions.filter((option) => {
    if (query && !option.keywords.some((keyword) => keyword.toLowerCase().includes(query))) {
      return false
    }

    if (characterId != null && option.characterId !== characterId) {
      return false
    }

    if (browseUnits.value.length > 0 && (option.unit == null || !browseUnits.value.includes(option.unit))) {
      return false
    }

    if (browseAttrs.value.length > 0 && (option.attr == null || !browseAttrs.value.includes(option.attr))) {
      return false
    }

    return browseRarities.value.length === 0
      || (option.rarity != null && browseRarities.value.includes(option.rarity))
  })
})

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
  if (!cardId || !Number.isInteger(cardId)) {
    return
  }

  addCard(cardId)
}

function canAddCard(option: DeckRecommendMasterCardOption): boolean {
  if (selectedIdSet.value.has(option.id)) {
    return false
  }

  if (!canSelectMore.value) {
    return false
  }

  return !props.uniqueCharacter
    || !option.characterId
    || !selectedCharacterIdSet.value.has(option.characterId)
}

function addCard(cardId: number) {
  if (selectedIdSet.value.has(cardId) || !canSelectMore.value) {
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

function resetBrowseFilters() {
  browseSearch.value = ""
  browseCharacterId.value = null
  browseUnits.value = []
  browseAttrs.value = []
  browseRarities.value = []
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
    <div class="flex items-start gap-2">
      <Combobox
        class="min-w-0 flex-1"
        :model-value="pendingCardId"
        :options="availableOptions"
        :disabled="props.disabled || !canSelectMore"
        :placeholder="props.placeholder ?? t('deckRecommend.options.constraints.cardSelectPlaceholder')"
        :search-placeholder="t('deckRecommend.options.constraints.cardSearchPlaceholder')"
        :empty-text="t('deckRecommend.options.constraints.cardEmpty')"
        @update:model-value="handlePendingCardUpdate"
      />
      <Button
        type="button"
        variant="outline"
        class="shrink-0"
        :disabled="props.disabled || props.cardOptions.length === 0"
        @click="browseOpen = true"
      >
        <LayoutGrid class="size-4" />
        {{ t("deckRecommend.picker.browse") }}
      </Button>
    </div>

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
    <p class="text-xs text-muted-foreground">
      <template v-if="props.maxCards != null">
        {{ t("deckRecommend.options.constraints.selectedCardsLimitCount", { count: selectedCards.length, max: props.maxCards }) }}
      </template>
      <template v-else>
        {{ t("deckRecommend.options.constraints.selectedCardsCount", { count: selectedCards.length }) }}
      </template>
    </p>

    <Dialog v-model:open="browseOpen">
      <DialogContent class="flex max-h-[85vh] flex-col gap-3 overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{{ t("deckRecommend.picker.cardDialogTitle") }}</DialogTitle>
        </DialogHeader>

        <div class="grid gap-3 rounded-md border bg-muted/20 p-3">
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="grid gap-2">
              <Label>{{ t("deckRecommend.picker.cardSearchLabel") }}</Label>
              <div class="relative w-full items-center">
                <Input
                  v-model="browseSearch"
                  class="pl-10"
                  type="text"
                  :placeholder="t('deckRecommend.options.constraints.cardSearchPlaceholder')"
                />
                <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                  <Search class="size-4 text-muted-foreground" />
                </span>
              </div>
            </div>
            <CatalogSelectField
              v-model="browseCharacterId"
              :label="t('deckRecommend.form.character')"
              :all-label="t('deckRecommend.picker.filterAll')"
              :options="characterFieldOptions"
            />
          </div>
          <CatalogChipsField
            v-model="browseUnits"
            :label="t('deckRecommend.picker.unitLabel')"
            :options="unitFieldOptions"
          />
          <CatalogChipsField
            v-model="browseAttrs"
            :label="t('deckRecommend.picker.attrLabel')"
            :options="attrFieldOptions"
          />
          <CatalogChipsField
            v-model="browseRarities"
            :label="t('deckRecommend.picker.rarityLabel')"
            :options="rarityFieldOptions"
          />
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-xs text-muted-foreground">
              {{ t("deckRecommend.picker.browseCount", { count: browseResults.length }) }}
            </p>
            <Button type="button" variant="ghost" size="sm" @click="resetBrowseFilters">
              {{ t("musicLibrary.list.filters.reset") }}
            </Button>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <div
            v-if="browseResults.length > 0"
            class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
          >
            <button
              v-for="option in browseResults"
              :key="option.id"
              type="button"
              :disabled="props.disabled || (!selectedIdSet.has(option.id) && !canAddCard(option))"
              :class="[
                'flex min-w-0 items-center gap-2 rounded-lg border bg-card p-2 text-left transition-colors',
                selectedIdSet.has(option.id)
                  ? 'ring-2 ring-primary'
                  : 'hover:bg-accent/50 dark:hover:bg-accent/30',
                props.disabled || (!selectedIdSet.has(option.id) && !canAddCard(option))
                  ? 'cursor-not-allowed opacity-40'
                  : '',
              ]"
              @click="toggleCard(option)"
            >
              <img
                v-if="option.thumbnailUrl"
                :src="option.thumbnailUrl"
                alt=""
                class="size-12 shrink-0 rounded-md object-cover"
                loading="lazy"
              >
              <span v-else class="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                #{{ option.id }}
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-xs font-medium" :title="option.label">{{ option.label }}</span>
                <span class="mt-1 flex flex-wrap gap-1">
                  <span
                    v-for="tag in createCardTags(option).slice(0, 2)"
                    :key="`${option.id}-${tag.label}`"
                    :class="[
                      'inline-flex items-center rounded-sm border px-1 py-0.5 text-[10px] font-medium leading-none',
                      tag.class,
                    ]"
                    :style="tag.style"
                  >
                    {{ tag.label }}
                  </span>
                </span>
              </span>
            </button>
          </div>
          <div
            v-else
            class="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground"
          >
            {{ t("deckRecommend.options.constraints.cardEmpty") }}
          </div>
        </div>

        <DialogFooter class="flex-row items-center justify-between gap-2 sm:justify-between">
          <p class="text-xs text-muted-foreground">
            <template v-if="props.maxCards != null">
              {{ t("deckRecommend.options.constraints.selectedCardsLimitCount", { count: selectedCards.length, max: props.maxCards }) }}
            </template>
            <template v-else>
              {{ t("deckRecommend.options.constraints.selectedCardsCount", { count: selectedCards.length }) }}
            </template>
          </p>
          <Button type="button" @click="browseOpen = false">
            {{ t("deckRecommend.picker.done") }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
