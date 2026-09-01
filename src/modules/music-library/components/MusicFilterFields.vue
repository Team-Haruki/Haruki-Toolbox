<script setup lang="ts">
import { computed, ref, useId, watch } from "vue"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import CatalogCharacterPicker from "@/shared/components/catalog/CatalogCharacterPicker.vue"
import CatalogChipsField from "@/shared/components/catalog/CatalogChipsField.vue"
import CatalogSelectField from "@/shared/components/catalog/CatalogSelectField.vue"
import type { CatalogFieldOption } from "@/shared/components/catalog/types"
import type { CatalogCharacter, SekaiUnit } from "@/shared/sekai/catalog"
import { isMusicDifficulty } from "@/modules/music-library/lib/music-difficulties"
import {
  MUSIC_CHARACTER_FILTER_SCOPES,
  MUSIC_NOTE_COUNT_FILTER_MODES,
  type MusicCharacterFilterScope,
  type MusicNoteCountFilterMode,
} from "@/modules/music-library/lib/music-filter"
import type { MusicQueryState } from "@/modules/music-library/lib/music-query"

/**
 * The `/music` filter panel body. Writes straight into the page's reactive
 * query state (the URL is the state); the level slider only commits on
 * release so dragging does not churn the address bar.
 */
const props = defineProps<{
  state: MusicQueryState
  difficultyOptions: readonly CatalogFieldOption[]
  tagOptions: readonly CatalogFieldOption[]
  categoryOptions: readonly CatalogFieldOption[]
  yearOptions: readonly CatalogFieldOption[]
  characters: readonly CatalogCharacter[]
  unitColorMap: ReadonlyMap<SekaiUnit, string> | null
  levelBounds: { min: number; max: number } | null
  hasCategories: boolean
}>()

const { t } = useI18n()
const id = useId()

// --- Difficulty -------------------------------------------------------------

function updateDifficulty(value: string | null) {
  props.state.diff = value != null && isMusicDifficulty(value) ? value : null
}

// --- Level range (two-thumb slider, committed on release) -------------------

const sliderBounds = computed(() => props.levelBounds ?? { min: 1, max: 40 })
const levelModel = ref<number[]>([sliderBounds.value.min, sliderBounds.value.max])

watch(
  () => [props.state.lvmin, props.state.lvmax, sliderBounds.value.min, sliderBounds.value.max] as const,
  ([min, max, boundMin, boundMax]) => {
    levelModel.value = [min ?? boundMin, max ?? boundMax]
  },
  { immediate: true },
)

const levelSummary = computed(() => {
  const [low, high] = levelModel.value
  const { min, max } = sliderBounds.value
  if (low <= min && high >= max) {
    return t("musicCatalog.filters.levelAny")
  }
  return `Lv.${low}–${high}`
})

function commitLevel(value: number[] | undefined) {
  if (!value || value.length < 2) {
    return
  }
  const low = Math.min(value[0], value[1])
  const high = Math.max(value[0], value[1])
  const { min, max } = sliderBounds.value
  props.state.lvmin = low <= min ? null : low
  props.state.lvmax = high >= max ? null : high
}

function handleLevelInput(value: number[] | undefined) {
  if (value && value.length >= 2) {
    levelModel.value = [...value]
  }
}

// --- Note count -------------------------------------------------------------

function updateNoteMode(value: AcceptableValue | AcceptableValue[] | undefined) {
  const mode = (MUSIC_NOTE_COUNT_FILTER_MODES as readonly string[]).includes(String(value))
    ? (value as MusicNoteCountFilterMode)
    : "exact"
  props.state.notes = { ...props.state.notes, mode }
}

function parseCount(raw: string): number | null {
  const trimmed = raw.trim()
  if (!/^\d+$/.test(trimmed)) {
    return null
  }
  const parsed = Number(trimmed)
  return parsed >= 1 ? parsed : null
}

function updateNoteField(field: "exact" | "min" | "max", event: Event) {
  const raw = (event.target as HTMLInputElement).value
  props.state.notes = { ...props.state.notes, [field]: parseCount(raw) }
}

// --- Year / APPEND ----------------------------------------------------------

function updateYear(value: string | null) {
  const parsed = value != null ? Number(value) : null
  props.state.year = parsed != null && Number.isInteger(parsed) ? parsed : null
}

// --- Character + scope ------------------------------------------------------

const pickerModel = computed<number[]>({
  get: () => (props.state.char != null ? [props.state.char] : []),
  set: (ids) => {
    // Single-select on top of the shared multi-select picker: a newly added
    // id replaces the selection; deselecting the current one clears it.
    const next = ids.find((candidate) => candidate !== props.state.char) ?? null
    props.state.char = next
    if (next == null) {
      props.state.scope = "any"
    }
  },
})

