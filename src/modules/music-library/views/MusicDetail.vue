<script setup lang="ts">
import { computed } from "vue"
import { RouterLink } from "vue-router"
import { useI18n } from "vue-i18n"
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Disc3,
  ExternalLink,
  ListMusic,
  MicVocal,
  PartyPopper,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getI18nLocale } from "@/shared/i18n"
import { useSettingsStore } from "@/shared/stores/settings"
import { useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import { useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import MusicJacket from "../components/MusicJacket.vue"
import { useMusicLibraryDetail } from "../composables/useMusicLibraryDetail"
import { resolveMusicJacketUrl } from "../lib/music-assets"
import {
  MUSIC_DIFFICULTIES,
  MUSIC_DIFFICULTY_COLORS,
  type MusicDifficulty,
} from "../lib/music-difficulties"
import { formatMusicDurationLabel, type MusicVocalCharacter } from "../lib/music-data"
import { isMusicEntryUnreleased } from "../lib/music-filter"
import {
  resolveMusicCategoryLabelKey,
  resolveMusicTagLabelKey,
  resolveMusicVocalTypeLabelKey,
} from "../lib/music-labels"

const props = defineProps<{
  musicId: string
}>()

const { t, te, locale } = useI18n()
const settingsStore = useSettingsStore()

const { region } = useEffectiveCatalogRegion()
const parsedMusicId = computed(() => {
  const parsed = Number(props.musicId)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
})

const {
  entry,
  vocals,
  characterMap,
  outsideCharacterNames,
  eventLinks,
  durationSeconds,
  loading,
  error,
  notFound,
} = useMusicLibraryDetail(region, parsedMusicId)

const { blurUnreleased } = useUnreleasedContentDisplay()
const unreleased = computed(() => entry.value != null && isMusicEntryUnreleased(entry.value))

const jacketUrl = computed(() => {
  if (!entry.value) {
    return null
  }

  return resolveMusicJacketUrl(region.value, entry.value.assetbundleName, settingsStore.currentAssetEndpoint)
})

const difficultyRows = computed(() => {
  if (!entry.value) {
    return []
  }

  const difficulties = entry.value.difficulties
  return MUSIC_DIFFICULTIES
    .filter((difficulty) => difficulties[difficulty] != null)
    .map((difficulty) => ({
      difficulty,
      color: MUSIC_DIFFICULTY_COLORS[difficulty],
      playLevel: difficulties[difficulty]?.playLevel ?? null,
      totalNoteCount: difficulties[difficulty]?.totalNoteCount ?? null,
    }))
})

const durationLabel = computed(() => formatMusicDurationLabel(durationSeconds.value))
const dateFormatter = computed(() =>
  new Intl.DateTimeFormat(locale.value || getI18nLocale(), { dateStyle: "medium" }),
)

function difficultyLabel(difficulty: MusicDifficulty): string {
  return t(`musicLibrary.difficulty.${difficulty}`)
}

function categoryLabel(category: string): string {
  const key = resolveMusicCategoryLabelKey(category)
  return key && te(key) ? t(key) : category
}

function tagLabel(tag: string): string {
  const key = resolveMusicTagLabelKey(tag)
  return key && te(key) ? t(key) : tag
}

function vocalTypeLabel(vocalType: string): string {
  const key = resolveMusicVocalTypeLabelKey(vocalType)
  return key && te(key) ? t(key) : vocalType
}

function vocalCharacterName(character: MusicVocalCharacter): string {
  if (character.characterId == null) {
    return t("musicLibrary.detail.unknownCharacter")
  }

  if (character.characterType === "game_character") {
    return characterMap.value.get(character.characterId)?.name
      ?? t("musicLibrary.detail.unknownCharacter")
  }

  if (character.characterType === "outside_character") {
    return outsideCharacterNames.value.get(character.characterId)
      ?? t("musicLibrary.detail.unknownCharacter")
  }

  return t("musicLibrary.detail.unknownCharacter")
}

function vocalCharacterIcon(character: MusicVocalCharacter): string | null {
  if (character.characterType !== "game_character" || character.characterId == null) {
    return null
  }

  return characterMap.value.get(character.characterId)?.iconUrl ?? null
}

function formatDateLabel(timestamp: number | null): string | null {
  if (timestamp == null) {
    return null
  }

  return dateFormatter.value.format(new Date(timestamp))
}

function formatEventPeriod(startAt: number | null, aggregateAt: number | null): string {
  const start = formatDateLabel(startAt) ?? "?"
  const end = formatDateLabel(aggregateAt) ?? "?"
  return `${start} - ${end}`
}
</script>

<template>
  <div class="flex w-full flex-1 justify-center px-0 py-4">
    <div class="mx-auto w-full max-w-5xl space-y-4">
      <div>
        <Button variant="outline" size="sm" as-child>
          <RouterLink to="/music">
            <ArrowLeft class="size-4" />
            {{ t("musicLibrary.detail.back") }}
          </RouterLink>
        </Button>
      </div>

      <div v-if="loading && !entry" class="space-y-4">
        <div class="grid gap-4 md:grid-cols-[16rem_minmax(0,1fr)]">
          <Skeleton class="aspect-square w-full rounded-lg" />
          <div class="space-y-3">
            <Skeleton class="h-7 w-2/3" />
            <Skeleton class="h-4 w-1/2" />
            <Skeleton class="h-4 w-1/2" />
            <Skeleton class="h-4 w-1/3" />
          </div>
        </div>
        <Skeleton class="h-40 w-full rounded-lg" />
      </div>

      <div
        v-else-if="notFound"
        class="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground"
      >
        {{ t("musicLibrary.detail.notFound") }}
      </div>

      <p v-else-if="error" class="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {{ t("musicLibrary.detail.loadError", { message: error }) }}
      </p>

      <template v-else-if="entry">
        <Card>
          <CardContent class="pt-6">
            <div class="grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
              <div class="relative mx-auto aspect-square w-full max-w-64 overflow-hidden rounded-lg shadow-sm">
                <MusicJacket
                  :url="jacketUrl"
                  :alt="entry.title"
                  class="size-full"
                  :class="unreleased && blurUnreleased ? 'blur-md scale-105' : ''"
                />
              </div>
              <div class="min-w-0 space-y-4">
                <div class="space-y-2">
                  <h1 class="flex flex-wrap items-center gap-2 text-2xl font-semibold leading-tight">
                    {{ entry.title }}
                    <span
                      v-if="unreleased"
                      class="rounded bg-red-600 px-1.5 py-0.5 text-xs font-semibold leading-none text-white shadow-sm"
                    >
                      {{ t("sekaiUnreleased.badge") }}
                    </span>
                  </h1>
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      v-for="tag in entry.tags"
                      :key="tag"
                      class="inline-flex items-center rounded-full border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {{ tagLabel(tag) }}
                    </span>
                    <span
                      v-for="category in entry.categories"
                      :key="category"
                      class="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-xs text-primary dark:border-primary/40 dark:bg-primary/10"
                    >
                      {{ categoryLabel(category) }}
                    </span>
                  </div>
                </div>

                <dl class="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <div class="flex items-baseline gap-2">
                    <dt class="shrink-0 text-muted-foreground">{{ t("musicLibrary.detail.info.composer") }}</dt>
                    <dd class="min-w-0 break-words font-medium">{{ entry.composer || "-" }}</dd>
                  </div>
                  <div class="flex items-baseline gap-2">
                    <dt class="shrink-0 text-muted-foreground">{{ t("musicLibrary.detail.info.lyricist") }}</dt>
                    <dd class="min-w-0 break-words font-medium">{{ entry.lyricist || "-" }}</dd>
                  </div>
                  <div class="flex items-baseline gap-2">
                    <dt class="shrink-0 text-muted-foreground">{{ t("musicLibrary.detail.info.arranger") }}</dt>
                    <dd class="min-w-0 break-words font-medium">{{ entry.arranger || "-" }}</dd>
                  </div>
                  <div class="flex items-baseline gap-2">
                    <dt class="flex shrink-0 items-center gap-1 text-muted-foreground">
                      <CalendarDays class="size-3.5" />
                      {{ t("musicLibrary.detail.info.publishedAt") }}
                    </dt>
                    <dd class="font-medium">
                      {{ formatDateLabel(entry.publishedAt) ?? "-" }}
                    </dd>
                  </div>
                  <div v-if="durationLabel" class="flex items-baseline gap-2">
                    <dt class="flex shrink-0 items-center gap-1 text-muted-foreground">
                      <Clock3 class="size-3.5" />
                      {{ t("musicLibrary.detail.info.duration") }}
                    </dt>
                    <dd class="font-medium">{{ durationLabel }}</dd>
                  </div>
                  <div class="flex items-baseline gap-2">
                    <dt class="flex shrink-0 items-center gap-1 text-muted-foreground">
                      <Disc3 class="size-3.5" />
                      {{ t("musicLibrary.detail.info.id") }}
                    </dt>
                    <dd class="font-medium">#{{ entry.id }}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-lg">
              <ListMusic class="size-5" />
              {{ t("musicLibrary.detail.difficultiesTitle") }}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{{ t("musicLibrary.detail.table.difficulty") }}</TableHead>
                    <TableHead>{{ t("musicLibrary.detail.table.level") }}</TableHead>
                    <TableHead>{{ t("musicLibrary.detail.table.noteCount") }}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="row in difficultyRows" :key="row.difficulty">
                    <TableCell>
                      <span
                        class="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold text-white"
                        :style="{ backgroundColor: row.color }"
                      >
                        {{ difficultyLabel(row.difficulty) }}
                      </span>
                    </TableCell>
                    <TableCell class="font-medium">{{ row.playLevel ?? "-" }}</TableCell>
                    <TableCell class="font-mono">{{ row.totalNoteCount ?? "-" }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-lg">
              <MicVocal class="size-5" />
              {{ t("musicLibrary.detail.vocalsTitle") }}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="vocals.length > 0" class="space-y-3">
              <div
                v-for="vocal in vocals"
                :key="vocal.id"
                class="grid gap-2 rounded-md border bg-muted/20 p-3"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <span class="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
                    {{ vocalTypeLabel(vocal.musicVocalType) }}
                  </span>
                  <span class="text-sm font-medium">{{ vocal.caption || "-" }}</span>
                </div>
                <div v-if="vocal.characters.length > 0" class="flex flex-wrap gap-2">
                  <span
                    v-for="(character, index) in vocal.characters"
                    :key="`${vocal.id}-${index}`"
                    class="inline-flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-xs dark:bg-input/30"
                  >
                    <img
                      v-if="vocalCharacterIcon(character)"
                      :src="vocalCharacterIcon(character) ?? undefined"
                      :alt="vocalCharacterName(character)"
                      loading="lazy"
                      class="size-4.5 rounded-full"
                    >
                    {{ vocalCharacterName(character) }}
                  </span>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-muted-foreground">
              {{ t("musicLibrary.detail.vocalsEmpty") }}
            </p>
          </CardContent>
        </Card>

        <Card v-if="eventLinks.length > 0">
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-lg">
              <PartyPopper class="size-5" />
              {{ t("musicLibrary.detail.eventsTitle") }}
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <RouterLink
              v-for="event in eventLinks"
              :key="event.eventId"
              :to="`/events/${event.eventId}`"
              class="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 p-3 transition-colors hover:bg-accent/50 dark:hover:bg-accent/30"
            >
              <div class="min-w-0 space-y-1">
                <p class="truncate text-sm font-medium">{{ event.name }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ formatEventPeriod(event.startAt, event.aggregateAt) }}
                </p>
              </div>
              <ExternalLink class="size-4 shrink-0 text-muted-foreground" />
            </RouterLink>
          </CardContent>
        </Card>
      </template>
    </div>
  </div>
</template>
