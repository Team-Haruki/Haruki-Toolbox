<script setup lang="ts">
import { computed, ref, toRef } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useI18n } from "vue-i18n"
import { ChevronsUpDown } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import CatalogChipsField from "@/shared/components/catalog/CatalogChipsField.vue"
import CatalogFilterPanel from "@/shared/components/catalog/CatalogFilterPanel.vue"
import CatalogSearchField from "@/shared/components/catalog/CatalogSearchField.vue"
import CatalogSelectField from "@/shared/components/catalog/CatalogSelectField.vue"
import type { CatalogFieldOption } from "@/shared/components/catalog/types"
import { useMusicAliasMatches } from "@/shared/sekai/music-alias"
import { useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import { useSettingsStore } from "@/shared/stores/settings"
import {
  MUSIC_CHARACTER_FILTER_SCOPES,
  MUSIC_DIFFICULTIES,
  MUSIC_DIFFICULTY_COLORS,
  MUSIC_SORT_KEYS,
  MusicJacket,
  createDefaultMusicLibraryFilter,
  excludeUnreleasedMusicEntries,
  filterMusicEntries,
  isMusicDifficulty,
  isMusicEntryUnreleased,
  resolveMusicJacketUrl,
  resolveMusicTagLabelKey,
  sortMusicEntries,
  useMusicLibraryList,
  type MusicCharacterFilterScope,
  type MusicDifficulty,
  type MusicLibraryEntry,
  type MusicLibraryFilter,
  type MusicSortDirection,
  type MusicSortKey,
} from "@/modules/music-library"

const props = defineProps<{
  modelValue: string | null
  difficultyValue: string | null
  region: SekaiRegion
  disabled?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: string | null]
  "update:difficultyValue": [value: string | null]
}>()

const { t, te } = useI18n()
const settingsStore = useSettingsStore()
const regionRef = toRef(props, "region")
const { hideUnreleased, blurUnreleased } = useUnreleasedContentDisplay()
const {
  entries,
  characterMap,
  musicEventBoxes,
  musicVocalCharacters,
  tagOptions,
  yearOptions,
  loading,
} = useMusicLibraryList(regionRef)

const open = ref(false)

// Catalog-grade filters, mirroring the music library list.
const search = ref("")
const { matchedIds: aliasMatchedIds, pending: aliasPending } = useMusicAliasMatches(search)
const filterDifficulty = ref<MusicDifficulty | null>(null)
const levelMin = ref<number | undefined>(undefined)
const levelMax = ref<number | undefined>(undefined)
const selectedTags = ref<string[]>([])
const selectedYear = ref<number | null>(null)
const filterCharacterId = ref<number | null>(null)
const characterScope = ref<MusicCharacterFilterScope>("any")
const sortKey = ref<MusicSortKey>("publishedAt")
const sortDirection = ref<MusicSortDirection>("desc")

const filter = computed<MusicLibraryFilter>(() => ({
  ...createDefaultMusicLibraryFilter(),
  search: search.value,
  difficulty: filterDifficulty.value,
  levelMin: toNullableNumber(levelMin.value),
  levelMax: toNullableNumber(levelMax.value),
  tags: selectedTags.value,
  year: selectedYear.value,
  characterId: filterCharacterId.value,
  characterScope: characterScope.value,
}))

const visibleEntries = computed(() => {
  const filtered = filterMusicEntries(entries.value, filter.value, {
    eventBoxes: musicEventBoxes.value,
    vocalCharacters: musicVocalCharacters.value,
    aliasMatchedIds: aliasMatchedIds.value,
  })
  return sortMusicEntries(
    hideUnreleased.value ? excludeUnreleasedMusicEntries(filtered) : filtered,
    sortKey.value,
    sortDirection.value,
    filterDifficulty.value,
  )
})

const entryById = computed(() => new Map(entries.value.map((entry) => [entry.id, entry])))
const selectedEntry = computed(() => {
  const id = props.modelValue != null ? Number(props.modelValue) : null
  return id != null && Number.isFinite(id) ? entryById.value.get(id) ?? null : null
})

