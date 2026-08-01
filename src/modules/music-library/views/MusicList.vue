<script setup lang="ts">
import { computed, ref } from "vue"
import { RouterLink } from "vue-router"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Library,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import CatalogChipsField from "@/shared/components/catalog/CatalogChipsField.vue"
import CatalogFilterPanel from "@/shared/components/catalog/CatalogFilterPanel.vue"
import CatalogSearchField from "@/shared/components/catalog/CatalogSearchField.vue"
import CatalogSelectField from "@/shared/components/catalog/CatalogSelectField.vue"
import type { CatalogFieldOption } from "@/shared/components/catalog/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { resolveSekaiRegionLabel, SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import { getI18nLocale } from "@/shared/i18n"
import { useSettingsStore } from "@/shared/stores/settings"
import { SEKAI_CATALOG_REGION_FOLLOW_VALUE, useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import { useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import { useMusicAliasMatches } from "@/shared/sekai/music-alias"
import MusicJacket from "../components/MusicJacket.vue"
import { useMusicLibraryList } from "../composables/useMusicLibraryList"
import { resolveMusicJacketUrl } from "../lib/music-assets"
import {
  MUSIC_DIFFICULTIES,
  MUSIC_DIFFICULTY_COLORS,
  isMusicDifficulty,
  type MusicDifficulty,
} from "../lib/music-difficulties"
import { resolveMusicTagLabelKey } from "../lib/music-labels"
import type { MusicLibraryEntry } from "../lib/music-data"
import {
  MUSIC_CHARACTER_FILTER_SCOPES,
  MUSIC_NOTE_COUNT_FILTER_MODES,
  MUSIC_SORT_KEYS,
  createDefaultMusicLibraryFilter,
  excludeUnreleasedMusicEntries,
  filterMusicEntries,
  isMusicEntryUnreleased,
  sortMusicEntries,
  type MusicCharacterFilterScope,
  type MusicLibraryFilter,
  type MusicNoteCountFilterMode,
  type MusicSortDirection,
  type MusicSortKey,
} from "../lib/music-filter"

const ALL_OPTION = "all"

const { t, te, locale } = useI18n()
const settingsStore = useSettingsStore()

const { region, selectorValue: regionSelectorValue, updateSelectorValue: updateRegionSelector } = useEffectiveCatalogRegion()
const { hideUnreleased, blurUnreleased } = useUnreleasedContentDisplay()
const {
  entries,
  characterMap,
  musicEventBoxes,
  musicVocalCharacters,
  tagOptions,
  yearOptions,
  loading,
  error,
  regionState,
} = useMusicLibraryList(region)

const search = ref("")
const { matchedIds: aliasMatchedIds, pending: aliasPending } = useMusicAliasMatches(search)
const selectedDifficulty = ref<MusicDifficulty | null>(null)
const levelMin = ref<number | undefined>(undefined)
const levelMax = ref<number | undefined>(undefined)
const noteCountMode = ref<MusicNoteCountFilterMode>("exact")
const noteCountExact = ref<number | undefined>(undefined)
const noteCountMin = ref<number | undefined>(undefined)
const noteCountMax = ref<number | undefined>(undefined)
const selectedTags = ref<string[]>([])
const selectedYear = ref<number | null>(null)
const selectedCharacterId = ref<number | null>(null)
const characterScope = ref<MusicCharacterFilterScope>("any")
const sortKey = ref<MusicSortKey>("publishedAt")
const sortDirection = ref<MusicSortDirection>("desc")

const filter = computed<MusicLibraryFilter>(() => ({
  ...createDefaultMusicLibraryFilter(),
  search: search.value,
  difficulty: selectedDifficulty.value,
  levelMin: toNullableNumber(levelMin.value),
  levelMax: toNullableNumber(levelMax.value),
  noteCountMode: noteCountMode.value,
  noteCountExact: toNullableNumber(noteCountExact.value),
  noteCountMin: toNullableNumber(noteCountMin.value),
  noteCountMax: toNullableNumber(noteCountMax.value),
  tags: selectedTags.value,
  year: selectedYear.value,
  characterId: selectedCharacterId.value,
  characterScope: characterScope.value,
}))

const characterOptions = computed(() =>
  [...characterMap.value.values()].sort((a, b) => a.id - b.id),
)

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
  characterOptions.value.map((character) => ({
    value: String(character.id),
    label: character.name,
    iconUrl: character.iconUrl,
  })),
)

const yearFieldOptions = computed<CatalogFieldOption[]>(() =>
  yearOptions.value.map((year) => ({ value: String(year), label: String(year) })),
)

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
    selectedDifficulty.value,
  )
})

const showSkeleton = computed(() => loading.value && entries.value.length === 0)
const showDownloadProgress = computed(
  () => regionState.value.refreshing && entries.value.length === 0,
)
const dateFormatter = computed(() =>
  new Intl.DateTimeFormat(locale.value || getI18nLocale(), { dateStyle: "medium" }),
)

function updateRegion(value: AcceptableValue) {
  updateRegionSelector(value)
}

