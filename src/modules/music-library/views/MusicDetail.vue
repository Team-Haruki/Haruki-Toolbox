<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { RouterLink, useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { goBackOr, hasInAppHistory } from "@/lib/router-back"
import { fetchMusicAliases } from "@/shared/sekai/music-alias"
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Clock3,
  Disc3,
  ExternalLink,
  ListMusic,
  MicVocal,
  PartyPopper,
  Pause,
  Play,
  ScrollText,
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
import EventBannerImage from "@/modules/events/components/EventBannerImage.vue"
import ChartPreview from "../components/ChartPreview.vue"
import MusicJacket from "../components/MusicJacket.vue"
import { useMusicLibraryDetail } from "../composables/useMusicLibraryDetail"
import { resolveMusicJacketUrl, resolveMusicLongAudioUrl } from "../lib/music-assets"
import {
  MUSIC_DIFFICULTIES,
  MUSIC_DIFFICULTY_COLORS,
  type MusicDifficulty,
} from "../lib/music-difficulties"
import {
  BPM_DIFFICULTY_CANDIDATES,
  formatBpmValue,
  parseChartBpm,
  resolveMusicScoreUrl,
  type ChartBpmInfo,
} from "../lib/music-bpm"
import {
  formatMusicDurationLabel,
  type MusicVocalCharacter,
  type MusicVocalEntry,
} from "../lib/music-data"
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
const router = useRouter()
const route = useRoute()

function goBack() {
  goBackOr(router, "/music")
}

/** Track the route so in-component navigation re-checks the history state. */
const canGoBack = computed(() => {
  void route.fullPath
  return hasInAppHistory()
})
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
  eventBoxMap,
  durationSeconds,
  loading,
  error,
  notFound,
} = useMusicLibraryDetail(region, parsedMusicId)

const { blurUnreleased } = useUnreleasedContentDisplay()
const unreleased = computed(() => entry.value != null && isMusicEntryUnreleased(entry.value))

// --- Community aliases (live from the HarukiBot alias API) ------------------

const ALIAS_COLLAPSED_LIMIT = 16

const aliases = ref<readonly string[]>([])
const aliasesExpanded = ref(false)

watch(parsedMusicId, (musicId) => {
  aliases.value = []
  aliasesExpanded.value = false
  if (musicId == null) {
    return
  }

  void fetchMusicAliases(musicId).then((result) => {
    if (parsedMusicId.value === musicId) {
      aliases.value = result
    }
  })
}, { immediate: true })

const visibleAliases = computed(() =>
  aliasesExpanded.value ? aliases.value : aliases.value.slice(0, ALIAS_COLLAPSED_LIMIT),
)
const hiddenAliasCount = computed(() => Math.max(aliases.value.length - visibleAliases.value.length, 0))

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

const bpmInfo = ref<ChartBpmInfo | null>(null)
let bpmLoadToken = 0

// Chart scores are plain public assets; failures (missing chart, CORS) just
// hide the BPM row instead of surfacing an error.
watch([entry, region, () => settingsStore.currentAssetEndpoint], async ([nextEntry, nextRegion, preference]) => {
  const token = ++bpmLoadToken
  bpmInfo.value = null
  if (!nextEntry) {
    return
  }

  const available = BPM_DIFFICULTY_CANDIDATES
    .filter((difficulty) => nextEntry.difficulties[difficulty as MusicDifficulty] != null)
  const candidates = available.length > 0 ? available : [...BPM_DIFFICULTY_CANDIDATES]
  for (const difficulty of candidates) {
    const url = resolveMusicScoreUrl(nextRegion, nextEntry.id, difficulty, preference)
    if (!url) {
      continue
    }

    try {
      const response = await fetch(url)
      if (token !== bpmLoadToken) {
        return
      }

      if (!response.ok) {
        continue
      }

      const parsed = parseChartBpm(await response.text())
      if (token !== bpmLoadToken) {
        return
      }

      if (parsed != null && parsed.mainBpm > 0) {
        bpmInfo.value = parsed
        return
      }
    } catch {
      if (token !== bpmLoadToken) {
        return
      }
    }
  }
}, { immediate: true })

const bpmLabel = computed(() => {
  const info = bpmInfo.value
  if (info == null) {
    return null
  }

  const main = formatBpmValue(info.mainBpm)
  if (info.events.length <= 1) {
    return main
  }

  // Full chronological BPM sequence (consecutive duplicates already collapsed).
  const sequence = info.events.map((event) => formatBpmValue(event.bpm)).join(" → ")
  return `${main} (${sequence})`
})
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