function updateScope(value: AcceptableValue | AcceptableValue[] | undefined) {
  if (typeof value === "string" && (MUSIC_CHARACTER_FILTER_SCOPES as readonly string[]).includes(value)) {
    props.state.scope = value as MusicCharacterFilterScope
  }
}
</script>

<template>
  <CatalogSelectField
    :label="t('musicLibrary.list.filters.difficulty')"
    :all-label="t('musicLibrary.list.filters.difficultyAll')"
    :options="difficultyOptions"
    :model-value="state.diff"
    @update:model-value="updateDifficulty"
  />

  <div class="grid gap-2">
    <div class="flex items-center justify-between gap-2">
      <Label :id="`${id}-level-label`">{{ t("musicLibrary.list.filters.level") }}</Label>
      <span class="text-xs text-muted-foreground tabular-nums">{{ levelSummary }}</span>
    </div>
    <Slider
      :model-value="levelModel"
      :min="sliderBounds.min"
      :max="sliderBounds.max"
      :step="1"
      :min-steps-between-thumbs="0"
      :aria-labelledby="`${id}-level-label`"
      class="py-2"
      @update:model-value="handleLevelInput"
      @value-commit="commitLevel"
    />
  </div>

  <div class="grid gap-2">
    <Label :id="`${id}-notes-label`">{{ t("musicLibrary.list.filters.noteCount") }}</Label>
    <div class="flex items-center gap-2">
      <ToggleGroup
        type="single"
        variant="segment"
        size="default"
        :model-value="state.notes.mode"
        :aria-labelledby="`${id}-notes-label`"
        class="shrink-0"
        @update:model-value="updateNoteMode"
      >
        <ToggleGroupItem v-for="mode in MUSIC_NOTE_COUNT_FILTER_MODES" :key="mode" :value="mode">
          {{ t(`musicLibrary.list.filters.noteCountMode.${mode}`) }}
        </ToggleGroupItem>
      </ToggleGroup>
      <template v-if="state.notes.mode === 'exact'">
        <Input
          type="number"
          min="1"
          inputmode="numeric"
          :model-value="state.notes.exact ?? ''"
          :placeholder="t('musicLibrary.list.filters.noteCountExactPlaceholder')"
          :aria-label="t('musicLibrary.list.filters.noteCountExactPlaceholder')"
          @input="updateNoteField('exact', $event)"
        />
      </template>
      <template v-else>
        <Input
          type="number"
          min="1"
          inputmode="numeric"
          :model-value="state.notes.min ?? ''"
          :placeholder="t('musicLibrary.list.filters.noteCountMin')"
          :aria-label="t('musicLibrary.list.filters.noteCountMin')"
          @input="updateNoteField('min', $event)"
        />
        <span class="text-muted-foreground">–</span>
        <Input
          type="number"
          min="1"
          inputmode="numeric"
          :model-value="state.notes.max ?? ''"
          :placeholder="t('musicLibrary.list.filters.noteCountMax')"
          :aria-label="t('musicLibrary.list.filters.noteCountMax')"
          @input="updateNoteField('max', $event)"
        />
      </template>
    </div>
  </div>

  <CatalogSelectField
    :label="t('musicLibrary.list.filters.year')"
    :all-label="t('catalog.year.all')"
    :options="yearOptions"
    :model-value="state.year != null ? String(state.year) : null"
    @update:model-value="updateYear"
  />

  <div class="flex min-h-9 items-center justify-between gap-3 sm:self-end">
    <Label :for="`${id}-append`" class="cursor-pointer">{{ t("musicCatalog.filters.appendOnly") }}</Label>
    <Switch
      :id="`${id}-append`"
      :model-value="state.append"
      @update:model-value="state.append = $event"
    />
  </div>

  <CatalogChipsField
    v-model="state.tags"
    :label="t('musicLibrary.list.filters.tag')"
    :options="tagOptions"
  />

  <CatalogChipsField
    v-if="hasCategories && categoryOptions.length > 0"
    v-model="state.mv"
    :label="t('musicCatalog.filters.mvType')"
    :options="categoryOptions"
  />

  <div class="grid gap-2 sm:col-span-2 lg:col-span-3">
    <p class="text-sm font-medium">{{ t("musicLibrary.list.filters.character") }}</p>
    <CatalogCharacterPicker
      v-model="pickerModel"
      :characters="characters"
      :unit-color-map="unitColorMap"
    />
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-xs text-muted-foreground">
        {{ state.char != null ? t("musicCatalog.filters.scope") : t("musicCatalog.filters.scopeHint") }}
      </span>
      <ToggleGroup
        v-if="state.char != null"
        type="single"
        variant="segment"
        size="default"
        :model-value="state.scope"
        :aria-label="t('musicCatalog.filters.scope')"
        @update:model-value="updateScope"
      >
        <ToggleGroupItem v-for="scope in MUSIC_CHARACTER_FILTER_SCOPES" :key="scope" :value="scope">
          {{ t(`musicLibrary.list.filters.characterScope.${scope}`) }}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  </div>
</template>