const difficultyOptions = computed(() => {
  const entry = selectedEntry.value
  if (entry == null) {
    return []
  }

  return MUSIC_DIFFICULTIES
    .filter((difficulty) => entry.difficulties[difficulty] != null)
    .map((difficulty) => ({
      value: difficulty,
      label: formatDifficultyOptionLabel(entry, difficulty),
      color: MUSIC_DIFFICULTY_COLORS[difficulty],
    }))
})

const difficultyFieldOptions = computed<CatalogFieldOption[]>(() =>
  MUSIC_DIFFICULTIES.map((difficulty) => ({
    value: difficulty,
    label: difficultyLabel(difficulty),
    color: MUSIC_DIFFICULTY_COLORS[difficulty],
  })),
)

const tagFieldOptions = computed<CatalogFieldOption[]>(() =>
  tagOptions.value.map((tag) => ({ value: tag, label: tagLabel(tag) })),
)

const characterFieldOptions = computed<CatalogFieldOption[]>(() =>
  [...characterMap.value.values()]
    .sort((a, b) => a.id - b.id)
    .map((character) => ({
      value: String(character.id),
      label: character.name,
      iconUrl: character.iconUrl,
    })),
)

const yearFieldOptions = computed<CatalogFieldOption[]>(() =>
  yearOptions.value.map((year) => ({ value: String(year), label: String(year) })),
)

function selectEntry(entry: MusicLibraryEntry, difficulty?: MusicDifficulty) {
  emit("update:modelValue", String(entry.id))
  // Keep the current difficulty when the newly picked music also has it.
  const current = props.difficultyValue
  const preserved = difficulty
    ?? (isMusicDifficulty(current) && entry.difficulties[current] != null ? current : null)
  emit("update:difficultyValue", preserved)
  open.value = false
}

function handleDifficultyUpdate(value: AcceptableValue) {
  emit("update:difficultyValue", typeof value === "string" && value ? value : null)
}

function resetFilters() {
  search.value = ""
  filterDifficulty.value = null
  levelMin.value = undefined
  levelMax.value = undefined
  selectedTags.value = []
  selectedYear.value = null
  filterCharacterId.value = null
  characterScope.value = "any"
  sortKey.value = "publishedAt"
  sortDirection.value = "desc"
}

function updateFilterDifficulty(value: string | null) {
  filterDifficulty.value = value != null && isMusicDifficulty(value) ? value : null
}

function updateYear(value: string | null) {
  const parsed = value != null ? Number(value) : null
  selectedYear.value = parsed != null && Number.isInteger(parsed) ? parsed : null
}

function updateCharacter(value: string | null) {
  const parsed = value != null ? Number(value) : null
  filterCharacterId.value = parsed != null && Number.isInteger(parsed) ? parsed : null
}

function updateCharacterScope(value: AcceptableValue) {
  characterScope.value = typeof value === "string"
    && (MUSIC_CHARACTER_FILTER_SCOPES as readonly string[]).includes(value)
    ? value as MusicCharacterFilterScope
    : "any"
}

function updateSortKey(value: string | null) {
  if (value != null && (MUSIC_SORT_KEYS as readonly string[]).includes(value)) {
    sortKey.value = value as MusicSortKey
  }
}

function updateSortDirection(value: AcceptableValue) {
  sortDirection.value = value === "asc" ? "asc" : "desc"
}

function jacketUrl(entry: MusicLibraryEntry): string | null {
  return resolveMusicJacketUrl(props.region, entry.assetbundleName, settingsStore.currentAssetEndpoint)
}

function entryDifficultyBadges(entry: MusicLibraryEntry) {
  return MUSIC_DIFFICULTIES
    .filter((difficulty) => entry.difficulties[difficulty] != null)
    .map((difficulty) => ({
      difficulty,
      color: MUSIC_DIFFICULTY_COLORS[difficulty],
      playLevel: entry.difficulties[difficulty]?.playLevel ?? null,
    }))
}

function formatDifficultyOptionLabel(entry: MusicLibraryEntry, difficulty: MusicDifficulty): string {
  const playLevel = entry.difficulties[difficulty]?.playLevel
  const display = difficulty.toUpperCase()
  return playLevel != null ? `${display} Lv.${playLevel}` : display
}

