<script setup lang="ts">
import { computed, ref } from "vue"
import { RouterLink } from "vue-router"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Filter,
  Library,
  RotateCcw,
  Search,
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
  MUSIC_NOTE_COUNT_FILTER_MODES,
  MUSIC_SORT_KEYS,
  createDefaultMusicLibraryFilter,
  excludeUnreleasedMusicEntries,
  filterMusicEntries,
  isMusicEntryUnreleased,
  sortMusicEntries,
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
  tagOptions,
  yearOptions,
  loading,
  error,
  regionState,
} = useMusicLibraryList(region)

const search = ref("")
const selectedDifficulty = ref<MusicDifficulty | null>(null)
const levelMin = ref<number | undefined>(undefined)
const levelMax = ref<number | undefined>(undefined)
const noteCountMode = ref<MusicNoteCountFilterMode>("exact")
const noteCountExact = ref<number | undefined>(undefined)
const noteCountMin = ref<number | undefined>(undefined)
const noteCountMax = ref<number | undefined>(undefined)
const selectedTag = ref<string | null>(null)
const selectedYear = ref<number | null>(null)
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
  tag: selectedTag.value,
  year: selectedYear.value,
}))

const visibleEntries = computed(() => {
  const filtered = filterMusicEntries(entries.value, filter.value)
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

function updateDifficulty(value: AcceptableValue) {
  selectedDifficulty.value = typeof value === "string" && isMusicDifficulty(value) ? value : null
}

function updateNoteCountMode(value: AcceptableValue) {
  noteCountMode.value = value === "range" ? "range" : "exact"
}

function updateTag(value: AcceptableValue) {
  selectedTag.value = typeof value === "string" && value !== ALL_OPTION ? value : null
}

function updateYear(value: AcceptableValue) {
  const parsed = typeof value === "string" && value !== ALL_OPTION ? Number(value) : null
  selectedYear.value = parsed != null && Number.isInteger(parsed) ? parsed : null
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
  selectedTag.value = null
  selectedYear.value = null
  sortKey.value = "publishedAt"
  sortDirection.value = "desc"
}

function jacketUrl(entry: MusicLibraryEntry): string | null {
  return resolveMusicJacketUrl(region.value, entry.assetbundleName, settingsStore.currentAssetEndpoint)
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
  <div class="flex w-full flex-1 justify-center px-0 py-4">
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

            <div class="grid gap-2">
              <Label for="music-library-search">{{ t("musicLibrary.list.filters.search") }}</Label>
              <div class="relative w-full items-center">
                <Input
                  id="music-library-search"
                  v-model="search"
                  class="pl-10"
                  type="text"
                  :placeholder="t('musicLibrary.list.filters.searchPlaceholder')"
                />
                <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                  <Search class="size-4 text-muted-foreground" />
                </span>
              </div>
            </div>
          </div>

          <section class="grid gap-3 rounded-md border bg-muted/20 p-3">
            <div class="flex items-center gap-2 text-sm font-medium">
              <Filter class="size-4 text-muted-foreground" />
              {{ t("musicLibrary.list.filters.title") }}
            </div>

            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div class="grid gap-2">
                <Label>{{ t("musicLibrary.list.filters.difficulty") }}</Label>
                <Select
                  :model-value="selectedDifficulty ?? ALL_OPTION"
                  @update:model-value="updateDifficulty"
                >
                  <SelectTrigger class="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem :value="ALL_OPTION">
                      {{ t("musicLibrary.list.filters.difficultyAll") }}
                    </SelectItem>
                    <SelectItem
                      v-for="difficulty in MUSIC_DIFFICULTIES"
                      :key="difficulty"
                      :value="difficulty"
                    >
                      <span class="flex items-center gap-2">
                        <span
                          class="size-2.5 rounded-full"
                          :style="{ backgroundColor: MUSIC_DIFFICULTY_COLORS[difficulty] }"
                        />
                        {{ difficultyLabel(difficulty) }}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

              <div class="grid gap-2">
                <Label>{{ t("musicLibrary.list.filters.tag") }}</Label>
                <Select
                  :model-value="selectedTag ?? ALL_OPTION"
                  @update:model-value="updateTag"
                >
                  <SelectTrigger class="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem :value="ALL_OPTION">
                      {{ t("musicLibrary.list.filters.tagAll") }}
                    </SelectItem>
                    <SelectItem v-for="tag in tagOptions" :key="tag" :value="tag">
                      {{ tagLabel(tag) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="grid gap-2">
                <Label>{{ t("musicLibrary.list.filters.year") }}</Label>
                <Select
                  :model-value="selectedYear != null ? String(selectedYear) : ALL_OPTION"
                  @update:model-value="updateYear"
                >
                  <SelectTrigger class="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem :value="ALL_OPTION">
                      {{ t("musicLibrary.list.filters.yearAll") }}
                    </SelectItem>
                    <SelectItem v-for="year in yearOptions" :key="year" :value="String(year)">
                      {{ year }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-xs text-muted-foreground">
                {{ t("musicLibrary.list.results.count", { count: visibleEntries.length }) }}
              </p>
              <Button type="button" variant="ghost" size="sm" @click="resetFilters">
                <RotateCcw class="size-4" />
                {{ t("musicLibrary.list.filters.reset") }}
              </Button>
            </div>
          </section>

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
        {{ t("musicLibrary.list.results.empty") }}
      </div>
    </div>
  </div>
</template>
