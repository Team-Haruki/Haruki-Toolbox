<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, useTemplateRef, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { LucideLanguages } from "lucide-vue-next"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCatalogViewPreference } from "@/composables/useCatalogViewPreference"
import { resolveSekaiAssetRootUrl } from "@/shared/sekai/data-sources"
import { useSettingsStore } from "@/shared/stores/settings"
import { useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import { useStoryCatalog } from "@/modules/story/composables/useStoryCatalog"
import { useStoryPlayback } from "@/modules/story/composables/useStoryPlayback"
import { hideUnreleasedStories, overlayStoryTitles, type StoryEpisodeLabel } from "@/modules/story/lib/story-catalog"
import {
  STORY_LANG_REGIONS,
  STORY_TEXT_LANGS,
  storyLangChain,
  type StoryTextLang,
} from "@/modules/story/lib/story-text"
import { configureStoryRoot } from "@/modules/story/engine/urls"
import type { RuntimeLabels } from "@/modules/story/engine/story-runtime"
import "@/modules/story/engine/player.css"

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()
const { hideUnreleased } = useUnreleasedContentDisplay()

const LANG_KEYS: Record<StoryTextLang, string> = {
  ja: "ja",
  "zh-Hans": "zhHans",
  "zh-Hant": "zhHant",
  en: "en",
  ko: "ko",
  "zh-Hans-ai": "zhHansAi",
}
const langLabel = (lang: StoryTextLang) => t(`storyPlayer.lang.${LANG_KEYS[lang]}`)

/** "auto" follows the Toolbox language. */
const pickedLang = useCatalogViewPreference<string>("story", "textLang", () => "auto", ["auto", ...STORY_TEXT_LANGS])
const langChain = computed(() => storyLangChain(
  String(locale.value),
  (STORY_TEXT_LANGS as readonly string[]).includes(pickedLang.value) ? (pickedLang.value as StoryTextLang) : null,
))

const sid = computed(() => {
  const value = route.query.scenario
  return typeof value === "string" && /^[\w.-]{1,96}$/.test(value) ? value : null
})

// Paths and images come from JP; titles follow the first official language
// of the chain (the AI translation does not cover titles).
const jpRegion = ref("jp" as const)
const titleRegion = computed(() => {
  for (const lang of langChain.value) {
    const region = STORY_LANG_REGIONS[lang]
    if (region) return region
  }
  return "jp"
})
const jpCatalog = useStoryCatalog(jpRegion)
const titleCatalog = useStoryCatalog(titleRegion, computed(() => titleRegion.value !== "jp"))
const catalog = computed(() => {
  const base = jpCatalog.catalog.value
  if (!base) return null
  const titled = titleRegion.value === "jp" ? base : overlayStoryTitles(base, titleCatalog.catalog.value)
  return hideUnreleased.value ? hideUnreleasedStories(titled, Date.now()) : titled
})

// Only the hosts in front of the full JP tree carry Live2D models, motions,
// backgrounds and voices; the china_cdn host serves a filtered copy.
const assetRoot = computed(() => {
  const preference = settingsStore.currentAssetEndpoint
  return resolveSekaiAssetRootUrl(preference === "china_cdn" ? "china" : preference)
})
watch(assetRoot, (root) => configureStoryRoot(`${root}/jp-assets`), { immediate: true })

const { runtime, state, aiPending, markInteracted } = useStoryPlayback({
  sid,
  catalog,
  langChain,
  assetRoot,
})

const host = useTemplateRef<HTMLElement>("host")
const engineError = ref<string | null>(null)

function episodeLabel(label: StoryEpisodeLabel): string {
  if (label.type === "episode") return t("storyPlayer.browser.episode", { no: label.no })
  if (label.type === "part") return t(label.part === "second" ? "storyPlayer.browser.secondPart" : "storyPlayer.browser.firstPart")
  return label.text
}

function runtimeLabels(): RuntimeLabels {
  return {
    browser: {
      tabs: {
        unit: t("storyPlayer.browser.tabs.unit"),
        event: t("storyPlayer.browser.tabs.event"),
        card: t("storyPlayer.browser.tabs.card"),
        special: t("storyPlayer.browser.tabs.special"),
        area: t("storyPlayer.browser.tabs.area"),
      },
      all: t("storyPlayer.browser.all"),
      rail: t("storyPlayer.browser.rail"),
      toggle: t("storyPlayer.browser.toggle"),
      search: t("storyPlayer.browser.search"),
      loading: t("storyPlayer.browser.loading"),
      empty: t("storyPlayer.browser.empty"),
      episode: episodeLabel,
    },
    menu: {
      bookmark: t("storyPlayer.menu.bookmark"),
      auto: t("storyPlayer.menu.auto"),
      consecutive: t("storyPlayer.menu.consecutive"),
      skip: t("storyPlayer.menu.skip"),
      fast: t("storyPlayer.menu.fast"),
      hide: t("storyPlayer.menu.hide"),
      log: t("storyPlayer.menu.log"),
    },
    log: {
      searchPlaceholder: t("storyPlayer.log.search"),
      matches: (count) => t("storyPlayer.log.matches", { count }),
    },
    loading: t("storyPlayer.stage.loading"),
    start: t("storyPlayer.stage.start"),
    pickBeside: t("storyPlayer.stage.pickBeside"),
    pickAbove: t("storyPlayer.stage.pickAbove"),
  }
}

function pick(next: string) {
  markInteracted()
  if (next === sid.value) return
  void router.push({ query: { ...route.query, scenario: next } })
}

let disposed = false
onMounted(async () => {
  try {
    const { loadCubismCore } = await import("@/modules/story/engine/cubism")
    await loadCubismCore()
    const { StoryRuntime } = await import("@/modules/story/engine/story-runtime")
    if (disposed || !host.value) return
    const rt = new StoryRuntime(host.value, runtimeLabels(), pick)
    if (catalog.value) rt.setCatalog(catalog.value)
    runtime.value = rt
  } catch (error) {
    engineError.value = error instanceof Error ? error.message : String(error)
  }
})

onBeforeUnmount(() => {
  disposed = true
  runtime.value?.destroy()
  runtime.value = null
})

watch(catalog, (value) => {
  if (value) runtime.value?.setCatalog(value)
})
watch(() => jpCatalog.error.value, (error) => {
  if (error) runtime.value?.setCatalogError(t("storyPlayer.errors.catalog"))
})

const stateMessage = computed(() => {
  const s = state.value
  if (s.phase !== "error") return null
  if (s.reason === "notFound") return t("storyPlayer.errors.notFound")
  if (s.reason === "missing") return t("storyPlayer.errors.missing")
  return t("storyPlayer.errors.failed", { detail: s.detail ?? "" })
})
watch(stateMessage, (message) => {
  if (message) runtime.value?.showError(message)
})

const playingLang = computed(() => (state.value.phase === "playing" ? state.value.lang : null))
/** The episode lacks the language the user would get first. */
const fallbackNotice = computed(() => {
  const shown = playingLang.value
  const wanted = langChain.value[0]
  if (!shown || shown === wanted) return null
  return t("storyPlayer.fallback", { lang: langLabel(wanted), shown: langLabel(shown) })
})

const langSelectId = useId()
const langOptions = computed(() => [
  { value: "auto", label: t("storyPlayer.langAuto") },
  ...STORY_TEXT_LANGS.map((lang) => ({ value: lang, label: langLabel(lang) })),
])
</script>

<template>
  <div class="flex w-full flex-col gap-3 p-3 sm:p-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold tracking-tight">{{ t("storyPlayer.title") }}</h1>
        <p class="text-sm text-muted-foreground">{{ t("storyPlayer.description") }}</p>
      </div>
      <div class="flex items-center gap-2">
        <LucideLanguages class="size-4 text-muted-foreground" aria-hidden="true" />
        <Label :id="`${langSelectId}-label`" :for="langSelectId" class="sr-only">{{ t("storyPlayer.textLang") }}</Label>
        <Select :id="langSelectId" v-model="pickedLang">
          <SelectTrigger class="w-52" :aria-labelledby="`${langSelectId}-label`">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in langOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div v-if="engineError" class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
      {{ t("storyPlayer.errors.engine", { detail: engineError }) }}
    </div>
    <div
      v-else-if="fallbackNotice || aiPending || playingLang === 'zh-Hans-ai'"
      class="flex flex-col gap-1 text-sm text-muted-foreground"
      aria-live="polite"
    >
      <p v-if="fallbackNotice">{{ fallbackNotice }}</p>
      <p v-if="aiPending && playingLang !== 'zh-Hans-ai'">{{ t("storyPlayer.aiPending") }}</p>
      <p v-if="playingLang === 'zh-Hans-ai'">{{ t("storyPlayer.aiNotice") }}</p>
    </div>

    <div ref="host" class="w-full min-w-0" />
  </div>
</template>