// --- Vocal playback -------------------------------------------------------
// One shared <audio> element; picking another version replaces the source.

const playingVocalId = ref<number | null>(null)
let audioElement: HTMLAudioElement | null = null

function vocalAudioUrl(vocal: MusicVocalEntry): string | null {
  return resolveMusicLongAudioUrl(region.value, vocal.assetbundleName, settingsStore.currentAssetEndpoint)
}

// The chart preview plays the sekai version when available, else any vocal.
const chartPreviewAudioUrl = computed(() => {
  const vocal = vocals.value.find((entry) => entry.musicVocalType === "sekai" && entry.assetbundleName)
    ?? vocals.value.find((entry) => entry.assetbundleName)
  return vocal != null ? vocalAudioUrl(vocal) : null
})

function ensureAudioElement(): HTMLAudioElement {
  if (!audioElement) {
    audioElement = new Audio()
    audioElement.preload = "auto"
    audioElement.addEventListener("ended", () => {
      playingVocalId.value = null
    })
    audioElement.addEventListener("error", () => {
      playingVocalId.value = null
    })
  }

  return audioElement
}

function stopVocalPlayback() {
  audioElement?.pause()
  playingVocalId.value = null
}

function toggleVocalPlayback(vocal: MusicVocalEntry) {
  if (playingVocalId.value === vocal.id) {
    stopVocalPlayback()
    return
  }

  const url = vocalAudioUrl(vocal)
  if (url == null) {
    return
  }

  const element = ensureAudioElement()
  element.src = url
  // The long audio assets lead with the chart's filler silence; skip it.
  // (Setting currentTime pre-metadata records the default start position.)
  const filler = entry.value?.fillerSec ?? 0
  if (filler > 0) {
    element.currentTime = filler
  }

  playingVocalId.value = vocal.id
  void element.play().catch(() => {
    if (playingVocalId.value === vocal.id) {
      playingVocalId.value = null
    }
  })
}

watch([parsedMusicId, region], () => {
  stopVocalPlayback()
})

onBeforeUnmount(() => {
  stopVocalPlayback()
  if (audioElement) {
    audioElement.src = ""
    audioElement = null
  }
})

