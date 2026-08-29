<script setup lang="ts">
import { computed, ref } from "vue"
import { Search } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
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
  open: boolean
  cardOptions: readonly DeckRecommendMasterCardOption[]
  /** Highlighted with a ring; always clickable so toggle-style parents can deselect. */
  selectedIds?: readonly number[]
  /** Unselected cards that must not be picked (limits, unique-character, already used). */
  disabledIds?: readonly number[]
  disabled?: boolean
  /** Close the dialog right after a pick (single-select parents). */
  closeOnSelect?: boolean
  /** Selection summary shown in the footer next to the done button. */
  footerText?: string
}>()

const emit = defineEmits<{
  "update:open": [value: boolean]
  select: [option: DeckRecommendMasterCardOption]
}>()

const { t } = useI18n()

const browseSearch = ref("")
const browseCharacterId = ref<string | null>(null)
const browseUnits = ref<string[]>([])
const browseAttrs = ref<string[]>([])
const browseRarities = ref<string[]>([])

const selectedIdSet = computed(() => new Set(props.selectedIds ?? []))
const disabledIdSet = computed(() => new Set(props.disabledIds ?? []))

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

function isOptionDisabled(option: DeckRecommendMasterCardOption): boolean {
  return props.disabled === true
    || (!selectedIdSet.value.has(option.id) && disabledIdSet.value.has(option.id))
}

function handleSelect(option: DeckRecommendMasterCardOption) {
  if (isOptionDisabled(option)) {
    return
  }

  emit("select", option)
  if (props.closeOnSelect) {
    emit("update:open", false)
  }
}

function resetBrowseFilters() {
  browseSearch.value = ""
  browseCharacterId.value = null
  browseUnits.value = []
  browseAttrs.value = []
  browseRarities.value = []
}

function createCardTags(option: DeckRecommendMasterCardOption) {
  return createDeckRecommendCardTags(option, t)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="flex max-h-[85vh] flex-col gap-3 overflow-hidden sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>{{ t("deckRecommend.picker.cardDialogTitle") }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-3 rounded-md border bg-muted/20 p-3">
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="grid gap-2">
            <Label for="deck-card-browse-search">{{ t("deckRecommend.picker.cardSearchLabel") }}</Label>
            <div class="relative w-full items-center">
              <Input
                id="deck-card-browse-search"
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
            :disabled="isOptionDisabled(option)"
            :class="[
              'flex min-w-0 items-center gap-2 rounded-lg border bg-card p-2 text-left transition-colors',
              selectedIdSet.has(option.id)
                ? 'ring-2 ring-primary'
                : 'hover:bg-accent/50 dark:hover:bg-accent/30',
              isOptionDisabled(option) ? 'cursor-not-allowed opacity-40' : '',
            ]"
            @click="handleSelect(option)"
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
        <p class="text-xs text-muted-foreground">{{ footerText }}</p>
        <Button type="button" @click="emit('update:open', false)">
          {{ t("deckRecommend.picker.done") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
