<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, useTemplateRef, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { FlaskConical, LucideLanguages } from "lucide-vue-next"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCatalogViewPreference } from "@/composables/useCatalogViewPreference"
import { resolveSekaiAssetFallbackRootUrl, resolveSekaiAssetRootUrl } from "@/shared/sekai/data-sources"
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
/** Play the voices (remembered per device). */
const voiceOn = useCatalogViewPreference<boolean>("story", "voice", () => true)
const voiceSwitchId = useId()

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
const titleScript = computed(() => ({ cn: "zh", tw: "zh", kr: "ko", en: "latin" } as Record<string, string>)[titleRegion.value] ?? "ja")
watch(titleScript, (script) => runtime.value?.setTitleScript(script))
const jpCatalog = useStoryCatalog(jpRegion)
const titleCatalog = useStoryCatalog(titleRegion, computed(() => titleRegion.value !== "jp"))
const catalog = computed(() => {
  const base = jpCatalog.catalog.value
  if (!base) return null
  const titled = titleRegion.value === "jp" ? base : overlayStoryTitles(base, titleCatalog.catalog.value)
  return hideUnreleased.value ? hideUnreleasedStories(titled, Date.now()) : titled
})

// Both asset hosts carry the player's whole JP tree; the China CDN falls back
// to the global host when it fails.
const assetRoot = computed(() => resolveSekaiAssetRootUrl(settingsStore.currentAssetEndpoint))
const fallbackRoot = computed(() => resolveSekaiAssetFallbackRootUrl(settingsStore.currentAssetEndpoint))

const { runtime, state, aiPending, available, activeRoot, activeFallback, markInteracted } = useStoryPlayback({
  sid,
  catalog,
  langChain,
  assetRoot,
  fallbackRoot,
})
watch(
  [activeRoot, activeFallback],
  ([root, fallback]) => configureStoryRoot(`${root}/jp-assets`, fallback ? `${fallback}/jp-assets` : null),
  { immediate: true },
)

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
      fullscreen: t("storyPlayer.menu.fullscreen"),
      auto: t("storyPlayer.menu.auto"),
      mute: t("storyPlayer.menu.mute"),
      fast: t("storyPlayer.menu.fast"),
      hide: t("storyPlayer.menu.hide"),
      log: t("storyPlayer.menu.log"),
    },
    log: {
      searchPlaceholder: t("storyPlayer.log.search"),
      matches: (count) => t("storyPlayer.log.matches", { count }),
    },
    loading: t("storyPlayer.stage.loading"),
    models: t("storyPlayer.stage.models"),
    start: t("storyPlayer.stage.start"),
    pickBeside: t("storyPlayer.stage.pickBeside"),
    pickBelow: t("storyPlayer.stage.pickBelow"),
    tabBrowser: t("storyPlayer.stage.tabBrowser"),
    tabLog: t("storyPlayer.stage.tabLog"),
    fullscreen: t("storyPlayer.stage.fullscreen"),
    exitFullscreen: t("storyPlayer.stage.exitFullscreen"),
    credit: t("storyPlayer.stage.credit"),
  }
}

function pick(next: string) {
  markInteracted()
  if (next === sid.value) return
  void router.push({ query: { ...route.query, scenario: next } })
}

let disposed = false
let runtimeModule: typeof import("@/modules/story/engine/story-runtime") | null = null

// The runtime's DOM carries its labels, so a Toolbox language change rebuilds it.
function mountRuntime() {
  if (disposed || !host.value || !runtimeModule) return
  runtime.value?.destroy()
  const rt = new runtimeModule.StoryRuntime(host.value, runtimeLabels(), pick)
  if (catalog.value) rt.setCatalog(catalog.value)
  rt.setVoice(voiceOn.value)
  rt.setTitleScript(titleScript.value)
  runtime.value = rt
}

onMounted(async () => {
  try {
    runtimeModule = await import("@/modules/story/engine/story-runtime")
    mountRuntime()
  } catch (error) {
    engineError.value = error instanceof Error ? error.message : String(error)
  }
})

watch(locale, () => mountRuntime())
watch(voiceOn, (on) => runtime.value?.setVoice(on))

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
  if (s.reason === "unreleased") return t("storyPlayer.errors.unreleased")
  if (s.reason === "missing") return t("storyPlayer.errors.missing")
  return t("storyPlayer.errors.failed", { detail: s.detail ?? "" })
})
watch(stateMessage, (message) => {
  if (message) runtime.value?.showError(message)
})

const playingLang = computed(() => (state.value.phase === "playing" ? state.value.lang : null))

// Only the languages this episode has. A remembered pick the episode lacks
// stays saved for the next episode; meanwhile the selector shows what plays.
const selectedLang = computed<string>({
  get: () => {
    const picked = pickedLang.value
    if (picked === "auto" || !playingLang.value) return picked
    return (available.value as string[]).includes(picked) ? picked : playingLang.value
  },
  set: (value) => {
    pickedLang.value = value
  },
})

const langSelectId = useId()
const langOptions = computed(() => [
  {
    value: "auto",
    label: pickedLang.value === "auto" && playingLang.value
      ? t("storyPlayer.langAutoResolved", { lang: langLabel(playingLang.value) })
      : t("storyPlayer.langAuto"),
  },
  ...(available.value.length > 0 ? available.value : (["ja"] as StoryTextLang[]))
    .map((lang) => ({ value: lang, label: langLabel(lang) })),
])
</script>

<template>
  <div class="flex w-full flex-col gap-3 p-3 sm:p-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div class="min-w-0">
        <h1 class="text-xl font-semibold tracking-tight">{{ t("storyPlayer.title") }}</h1>
        <p class="text-sm text-muted-foreground">{{ t("storyPlayer.description") }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div class="flex items-center gap-2">
          <Switch :id="voiceSwitchId" v-model="voiceOn" />
          <Label :for="voiceSwitchId" class="text-sm">{{ t("storyPlayer.voice") }}</Label>
        </div>
        <div class="flex items-center gap-2">
          <LucideLanguages class="size-4 text-muted-foreground" aria-hidden="true" />
          <Label :id="`${langSelectId}-label`" :for="langSelectId" class="sr-only">{{ t("storyPlayer.textLang") }}</Label>
          <Select :id="langSelectId" v-model="selectedLang">
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
    </div>

    <Alert class="rounded-lg bg-card/90">
      <FlaskConical aria-hidden="true" />
      <AlertTitle>{{ t("storyPlayer.beta.title") }}</AlertTitle>
      <AlertDescription>
        <i18n-t keypath="storyPlayer.beta.body" scope="global" tag="p">
          <template #tickets>
            <router-link :to="{ name: 'tickets.create' }" class="font-medium text-primary underline-offset-4 hover:underline">
              {{ t("storyPlayer.beta.tickets") }}
            </router-link>
          </template>
        </i18n-t>
      </AlertDescription>
    </Alert>

    <div v-if="engineError" class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
      {{ t("storyPlayer.errors.engine", { detail: engineError }) }}
    </div>
    <p
      v-else-if="playingLang === 'zh-Hans-ai' || (aiPending && langChain.includes('zh-Hans-ai'))"
      class="text-sm text-muted-foreground"
      aria-live="polite"
    >
      {{ playingLang === "zh-Hans-ai" ? t("storyPlayer.aiNotice") : t("storyPlayer.aiPending") }}
    </p>

    <div ref="host" class="w-full min-w-0" />
  </div>
</template>
