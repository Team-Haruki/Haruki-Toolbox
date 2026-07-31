<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue"
import { useI18n } from "vue-i18n"
import { LucideRefreshCcw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { MUSIC_DIFFICULTIES, MUSIC_DIFFICULTY_COLORS, type MusicDifficulty } from "../lib/music-difficulties"
import { resolveMusicScoreUrl } from "../lib/music-bpm"
import { renderChartSvg } from "../lib/chart-preview"
import { parseDynamicChart, type DynamicChart } from "../lib/chart-dynamic"
import type { MusicLibraryEntry } from "../lib/music-data"
import DynamicChartPreview from "./DynamicChartPreview.vue"

const props = defineProps<{
  entry: MusicLibraryEntry
  region: SekaiRegion
  preference: SekaiAssetEndpointPreference
  jacketUrl: string | null
  audioUrl: string | null
}>()

const { t } = useI18n()

type PreviewMode = "dynamic" | "static"

const mode = ref<PreviewMode>("dynamic")

function handleModeChange(value: unknown) {
  if (value === "dynamic" || value === "static") {
    mode.value = value
  }
}

const availableDifficulties = computed(() =>
  MUSIC_DIFFICULTIES.filter((difficulty) => props.entry.difficulties[difficulty] != null),
)

const selectedDifficulty = ref<MusicDifficulty | null>(null)

watch(availableDifficulties, (difficulties) => {
  if (selectedDifficulty.value == null || !difficulties.includes(selectedDifficulty.value)) {
    selectedDifficulty.value = difficulties.includes("master") ? "master" : difficulties.at(-1) ?? null
  }
}, { immediate: true })

const status = ref<"idle" | "loading" | "error" | "ready">("idle")
const svgMarkup = ref<string | null>(null)
const dynamicChart = shallowRef<DynamicChart | null>(null)
const svgHost = ref<HTMLDivElement | null>(null)

const susCache = new Map<string, string>()
const svgCache = new Map<string, string>()
const chartCache = new Map<string, DynamicChart>()
let loadToken = 0

function cacheKey(difficulty: MusicDifficulty): string {
  return `${props.region}:${props.entry.id}:${difficulty}`
}

async function fetchSus(difficulty: MusicDifficulty): Promise<string> {
  const key = cacheKey(difficulty)
  const cached = susCache.get(key)
  if (cached != null) {
    return cached
  }

  const url = resolveMusicScoreUrl(props.region, props.entry.id, difficulty, props.preference)
  if (url == null) {
    throw new Error("no chart url")
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const sus = await response.text()
  susCache.set(key, sus)
  return sus
}

async function loadPreview() {
  const difficulty = selectedDifficulty.value
  if (difficulty == null) {
    status.value = "idle"
    svgMarkup.value = null
    dynamicChart.value = null
    return
  }

  const token = ++loadToken
  const key = cacheKey(difficulty)
  const targetMode = mode.value

  if (targetMode === "dynamic") {
    const cached = chartCache.get(key)
    if (cached != null) {
      dynamicChart.value = cached
      status.value = "ready"
      return
    }
  } else {
    const cached = svgCache.get(key)
    if (cached != null) {
      svgMarkup.value = cached
      status.value = "ready"
      return
    }
  }

  status.value = "loading"
  svgMarkup.value = null
  try {
    const sus = await fetchSus(difficulty)
    if (token !== loadToken) {
      return
    }

    if (targetMode === "dynamic") {
      const chart = parseDynamicChart(sus)
      chartCache.set(key, chart)
      dynamicChart.value = chart
    } else {
      const svg = await renderChartSvg({
        sus,
        title: props.entry.title,
        artist: props.entry.composer,
        difficulty,
        playLevel: props.entry.difficulties[difficulty]?.playLevel ?? null,
        musicId: props.entry.id,
        jacketUrl: props.jacketUrl,
      })
      if (token !== loadToken) {
        return
      }

      svgCache.set(key, svg)
      svgMarkup.value = svg
    }

    status.value = "ready"
  } catch {
    if (token === loadToken) {
      status.value = "error"
    }
  }
}

watch([mode, selectedDifficulty, () => props.entry.id, () => props.region], () => {
  void loadPreview()
}, { immediate: true })

// The SVG references external note sprites, so it must live inline in the
// DOM (an <img> would refuse to load the nested images).
watch([svgMarkup, svgHost], ([markup, host]) => {
  if (host != null) {
    host.innerHTML = markup ?? ""
  }
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          v-for="difficulty in availableDifficulties"
          :key="difficulty"
          type="button"
          :class="[
            'rounded px-2 py-0.5 text-xs font-semibold text-white transition-opacity',
            selectedDifficulty === difficulty ? '' : 'opacity-40 hover:opacity-70',
          ]"
          :style="{ backgroundColor: MUSIC_DIFFICULTY_COLORS[difficulty] }"
          :aria-pressed="selectedDifficulty === difficulty"
          @click="selectedDifficulty = difficulty"
        >
          {{ t(`musicLibrary.difficulty.${difficulty}`) }}
        </button>
      </div>
      <Tabs :model-value="mode" @update:model-value="handleModeChange">
        <TabsList class="h-8">
          <TabsTrigger value="dynamic" class="text-xs">
            {{ t("musicLibrary.detail.chartPreview.modeDynamic") }}
          </TabsTrigger>
          <TabsTrigger value="static" class="text-xs">
            {{ t("musicLibrary.detail.chartPreview.modeStatic") }}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>

    <Skeleton v-if="status === 'loading'" class="h-96 w-full rounded-md" />
    <div
      v-else-if="status === 'error'"
      class="flex flex-col items-center gap-3 rounded-md border border-dashed p-10 text-center"
    >
      <p class="text-sm text-muted-foreground">{{ t("musicLibrary.detail.chartPreview.loadError") }}</p>
      <Button variant="outline" size="sm" @click="loadPreview">
        <LucideRefreshCcw class="mr-1 size-4" /> {{ t("musicLibrary.detail.chartPreview.retry") }}
      </Button>
    </div>
    <template v-else-if="status === 'ready'">
      <DynamicChartPreview
        v-if="mode === 'dynamic' && dynamicChart != null"
        :chart="dynamicChart"
        :audio-url="audioUrl"
        :filler-sec="entry.fillerSec ?? 0"
      />
      <div
        v-else-if="mode === 'static'"
        class="overflow-x-auto rounded-md border bg-white"
      >
        <div ref="svgHost" class="mx-auto w-fit [&_svg]:block [&_svg]:max-w-none" />
      </div>
    </template>
  </div>
</template>
