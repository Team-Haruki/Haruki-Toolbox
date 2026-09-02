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
 *
 * Laid out as two labelled groups of full-width rows rather than a column
 * grid: difficulty scopes both the level range and the note count
 * (`resolveCandidateStats`), so those three belong together and read as one
 * unit, while a grid of unequal-height widgets left ragged baselines and a
 * hole wherever the row ran out of controls. Every row is `muted label +
 * control`, the same rhythm as the other catalog filter panels.
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

/** Toggle-group value standing in for "no difficulty filter". */
const ANY_DIFFICULTY = "__any__"

const difficultyModel = computed(() => props.state.diff ?? ANY_DIFFICULTY)

function updateDifficulty(value: AcceptableValue | AcceptableValue[] | undefined) {
  // Anything that is not a difficulty — the "all" chip, or deselecting the
  // active one — clears the filter.
  props.state.diff = typeof value === "string" && isMusicDifficulty(value) ? value : null
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

// --- Year -------------------------------------------------------------------

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
  <!-- Chart: difficulty scopes the level and note-count filters below it. -->
  <div class="grid gap-3" role="group" :aria-labelledby="`${id}-chart-group`">
    <p :id="`${id}-chart-group`" class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
      {{ t("musicCatalog.filters.chartGroup") }}
    </p>

    <div class="flex flex-wrap items-center gap-1.5">
      <p :id="`${id}-difficulty-label`" class="mr-1 min-w-14 text-xs font-medium text-muted-foreground">
        {{ t("musicLibrary.list.filters.difficulty") }}
      </p>
      <ToggleGroup
        type="single"
        variant="chip"
        size="sm"
        :model-value="difficultyModel"
        :aria-labelledby="`${id}-difficulty-label`"
        @update:model-value="updateDifficulty"
      >
        <ToggleGroupItem :value="ANY_DIFFICULTY">
          {{ t("musicLibrary.list.filters.difficultyAll") }}
        </ToggleGroupItem>
        <ToggleGroupItem v-for="option in difficultyOptions" :key="option.value" :value="option.value">
          <span
            v-if="option.color"
            class="size-2.5 shrink-0 rounded-full"
            :style="{ backgroundColor: option.color }"
            aria-hidden="true"
          />
          {{ option.label }}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>

    <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
      <p :id="`${id}-level-label`" class="mr-1 min-w-14 text-xs font-medium text-muted-foreground">
        {{ t("musicLibrary.list.filters.level") }}
      </p>
      <!-- Capped: a slider stretched over the whole panel is unreadable. -->
      <div class="flex min-w-48 flex-1 items-center gap-3 sm:max-w-sm">
        <Slider
          :model-value="levelModel"
          :min="sliderBounds.min"
          :max="sliderBounds.max"
          :step="1"
          :min-steps-between-thumbs="0"
          :aria-labelledby="`${id}-level-label`"
          class="flex-1"
          @update:model-value="handleLevelInput"
          @value-commit="commitLevel"
        />
        <span class="shrink-0 text-xs text-muted-foreground tabular-nums">{{ levelSummary }}</span>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
      <p :id="`${id}-notes-label`" class="mr-1 min-w-14 text-xs font-medium text-muted-foreground">
        {{ t("musicLibrary.list.filters.noteCount") }}
      </p>
      <ToggleGroup
        type="single"
        variant="segment"
        size="sm"
        :model-value="state.notes.mode"
        :aria-labelledby="`${id}-notes-label`"
        class="shrink-0"
        @update:model-value="updateNoteMode"
      >
        <ToggleGroupItem v-for="mode in MUSIC_NOTE_COUNT_FILTER_MODES" :key="mode" :value="mode">
          {{ t(`musicLibrary.list.filters.noteCountMode.${mode}`) }}
        </ToggleGroupItem>
      </ToggleGroup>
      <Input
        v-if="state.notes.mode === 'exact'"
        type="number"
        min="1"
        inputmode="numeric"
        class="h-8 w-28"
        :model-value="state.notes.exact ?? ''"
        :placeholder="t('musicLibrary.list.filters.noteCountExactPlaceholder')"
        :aria-label="t('musicLibrary.list.filters.noteCountExactPlaceholder')"
        @input="updateNoteField('exact', $event)"
      />
      <template v-else>
        <Input
          type="number"
          min="1"
          inputmode="numeric"
          class="h-8 w-24"
          :model-value="state.notes.min ?? ''"
          :placeholder="t('musicLibrary.list.filters.noteCountMin')"
          :aria-label="t('musicLibrary.list.filters.noteCountMin')"
          @input="updateNoteField('min', $event)"
        />
        <span class="text-xs text-muted-foreground">–</span>
        <Input
          type="number"
          min="1"
          inputmode="numeric"
          class="h-8 w-24"
          :model-value="state.notes.max ?? ''"
          :placeholder="t('musicLibrary.list.filters.noteCountMax')"
          :aria-label="t('musicLibrary.list.filters.noteCountMax')"
          @input="updateNoteField('max', $event)"
        />
      </template>
    </div>

    <div class="flex items-center gap-2">
      <Switch
        :id="`${id}-append`"
        :model-value="state.append"
        @update:model-value="state.append = $event"
      />
      <Label :for="`${id}-append`" class="cursor-pointer text-xs font-normal text-muted-foreground">
        {{ t("musicCatalog.filters.appendOnly") }}
      </Label>
    </div>
  </div>

  <!-- Song: what the track is, rather than how it plays. -->
  <div class="grid gap-3 border-t pt-4" role="group" :aria-labelledby="`${id}-song-group`">
    <p :id="`${id}-song-group`" class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
      {{ t("musicCatalog.filters.songGroup") }}
    </p>

    <CatalogChipsField
      v-model="state.tags"
      :label="t('musicLibrary.list.filters.tag')"
      :options="tagOptions"
      compact
    />

    <CatalogChipsField
      v-if="hasCategories && categoryOptions.length > 0"
      v-model="state.mv"
      :label="t('musicCatalog.filters.mvType')"
      :options="categoryOptions"
      compact
    />

    <CatalogSelectField
      :label="t('musicLibrary.list.filters.year')"
      :all-label="t('catalog.year.all')"
      :options="yearOptions"
      :model-value="state.year != null ? String(state.year) : null"
      compact
      @update:model-value="updateYear"
    />

    <div class="grid gap-2">
      <CatalogCharacterPicker
        v-model="pickerModel"
        :label="t('musicLibrary.list.filters.character')"
        :characters="characters"
        :unit-color-map="unitColorMap"
      />
      <!-- The scope only exists once a character is picked; until then the row
           explains why it is missing rather than showing a dead control. -->
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <template v-if="state.char != null">
          <p :id="`${id}-scope-label`" class="mr-1 min-w-14 text-xs font-medium text-muted-foreground">
            {{ t("musicCatalog.filters.scope") }}
          </p>
          <ToggleGroup
            type="single"
            variant="segment"
            size="sm"
            :model-value="state.scope"
            :aria-labelledby="`${id}-scope-label`"
            @update:model-value="updateScope"
          >
            <ToggleGroupItem v-for="scope in MUSIC_CHARACTER_FILTER_SCOPES" :key="scope" :value="scope">
              {{ t(`musicLibrary.list.filters.characterScope.${scope}`) }}
            </ToggleGroupItem>
          </ToggleGroup>
        </template>
        <p v-else class="text-xs text-muted-foreground">{{ t("musicCatalog.filters.scopeHint") }}</p>
      </div>
    </div>
  </div>
</template>