function difficultyLabel(difficulty: MusicDifficulty): string {
  return t(`musicLibrary.difficulty.${difficulty}`)
}

function tagLabel(tag: string): string {
  const key = resolveMusicTagLabelKey(tag)
  return key && te(key) ? t(key) : tag
}

function toNullableNumber(value: number | string | undefined | null): number | null {
  if (value == null || String(value).trim() === "") {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
</script>

<template>
  <div class="grid gap-3 md:grid-cols-2">
    <Button
      type="button"
      variant="outline"
      class="h-auto min-h-9 w-full justify-between gap-2 px-2.5 py-1.5 font-normal"
      :disabled="props.disabled || loading"
      @click="open = true"
    >
      <span v-if="selectedEntry" class="flex min-w-0 items-center gap-2">
        <MusicJacket
          :url="jacketUrl(selectedEntry)"
          :alt="selectedEntry.title"
          class="size-8 shrink-0 rounded"
        />
        <span class="min-w-0 text-left">
          <span class="block truncate text-sm">{{ selectedEntry.title }}</span>
          <span class="block text-xs text-muted-foreground">#{{ selectedEntry.id }}</span>
        </span>
      </span>
      <span v-else class="truncate text-sm text-muted-foreground">
        {{ loading ? t("deckRecommend.select.loading") : t("deckRecommend.form.musicPlaceholder") }}
      </span>
      <ChevronsUpDown class="size-4 shrink-0 text-muted-foreground" />
    </Button>

    <Select
      :model-value="props.difficultyValue ?? ''"
      :disabled="props.disabled || !props.modelValue || difficultyOptions.length === 0"
      @update:model-value="handleDifficultyUpdate"
    >
      <SelectTrigger class="w-full md:!h-full md:min-h-9">
        <SelectValue :placeholder="t('deckRecommend.form.difficultyPlaceholder')" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="option in difficultyOptions" :key="option.value" :value="option.value">
          <span class="flex items-center gap-2">
            <span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: option.color }" />
            {{ option.label }}
          </span>
        </SelectItem>
      </SelectContent>
    </Select>

    <Dialog v-model:open="open">
      <DialogContent class="flex max-h-[85vh] flex-col gap-3 overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{{ t("deckRecommend.picker.musicDialogTitle") }}</DialogTitle>
        </DialogHeader>

        <CatalogSearchField
          v-model="search"
          :label="t('musicLibrary.list.filters.search')"
          :placeholder="t('musicLibrary.list.filters.searchPlaceholder')"
        />

        <CatalogFilterPanel
          :title="t('musicLibrary.list.filters.title')"
          :count-label="t('musicLibrary.list.results.count', { count: visibleEntries.length })"
          :reset-label="t('musicLibrary.list.filters.reset')"
          @reset="resetFilters"
        >
          <CatalogSelectField
            :label="t('musicLibrary.list.filters.difficulty')"
            :all-label="t('musicLibrary.list.filters.difficultyAll')"
            :options="difficultyFieldOptions"
            :model-value="filterDifficulty"
            @update:model-value="updateFilterDifficulty"
          />

          <div class="grid gap-2">
            <Label>{{ t("musicLibrary.list.filters.level") }}</Label>
            <div class="flex items-center gap-2">
              <Input
                v-model.number="levelMin"
                type="number"
                min="1"
                inputmode="numeric"
                :placeholder="t('musicLibrary.list.filters.levelMin')"
              />
              <span class="text-muted-foreground">-</span>
              <Input
                v-model.number="levelMax"
                type="number"
                min="1"
                inputmode="numeric"
                :placeholder="t('musicLibrary.list.filters.levelMax')"
              />
            </div>
          </div>

          <div class="grid gap-2">
            <Label>{{ t("musicLibrary.list.filters.character") }}</Label>
            <div class="flex items-center gap-2">
              <Select
                :model-value="filterCharacterId != null ? String(filterCharacterId) : '__all__'"
                @update:model-value="(value: AcceptableValue) =>
                  updateCharacter(typeof value === 'string' && value !== '__all__' ? value : null)"
              >
                <SelectTrigger class="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">
                    {{ t("musicLibrary.list.filters.characterAll") }}
                  </SelectItem>
                  <SelectItem
                    v-for="option in characterFieldOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    <span class="flex items-center gap-2">
                      <img
                        v-if="option.iconUrl"
                        :src="option.iconUrl"
                        alt=""
                        class="size-4 shrink-0 rounded-full"
                        loading="lazy"
                      >
                      {{ option.label }}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                :model-value="characterScope"
                :disabled="filterCharacterId == null"
                @update:model-value="updateCharacterScope"
              >
                <SelectTrigger class="w-32 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="scope in MUSIC_CHARACTER_FILTER_SCOPES"
                    :key="scope"
                    :value="scope"
                  >
                    {{ t(`musicLibrary.list.filters.characterScope.${scope}`) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <CatalogChipsField
            v-model="selectedTags"
            :label="t('musicLibrary.list.filters.tag')"
            :options="tagFieldOptions"
          />

          <CatalogSelectField
            :label="t('musicLibrary.list.filters.year')"
            :all-label="t('musicLibrary.list.filters.yearAll')"
            :options="yearFieldOptions"
            :model-value="selectedYear != null ? String(selectedYear) : null"
            @update:model-value="updateYear"
          />

          <div class="grid gap-2">
            <Label>{{ t("musicLibrary.list.filters.sort") }}</Label>
            <div class="flex items-center gap-2">
              <Select
                :model-value="sortKey"
                @update:model-value="(value: AcceptableValue) => updateSortKey(typeof value === 'string' ? value : null)"
              >
                <SelectTrigger class="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="key in MUSIC_SORT_KEYS" :key="key" :value="key">
                    {{ t(`musicLibrary.list.sort.${key}`) }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select :model-value="sortDirection" @update:model-value="updateSortDirection">
                <SelectTrigger class="w-24 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">{{ t("musicLibrary.list.filters.sortDirection.desc") }}</SelectItem>
                  <SelectItem value="asc">{{ t("musicLibrary.list.filters.sortDirection.asc") }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CatalogFilterPanel>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <div
            v-if="visibleEntries.length > 0"
            class="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6"
          >
            <button
              v-for="entry in visibleEntries"
              :key="entry.id"
              type="button"
              :class="[
                'group flex flex-col gap-1.5 rounded-lg border bg-card p-2 text-left transition-colors hover:bg-accent/50 dark:hover:bg-accent/30',
                selectedEntry?.id === entry.id ? 'ring-2 ring-primary' : '',
              ]"
              @click="selectEntry(entry)"
            >
              <div class="relative aspect-square w-full overflow-hidden rounded-md">
                <MusicJacket
                  :url="jacketUrl(entry)"
                  :alt="entry.title"
                  class="size-full"
                  :class="isMusicEntryUnreleased(entry) && blurUnreleased ? 'blur-md scale-105' : ''"
                />
                <span
                  v-if="isMusicEntryUnreleased(entry)"
                  class="absolute right-1 top-1 rounded bg-red-600 px-1 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm"
                >
                  {{ t("sekaiUnreleased.badge") }}
                </span>
              </div>
              <p class="truncate text-xs font-medium" :title="entry.title">{{ entry.title }}</p>
              <div class="mt-auto flex flex-wrap gap-1">
                <span
                  v-for="item in entryDifficultyBadges(entry)"
                  :key="item.difficulty"
                  class="inline-flex min-w-6 cursor-pointer items-center justify-center rounded px-1 py-0.5 text-[10px] font-semibold text-white hover:opacity-80"
                  :style="{ backgroundColor: item.color }"
                  :title="difficultyLabel(item.difficulty)"
                  @click.stop="selectEntry(entry, item.difficulty)"
                >
                  {{ item.playLevel ?? "-" }}
                </span>
              </div>
            </button>
          </div>
          <div
            v-else
            class="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground"
          >
            {{
              loading
                ? t("deckRecommend.select.loading")
                : aliasPending
                  ? t("musicLibrary.list.results.aliasSearching")
                  : t("musicLibrary.list.results.empty")
            }}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
