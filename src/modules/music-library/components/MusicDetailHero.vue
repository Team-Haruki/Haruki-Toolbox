<script setup lang="ts">
/**
 * The song page's header: everything that says what the song is — jacket,
 * title, tags, credits, release / length / tempo, how it is unlocked, the
 * original MV, and its charts — in one
 * block, with the play button on the jacket. The sections under it hold what
 * the song has (vocal versions, events, the chart preview).
 */
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { Activity, CalendarDays, Check, Clapperboard, Clock3, Copy, ExternalLink, LockOpen, Pause, Play } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { resolveSekaiDifficultyLabel } from "@/shared/sekai/labels"
import { formatMusicDurationLabel, type MusicLibraryEntry } from "@/modules/music-library/lib/music-data"
import { resolveExternalLinkHost } from "@/modules/music-library/lib/music-extras"
import { listMusicDifficultyRows } from "@/modules/music-library/lib/music-view"
import MusicJacket from "./MusicJacket.vue"

const props = defineProps<{
  entry: MusicLibraryEntry
  jacketUrl: string | null
  /** Unreleased artwork the settings ask to blur. */
  blurred: boolean
  unreleased: boolean
  tags: readonly { key: string; label: string }[]
  categories: readonly { key: string; label: string }[]
  dateLabel: string | null
  durationSeconds: number | null
  bpmLabel: string | null
  /** The original MV (`musicOriginals`, jp only). */
  originalLink: string | null
  /** How the song is unlocked in the game (null when the server ships none). */
  unlockSentence: string | null
  /** At least one vocal version has audio. */
  playable: boolean
  playing: boolean
}>()

defineEmits<{
  zoom: []
  togglePlay: []
}>()

const { t, te } = useI18n()

const durationLabel = computed(() => formatMusicDurationLabel(props.durationSeconds))
const difficulties = computed(() => listMusicDifficultyRows(props.entry))
const originalHost = computed(() => (props.originalLink ? resolveExternalLinkHost(props.originalLink) : null))
const credits = computed(() => [
  { key: "composer", value: props.entry.composer },
  { key: "lyricist", value: props.entry.lyricist },
  { key: "arranger", value: props.entry.arranger },
].filter((credit) => credit.value))

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | null = null

async function copyAssetName() {
  try {
    await navigator.clipboard.writeText(props.entry.assetbundleName)
  } catch {
    // Clipboard blocked: the name stays selectable.
    return
  }
  copied.value = true
  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copied.value = false
  }, 1500)
}
</script>

