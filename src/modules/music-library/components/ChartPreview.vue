<script setup lang="ts">
import { computed, ref, watch } from "vue"
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
import type { MusicLibraryEntry } from "../lib/music-data"

const props = defineProps<{
  entry: MusicLibraryEntry
  region: SekaiRegion
  preference: SekaiAssetEndpointPreference
  jacketUrl: string | null
}>()

const { t } = useI18n()

type PreviewMode = "dynamic" | "static"

// The dynamic (scrolling) preview port is still in progress, so the static
// renderer is the default until it lands; the requested end state is dynamic.
const mode = ref<PreviewMode>("static")

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
const svgHost = ref<HTMLDivElement | null>(null)

const svgCache = new Map<string, string>()
let loadToken = 0

function cacheKey(difficulty: MusicDifficulty): string {
  return `${props.region}:${props.entry.id}:${difficulty}`
}

async function loadStaticChart() {
  const difficulty = selectedDifficulty.value
  if (difficulty == null) {
    status.value = "idle"
    svgMarkup.value = null
    return
  }

  const token = ++loadToken
  const cached = svgCache.get(cacheKey(difficulty))
  if (cached != null) {
    svgMarkup.value = cached
    status.value = "ready"
    return
  }

  status.value = "loading"
  svgMarkup.value = null
  try {
    const url = resolveMusicScoreUrl(props.region, props.entry.id, difficulty, props.preference)
    if (url == null) {
      throw new Error("no chart url")
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const sus = await response.text()
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

    svgCache.set(cacheKey(difficulty), svg)
    svgMarkup.value = svg
    status.value = "ready"
  } catch {
    if (token === loadToken) {
      status.value = "error"
    }
  }
}

watch([mode, selectedDifficulty, () => props.entry.id, () => props.region], () => {
  if (mode.value === "static") {
    void loadStaticChart()
  }
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

    <!-- Dynamic preview placeholder until the in-app port lands -->
    <div
      v-if="mode === 'dynamic'"
      class="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground"
    >
      {{ t("musicLibrary.detail.chartPreview.dynamicComing") }}
    </div>

    <template v-else>
      <Skeleton v-if="status === 'loading'" class="h-96 w-full rounded-md" />
      <div
        v-else-if="status === 'error'"
        class="flex flex-col items-center gap-3 rounded-md border border-dashed p-10 text-center"
      >
        <p class="text-sm text-muted-foreground">{{ t("musicLibrary.detail.chartPreview.loadError") }}</p>
        <Button variant="outline" size="sm" @click="loadStaticChart">
          <LucideRefreshCcw class="mr-1 size-4" /> {{ t("musicLibrary.detail.chartPreview.retry") }}
        </Button>
      </div>
      <div
        v-else-if="status === 'ready'"
        class="overflow-x-auto rounded-md border bg-white"
      >
        <div ref="svgHost" class="mx-auto w-fit [&_svg]:block [&_svg]:max-w-none" />
      </div>
    </template>
  </div>
</template>