/** "某角色几箱" hint for an event, when its banner character is known. */
function eventBoxHint(eventId: number) {
  const info = eventBoxMap.value.get(eventId)
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
</script>

<template>
  <div class="flex w-full flex-1 items-center justify-center px-0 py-4">
    <div class="mx-auto w-full max-w-5xl space-y-4">
      <div>
        <Button variant="outline" size="sm" @click="goBack">
          <ArrowLeft class="size-4" />
          {{ canGoBack ? t("common.back") : t("musicLibrary.detail.back") }}
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

                <dl class="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-x-6 gap-y-3 text-base">
                  <div class="flex min-w-0 items-baseline gap-2">
                    <dt class="shrink-0 text-muted-foreground">{{ t("musicLibrary.detail.info.composer") }}</dt>
                    <dd class="min-w-0 break-words font-medium">{{ entry.composer || "-" }}</dd>
                  </div>
                  <div class="flex min-w-0 items-baseline gap-2">
                    <dt class="shrink-0 text-muted-foreground">{{ t("musicLibrary.detail.info.lyricist") }}</dt>
                    <dd class="min-w-0 break-words font-medium">{{ entry.lyricist || "-" }}</dd>
                  </div>
                  <div class="flex min-w-0 items-baseline gap-2">
                    <dt class="shrink-0 text-muted-foreground">{{ t("musicLibrary.detail.info.arranger") }}</dt>
                    <dd class="min-w-0 break-words font-medium">{{ entry.arranger || "-" }}</dd>
                  </div>
                  <div class="flex min-w-0 items-center gap-2">
                    <dt class="flex shrink-0 items-center gap-1 text-muted-foreground">
                      <CalendarDays class="size-4" />
                      {{ t("musicLibrary.detail.info.publishedAt") }}
                    </dt>
                    <dd class="font-medium">
                      {{ formatDateLabel(entry.publishedAt) ?? "-" }}
                    </dd>
                  </div>
                  <div v-if="durationLabel" class="flex min-w-0 items-center gap-2">
                    <dt class="flex shrink-0 items-center gap-1 text-muted-foreground">
                      <Clock3 class="size-4" />
                      {{ t("musicLibrary.detail.info.duration") }}
                    </dt>
                    <dd class="font-medium">{{ durationLabel }}</dd>
                  </div>
                  <div v-if="bpmLabel" class="flex min-w-0 items-center gap-2">
                    <dt class="flex shrink-0 items-center gap-1 text-muted-foreground">
                      <Activity class="size-4" />
                      {{ t("musicLibrary.detail.info.bpm") }}
                    </dt>
                    <dd class="min-w-0 break-words font-medium tabular-nums">{{ bpmLabel }}</dd>
                  </div>
                  <div class="flex min-w-0 items-center gap-2">
                    <dt class="flex shrink-0 items-center gap-1 text-muted-foreground">
                      <Disc3 class="size-4" />
                      {{ t("musicLibrary.detail.info.id") }}
                    </dt>
                    <dd class="font-medium">#{{ entry.id }}</dd>
                  </div>
                </dl>

                <div v-if="aliases.length > 0" class="space-y-1.5">
                  <div class="text-sm text-muted-foreground">{{ t("musicLibrary.detail.aliases.title") }}</div>
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      v-for="alias in visibleAliases"
                      :key="alias"
                      class="inline-flex items-center rounded-full border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {{ alias }}
                    </span>
                    <button
                      v-if="hiddenAliasCount > 0"
                      type="button"
                      class="inline-flex items-center rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                      @click="aliasesExpanded = true"
                    >
                      {{ t("musicLibrary.detail.aliases.showMore", { count: hiddenAliasCount }) }}
                    </button>
                    <button
                      v-else-if="aliasesExpanded && aliases.length > ALIAS_COLLAPSED_LIMIT"
                      type="button"
                      class="inline-flex items-center rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                      @click="aliasesExpanded = false"
                    >
                      {{ t("musicLibrary.detail.aliases.showLess") }}
                    </button>
                  </div>
                </div>
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
              <ScrollText class="size-5" />
              {{ t("musicLibrary.detail.chartPreview.title") }}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartPreview
              :entry="entry"
              :region="region"
              :preference="settingsStore.currentAssetEndpoint"
              :jacket-url="jacketUrl"
              :audio-url="chartPreviewAudioUrl"
            />
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
                  <Button
                    v-if="vocalAudioUrl(vocal)"
                    variant="outline"
                    size="sm"
                    class="ml-auto h-7 gap-1 px-2 text-xs"
                    @click="toggleVocalPlayback(vocal)"
                  >
                    <component :is="playingVocalId === vocal.id ? Pause : Play" class="size-3.5" />
                    {{ playingVocalId === vocal.id
                      ? t("musicLibrary.detail.pause")
                      : t("musicLibrary.detail.play") }}
                  </Button>
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
              class="flex flex-wrap items-center gap-3 rounded-md border bg-muted/20 p-3 transition-colors hover:bg-accent/50 dark:hover:bg-accent/30"
            >
              <div class="relative aspect-[2/1] w-full shrink-0 overflow-hidden rounded-md bg-muted sm:w-36">
                <EventBannerImage
                  :region="region"
                  :assetbundle-name="event.assetbundleName"
                  :alt="event.name"
                  :preference="settingsStore.currentAssetEndpoint"
                />
              </div>
              <div class="min-w-0 flex-1 space-y-1">
                <p class="truncate text-sm font-medium">{{ event.name }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ formatEventPeriod(event.startAt, event.aggregateAt) }}
                </p>
                <p v-if="eventBoxHint(event.eventId)" class="flex items-center gap-1.5">
                  <span
                    class="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground"
                    :title="t('musicLibrary.eventBox.title', {
                      name: eventBoxHint(event.eventId)!.name,
                      count: eventBoxHint(event.eventId)!.boxNumber,
                    })"
                  >
                    <img
                      v-if="eventBoxHint(event.eventId)!.iconUrl"
                      :src="eventBoxHint(event.eventId)!.iconUrl ?? undefined"
                      alt=""
                      class="size-4 shrink-0 rounded-full"
                      loading="lazy"
                    >
                    {{ t("musicLibrary.eventBox.short", {
                      name: eventBoxHint(event.eventId)!.name,
                      count: eventBoxHint(event.eventId)!.boxNumber,
                    }) }}
                  </span>
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