<template>
  <header class="rounded-2xl border bg-card shadow-xs" data-testid="music-detail-hero">
    <div class="flex flex-col gap-5 p-4 sm:flex-row sm:gap-6 sm:p-6">
      <div class="relative mx-auto w-44 shrink-0 self-start sm:mx-0 sm:w-48 lg:w-56" data-testid="music-detail-jacket">
        <button
          type="button"
          class="block aspect-square w-full overflow-hidden rounded-xl shadow-lg outline-none transition-opacity hover:opacity-95 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none"
          :title="t('catalog.detail.zoom')"
          :aria-label="t('catalog.detail.zoom')"
          :disabled="blurred || jacketUrl == null"
          @click="$emit('zoom')"
        >
          <MusicJacket :url="jacketUrl" :alt="entry.title" class="size-full" :blur="blurred" eager />
        </button>
        <button
          v-if="playable"
          type="button"
          class="absolute right-2.5 bottom-2.5 inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg outline-none transition-transform hover:scale-105 focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
          :aria-label="playing ? t('musicPlayer.pause') : t('musicPlayer.playSong', { title: entry.title })"
          :aria-pressed="playing"
          data-testid="music-detail-play"
          @click="$emit('togglePlay')"
        >
          <Pause v-if="playing" class="size-5.5" />
          <Play v-else class="size-5.5 translate-x-0.5" />
        </button>
      </div>

      <div class="flex min-w-0 flex-1 flex-col gap-4">
        <div class="flex flex-col gap-2">
          <div class="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <h1 class="min-w-0 text-2xl leading-tight font-bold sm:text-3xl">{{ entry.title }}</h1>
            <span class="font-mono text-sm text-muted-foreground">#{{ entry.id }}</span>
          </div>
          <div v-if="unreleased || tags.length > 0 || categories.length > 0" class="flex flex-wrap items-center gap-1.5">
            <span
              v-if="unreleased"
              class="rounded bg-red-600 px-1.5 py-0.5 text-xs leading-none font-semibold text-white shadow-sm"
            >
              {{ t("sekaiUnreleased.badge") }}
            </span>
            <Badge v-for="badge in tags" :key="badge.key" variant="muted">{{ badge.label }}</Badge>
            <Badge v-for="badge in categories" :key="badge.key" variant="default">{{ badge.label }}</Badge>
          </div>
        </div>

        <dl v-if="credits.length > 0" class="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-3">
          <div v-for="credit in credits" :key="credit.key" class="flex min-w-0 items-baseline gap-2 sm:block">
            <dt class="shrink-0 text-xs text-muted-foreground">{{ t(`musicLibrary.detail.info.${credit.key}`) }}</dt>
            <dd class="min-w-0 text-sm font-medium break-words sm:mt-0.5">{{ credit.value }}</dd>
          </div>
        </dl>

        <ul class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
          <li v-if="dateLabel" class="inline-flex items-center gap-1.5">
            <CalendarDays class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span class="sr-only">{{ t("musicLibrary.detail.info.publishedAt") }}</span>
            {{ dateLabel }}
          </li>
          <li v-if="durationLabel" class="inline-flex items-center gap-1.5 tabular-nums">
            <Clock3 class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span class="sr-only">{{ t("musicLibrary.detail.info.duration") }}</span>
            {{ durationLabel }}
          </li>
          <li v-if="bpmLabel" class="inline-flex min-w-0 items-center gap-1.5 tabular-nums">
            <Activity class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span class="text-muted-foreground">{{ t("musicLibrary.detail.info.bpm") }}</span>
            <span class="min-w-0 break-words">{{ bpmLabel }}</span>
          </li>
          <li v-if="entry.assetbundleName">
            <button
              type="button"
              class="inline-flex min-h-6 max-w-full items-center gap-1.5 rounded-md border border-dashed px-1.5 text-left font-mono text-xs break-all text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:min-h-8"
              :aria-label="`${t('catalog.detail.copyAssetName')}: ${entry.assetbundleName}`"
              :title="t('catalog.detail.copyAssetName')"
              data-slot="catalog-asset-name"
              @click="copyAssetName"
            >
              <span>{{ entry.assetbundleName }}</span>
              <Check v-if="copied" class="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <Copy v-else class="size-3 shrink-0" aria-hidden="true" />
              <span class="sr-only" aria-live="polite">{{ copied ? t("catalog.detail.assetNameCopied") : "" }}</span>
            </button>
          </li>
        </ul>

        <div v-if="unlockSentence || originalLink" class="flex flex-wrap items-start gap-x-6 gap-y-1.5 text-sm">
          <p v-if="unlockSentence" class="flex min-w-0 items-start gap-1.5" data-testid="music-detail-unlock">
            <LockOpen class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span class="shrink-0 text-muted-foreground">{{ t("musicCatalog.detail.unlock.title") }}</span>
            <span class="min-w-0 break-words">{{ unlockSentence }}</span>
          </p>
          <a
            v-if="originalLink"
            :href="originalLink"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 rounded-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:min-h-8"
            :title="originalLink"
            data-testid="music-detail-original"
          >
            <Clapperboard class="size-4 shrink-0" aria-hidden="true" />
            {{ t("musicCatalog.detail.original.title") }}
            <span v-if="originalHost" class="font-normal text-muted-foreground">{{ originalHost }}</span>
            <ExternalLink class="size-3.5 shrink-0" aria-hidden="true" />
          </a>
        </div>

        <!-- More of what the song is (the events it was featured in). -->
        <slot />

        <!-- The charts: one block per difficulty, level large, note count under it. -->
        <dl
          v-if="difficulties.length > 0"
          class="mt-auto grid grid-cols-3 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(5.25rem,1fr))]"
          :aria-label="t('musicLibrary.detail.difficultiesTitle')"
          data-testid="music-detail-difficulties"
        >
          <div
            v-for="row in difficulties"
            :key="row.difficulty"
            class="overflow-hidden rounded-lg border bg-background/70 text-center dark:bg-input/30"
          >
            <dt class="px-1 py-0.5 text-[11px] leading-5 font-semibold text-white" :style="{ backgroundColor: row.color }">
              {{ resolveSekaiDifficultyLabel({ t, te }, row.difficulty) }}
            </dt>
            <dd class="flex flex-col items-center gap-0.5 px-1 py-2">
              <span class="sr-only">{{ t("musicLibrary.detail.table.level") }}</span>
              <span class="text-xl leading-none font-semibold tabular-nums">{{ row.playLevel ?? "—" }}</span>
              <span class="text-[11px] text-muted-foreground">
                {{ t("musicLibrary.detail.table.noteCount") }}
                <span class="font-mono tabular-nums">{{ row.totalNoteCount ?? "—" }}</span>
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </header>
</template>