function updateDifficulty(value: string | null) {
  selectedDifficulty.value = value != null && isMusicDifficulty(value) ? value : null
}

function updateNoteCountMode(value: AcceptableValue) {
  noteCountMode.value = value === "range" ? "range" : "exact"
}

function updateYear(value: string | null) {
  const parsed = value != null ? Number(value) : null
  selectedYear.value = parsed != null && Number.isInteger(parsed) ? parsed : null
}

function updateCharacter(value: string | null) {
  const parsed = value != null ? Number(value) : null
  selectedCharacterId.value = parsed != null && Number.isInteger(parsed) ? parsed : null
}

function updateCharacterScope(value: AcceptableValue) {
  characterScope.value = typeof value === "string"
    && (MUSIC_CHARACTER_FILTER_SCOPES as readonly string[]).includes(value)
    ? value as MusicCharacterFilterScope
    : "any"
}

function updateSortKey(value: AcceptableValue) {
  if (typeof value === "string" && (MUSIC_SORT_KEYS as readonly string[]).includes(value)) {
    sortKey.value = value as MusicSortKey
  }
}

function toggleSortDirection() {
  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc"
}

function resetFilters() {
  search.value = ""
  selectedDifficulty.value = null
  levelMin.value = undefined
  levelMax.value = undefined
  noteCountMode.value = "exact"
  noteCountExact.value = undefined
  noteCountMin.value = undefined
  noteCountMax.value = undefined
  selectedTags.value = []
  selectedYear.value = null
  selectedCharacterId.value = null
  characterScope.value = "any"
  sortKey.value = "publishedAt"
  sortDirection.value = "desc"
}

function jacketUrl(entry: MusicLibraryEntry): string | null {
  return resolveMusicJacketUrl(region.value, entry.assetbundleName, settingsStore.currentAssetEndpoint)
}

/** "某角色几箱活动曲" hint when the entry is a known event song. */
function entryEventBox(entry: MusicLibraryEntry) {
  const info = musicEventBoxes.value.get(entry.id)
  if (info == null) {
    return null
  }

  const character = characterMap.value.get(info.characterId) ?? null
  if (character == null) {
    return null
  }

  return {
    name: character.name,
    iconUrl: character.iconUrl,
    boxNumber: info.boxNumber,
  }
}

function entryDifficulties(entry: MusicLibraryEntry) {
  return MUSIC_DIFFICULTIES
    .filter((difficulty) => entry.difficulties[difficulty] != null)
    .map((difficulty) => ({
      difficulty,
      color: MUSIC_DIFFICULTY_COLORS[difficulty],
      playLevel: entry.difficulties[difficulty]?.playLevel ?? null,
    }))
}

function difficultyLabel(difficulty: MusicDifficulty): string {
  return t(`musicLibrary.difficulty.${difficulty}`)
}

function tagLabel(tag: string): string {
  const key = resolveMusicTagLabelKey(tag)
  return key && te(key) ? t(key) : tag
}

function formatDateLabel(timestamp: number | null): string | null {
  if (timestamp == null) {
    return null
  }

  return dateFormatter.value.format(new Date(timestamp))
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
  <div class="flex w-full flex-1 items-center justify-center px-0 py-4">
    <div class="mx-auto w-full max-w-6xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle class="flex flex-wrap items-center gap-2 text-lg">
            <Library class="size-5" />
            {{ t("musicLibrary.list.title") }}
          </CardTitle>
          <CardDescription>{{ t("musicLibrary.list.description") }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="grid gap-2">
              <Label>{{ t("musicLibrary.list.filters.region") }}</Label>
              <Select :model-value="regionSelectorValue" @update:model-value="updateRegion">
                <SelectTrigger class="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="SEKAI_CATALOG_REGION_FOLLOW_VALUE">
                    {{ t("sekaiRegion.followAccount") }}
                  </SelectItem>
                  <SelectItem
                    v-for="option in SEKAI_REGION_OPTIONS"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ resolveSekaiRegionLabel(option.value, t) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <CatalogSearchField
              v-model="search"
              :label="t('musicLibrary.list.filters.search')"
              :placeholder="t('musicLibrary.list.filters.searchPlaceholder')"
            />
          </div>

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
                :model-value="selectedDifficulty"
                @update:model-value="updateDifficulty"
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
                <Label>{{ t("musicLibrary.list.filters.noteCount") }}</Label>
                <div class="flex items-center gap-2">
                  <Select
                    :model-value="noteCountMode"
                    @update:model-value="updateNoteCountMode"
                  >
                    <SelectTrigger class="w-28 shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="mode in MUSIC_NOTE_COUNT_FILTER_MODES"
                        :key="mode"
                        :value="mode"
                      >
                        {{ t(`musicLibrary.list.filters.noteCountMode.${mode}`) }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <template v-if="noteCountMode === 'exact'">
                    <Input
                      v-model.number="noteCountExact"
                      type="number"
                      min="1"
                      inputmode="numeric"
                      :placeholder="t('musicLibrary.list.filters.noteCountExactPlaceholder')"
                    />
                  </template>
                  <template v-else>
                    <Input
                      v-model.number="noteCountMin"
                      type="number"
                      min="1"
                      inputmode="numeric"
                      :placeholder="t('musicLibrary.list.filters.noteCountMin')"
                    />
                    <span class="text-muted-foreground">-</span>
                    <Input
                      v-model.number="noteCountMax"
                      type="number"
                      min="1"
                      inputmode="numeric"
                      :placeholder="t('musicLibrary.list.filters.noteCountMax')"
                    />
                  </template>
                </div>
              </div>

              <CatalogChipsField
                v-model="selectedTags"
                :label="t('musicLibrary.list.filters.tag')"
                :options="tagFieldOptions"
              />

              <div class="grid gap-2">
                <Label>{{ t("musicLibrary.list.filters.character") }}</Label>
                <div class="flex items-center gap-2">
                  <Select
                    :model-value="selectedCharacterId != null ? String(selectedCharacterId) : ALL_OPTION"
                    @update:model-value="(value: AcceptableValue) =>
                      updateCharacter(typeof value === 'string' && value !== ALL_OPTION ? value : null)"
                  >
                    <SelectTrigger class="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem :value="ALL_OPTION">
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
                    :disabled="selectedCharacterId == null"
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
                  <Select :model-value="sortKey" @update:model-value="updateSortKey">
                    <SelectTrigger class="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="key in MUSIC_SORT_KEYS" :key="key" :value="key">
                        {{ t(`musicLibrary.list.sort.${key}`) }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    class="shrink-0"
                    :aria-label="t(`musicLibrary.list.filters.sortDirection.${sortDirection}`)"
                    :title="t(`musicLibrary.list.filters.sortDirection.${sortDirection}`)"
                    @click="toggleSortDirection"
                  >
                    <ArrowUp v-if="sortDirection === 'asc'" class="size-4" />
                    <ArrowDown v-else class="size-4" />
                  </Button>
                </div>
              </div>
          </CatalogFilterPanel>

          <div
            v-if="showDownloadProgress"
            class="grid gap-2 rounded-md border bg-muted/20 p-3"
          >
            <p class="text-xs text-muted-foreground">
              {{ t("musicLibrary.list.downloading", { progress: Math.round(regionState.progress) }) }}
            </p>
            <Progress :model-value="regionState.progress" />
          </div>

          <p v-if="error" class="text-sm text-destructive">
            {{ t("musicLibrary.list.loadError", { message: error }) }}
          </p>
        </CardContent>
      </Card>

      <div
        v-if="showSkeleton"
        class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      >
        <div v-for="index in 8" :key="index" class="space-y-2 rounded-lg border p-3">
          <Skeleton class="aspect-square w-full rounded-md" />
          <Skeleton class="h-4 w-3/4" />
          <Skeleton class="h-3 w-1/2" />
        </div>
      </div>

      <div
        v-else-if="visibleEntries.length > 0"
        class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      >
        <RouterLink
          v-for="entry in visibleEntries"
          :key="entry.id"
          :to="`/music/${entry.id}`"
          class="group flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-xs transition-colors hover:bg-accent/50 dark:hover:bg-accent/30"
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
          <div class="min-w-0 space-y-1">
            <p class="truncate text-sm font-medium" :title="entry.title">{{ entry.title }}</p>
            <p class="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays class="size-3.5 shrink-0" />
              {{ formatDateLabel(entry.publishedAt) ?? t("musicLibrary.list.unknownDate") }}
            </p>
            <p
              v-if="entryEventBox(entry)"
              class="flex items-center gap-1 truncate text-xs text-muted-foreground"
              :title="t('musicLibrary.eventBox.title', {
                name: entryEventBox(entry)!.name,
                count: entryEventBox(entry)!.boxNumber,
              })"
            >
              <img
                v-if="entryEventBox(entry)!.iconUrl"
                :src="entryEventBox(entry)!.iconUrl ?? undefined"
                alt=""
                class="size-3.5 shrink-0 rounded-full"
                loading="lazy"
              >
              <span class="truncate">
                {{ t("musicLibrary.eventBox.short", {
                  name: entryEventBox(entry)!.name,
                  count: entryEventBox(entry)!.boxNumber,
                }) }}
              </span>
            </p>
          </div>
          <div class="mt-auto flex flex-wrap gap-1">
            <span
              v-for="item in entryDifficulties(entry)"
              :key="item.difficulty"
              class="inline-flex min-w-7 items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-semibold text-white"
              :style="{ backgroundColor: item.color }"
              :title="difficultyLabel(item.difficulty)"
            >
              {{ item.playLevel ?? "-" }}
            </span>
          </div>
        </RouterLink>
      </div>

      <div
        v-else-if="!loading"
        class="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground"
      >
        {{ aliasPending ? t("musicLibrary.list.results.aliasSearching") : t("musicLibrary.list.results.empty") }}
      </div>
    </div>
  </div>
</template>
