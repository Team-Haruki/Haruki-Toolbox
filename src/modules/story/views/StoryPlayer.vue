<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useTemplateRef, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { FlaskConical, LucideHistory, LucideLanguages, LucideMic, LucideMusic, LucideVolume2 } from "lucide-vue-next"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import EmptyState from "@/shared/components/EmptyState.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import PageHeader from "@/shared/components/PageHeader.vue"
import { useCatalogViewPreference } from "@/composables/useCatalogViewPreference"
import { resolveSekaiAssetFallbackRootUrl, resolveSekaiAssetRootUrl } from "@/shared/sekai/data-sources"
import { useSettingsStore } from "@/shared/stores/settings"
import { useUserStore } from "@/shared/stores/user"
import { useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import { useStoryCatalog } from "@/modules/story/composables/useStoryCatalog"
import { useStoryPlayback } from "@/modules/story/composables/useStoryPlayback"
import { hideUnreleasedStories, overlayStoryTitles, type StoryEpisodeLabel } from "@/modules/story/lib/story-catalog"
import { isWorthResuming, readStoryResume, writeStoryResume, type StoryResume } from "@/modules/story/lib/story-resume"
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
const userStore = useUserStore()
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
const UNIT_KEYS = ["light_sound", "idol", "street", "theme_park", "school_refusal", "piapro"] as const

/** "auto" follows the Toolbox language. */
const pickedLang = useCatalogViewPreference<string>("story", "textLang", () => "auto", ["auto", ...STORY_TEXT_LANGS])
/** Play the voices (remembered per device). */
const voiceOn = useCatalogViewPreference<boolean>("story", "voice", () => true)
/** Auto-advance lines (the menu's Auto); off by default like the game, remembered per device. */
const autoAdvance = useCatalogViewPreference<boolean>("story", "auto", () => false)
const voiceSwitchId = useId()

// Listener volumes (percent), remembered per device like the other player settings.
const VOLUME_STEPS = Array.from({ length: 101 }, (_, i) => String(i))
const voiceVolumePref = useCatalogViewPreference<string>("story", "voiceVolume", () => "100", VOLUME_STEPS)
const bgmVolumePref = useCatalogViewPreference<string>("story", "bgmVolume", () => "100", VOLUME_STEPS)
const voiceVolume = computed({
  get: () => [Number(voiceVolumePref.value)],
  set: (value: number[] | undefined) => {
    voiceVolumePref.value = String(Math.round(value?.[0] ?? 100))
  },
})
const bgmVolume = computed({
  get: () => [Number(bgmVolumePref.value)],
  set: (value: number[] | undefined) => {
    bgmVolumePref.value = String(Math.round(value?.[0] ?? 100))
  },
})
const voiceVolumeId = useId()
const bgmVolumeId = useId()

const langChain = computed(() => storyLangChain(
  String(locale.value),
  (STORY_TEXT_LANGS as readonly string[]).includes(pickedLang.value) ? (pickedLang.value as StoryTextLang) : null,
))

const sid = computed(() => {
  const value = route.query.scenario
  return typeof value === "string" && /^[\w.-]{1,96}$/.test(value) ? value : null
})
// a malformed ?scenario= is ignored; it does not stay in the address bar either
watch(
  () => route.query.scenario,
  (value) => {
    if (value != null && sid.value === null) {
      const rest = { ...route.query }
      delete rest.scenario
      void router.replace({ query: rest })
    }
  },
  { immediate: true },
)

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
// The resource's error comes and goes while it retries on its own; the page
// treats the list as failed from the first error until the catalog arrives
// (or the reader asks again), so the stage and the list stop waiting.
const catalogFailed = ref(false)
watch(() => jpCatalog.error.value, (error) => {
  if (error) catalogFailed.value = true
})
watch(catalog, (value) => {
  if (value) catalogFailed.value = false
})
const catalogError = computed(() => (catalogFailed.value && !catalog.value ? t("storyPlayer.errors.catalog") : null))
function retryCatalog() {
  catalogFailed.value = false
  void jpCatalog.reload()
}

// Both asset hosts carry the player's whole JP tree; the China CDN falls back
// to the global host when it fails.
const assetRoot = computed(() => resolveSekaiAssetRootUrl(settingsStore.currentAssetEndpoint))
const fallbackRoot = computed(() => resolveSekaiAssetFallbackRootUrl(settingsStore.currentAssetEndpoint))

// Where the reader left off (remembered per device), offered while nothing is picked.
const resumeAt = ref<number | null>(null)
const lastResume = ref<StoryResume | null>(readStoryResume())
let resumeWrittenAt = 0

const { runtime, state, aiPending, aiFailed, available, activeRoot, activeFallback, markInteracted, replay } = useStoryPlayback({
  sid,
  catalog,
  catalogError,
  langChain,
  assetRoot,
  fallbackRoot,
  resumeAt,
  failedMessage: () => t("storyPlayer.errors.failed"),
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
      units: Object.fromEntries(UNIT_KEYS.map((key) => [key, t(`cards.unit.${key}`)])),
      rail: t("storyPlayer.browser.rail"),
      toggle: t("storyPlayer.browser.toggle"),
      search: {
        title: t("storyPlayer.browser.searchTitle"),
        titleUnit: t("storyPlayer.browser.searchTitleUnit"),
        titleChar: t("storyPlayer.browser.searchTitleChar"),
      },
      loading: t("storyPlayer.browser.loading"),
      empty: t("storyPlayer.browser.empty"),
      episode: episodeLabel,
      chapter: (unit, no) => t("storyPlayer.browser.chapter", { unit, no }),
      jpOnly: t("storyPlayer.browser.jpOnly"),
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
    preloading: t("storyPlayer.stage.preloading"),
    // the player puts the number in for "{n}"
    preloadFailed: t("storyPlayer.stage.preloadFailed", { n: "{n}" }),
    retry: t("storyPlayer.stage.retry"),
    continue: t("storyPlayer.stage.continue"),
    start: t("storyPlayer.stage.start"),
    pickBeside: t("storyPlayer.stage.pickBeside"),
    pickBelow: t("storyPlayer.stage.pickBelow"),
    tabBrowser: t("storyPlayer.stage.tabBrowser"),
    tabLog: t("storyPlayer.stage.tabLog"),
    fullscreen: t("storyPlayer.stage.fullscreen"),
    exitFullscreen: t("storyPlayer.stage.exitFullscreen"),
    showUi: t("storyPlayer.stage.showUi"),
    stage: t("storyPlayer.stage.keyboard"),
    rotateHint: t("storyPlayer.stage.rotateHint"),
    credit: t("storyPlayer.stage.credit"),
  }
}

async function pick(next: string) {
  markInteracted()
  if (next === sid.value) return
  await router.push({ query: { ...route.query, scenario: next } })
  // the router scrolls query-only navigations to the top; bring the stage back
  await nextTick()
  window.setTimeout(() => runtime.value?.rowElement.scrollIntoView({ block: "start", behavior: "smooth" }), 0)
}

const resumeOffer = computed(() => {
  const saved = lastResume.value
  if (sid.value || !isWorthResuming(saved) || !catalog.value) return null
  const hit = catalog.value.bySid.get(saved.sid)
  if (!hit) return null
  return { sid: saved.sid, index: saved.index, title: hit.series.title, episode: `${episodeLabel(hit.episode.label)} ${hit.episode.title}`.trim() }
})
function continueLast() {
  const offer = resumeOffer.value
  if (!offer) return
  resumeAt.value = offer.index
  void pick(offer.sid)
}
function forgetLast() {
  lastResume.value = null
  writeStoryResume(null)
}

let disposed = false
let runtimeModule: typeof import("@/modules/story/engine/story-runtime") | null = null

// The runtime's DOM carries its labels, so a Toolbox language change rebuilds it.
function mountRuntime() {
  if (disposed || !host.value || !runtimeModule) return
  runtime.value?.destroy()
  const rt = new runtimeModule.StoryRuntime(host.value, {
    labels: runtimeLabels(),
    auto: autoAdvance.value,
    onPick: (next) => void pick(next),
    onMode: (modes) => {
      autoAdvance.value = modes.auto
    },
    onProgress: (playingSid, index) => {
      const now = Date.now()
      if (now - resumeWrittenAt < 1000 && index > 0) return
      resumeWrittenAt = now
      const saved = { sid: playingSid, index, at: now }
      lastResume.value = saved
      writeStoryResume(saved)
    },
    onRetryCatalog: retryCatalog,
  })
  if (catalog.value) rt.setCatalog(catalog.value)
  else if (catalogError.value) rt.setCatalogError(catalogError.value)
  rt.setVoice(voiceOn.value)
  rt.setVolume("voice", Number(voiceVolumePref.value) / 100)
  rt.setVolume("bgm", Number(bgmVolumePref.value) / 100)
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
watch(voiceVolumePref, (v) => runtime.value?.setVolume("voice", Number(v) / 100))
watch(bgmVolumePref, (v) => runtime.value?.setVolume("bgm", Number(v) / 100))

onBeforeUnmount(() => {
  disposed = true
  runtime.value?.destroy()
  runtime.value = null
})

watch(catalog, (value) => {
  if (value) runtime.value?.setCatalog(value)
})
watch(catalogError, (message) => {
  if (message) runtime.value?.setCatalogError(message)
})

const stateMessage = computed(() => {
  const s = state.value
  if (s.phase !== "error") return null
  if (s.reason === "notFound") return t("storyPlayer.errors.notFound")
  if (s.reason === "unreleased") return t("storyPlayer.errors.unreleased")
  if (s.reason === "missing") return t("storyPlayer.errors.missing")
  if (s.reason === "catalog") return t("storyPlayer.errors.catalog")
  return s.message ?? t("storyPlayer.errors.failed")
})
/** Load failures offer a retry; a missing / unreleased episode is just stated. */
const stateRetryable = computed(() => state.value.phase === "error" && (state.value.reason === "failed" || state.value.reason === "catalog"))
const stateDetail = computed(() => (state.value.phase === "error" ? state.value.detail ?? null : null))
watch(stateMessage, (message) => {
  if (message) runtime.value?.showError(message)
})
function retryEpisode() {
  if (state.value.phase === "error" && state.value.reason === "catalog") retryCatalog()
  else void replay()
}

const playingLang = computed(() => (state.value.phase === "playing" ? state.value.lang : null))
/** The reader wanted the AI translation; this episode plays without it. */
const aiNotice = computed(() => {
  if (!langChain.value.includes("zh-Hans-ai")) return null
  if (playingLang.value === "zh-Hans-ai") return t("storyPlayer.aiNotice")
  if (aiPending.value) return t("storyPlayer.aiPending")
  if (aiFailed.value && playingLang.value === "ja") return t("storyPlayer.aiFailed")
  return null
})

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
    <PageHeader :title="t('storyPlayer.title')" :description="t('storyPlayer.description')">
      <template #actions>
        <div class="flex items-center gap-2 pr-1">
          <Switch :id="voiceSwitchId" v-model="voiceOn" />
          <Label :for="voiceSwitchId" class="text-sm">{{ t("storyPlayer.voice") }}</Label>
        </div>
        <Popover>
          <PopoverTrigger as-child>
            <Button variant="outline" size="sm">
              <LucideVolume2 aria-hidden="true" />
              {{ t("storyPlayer.volume") }}
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-72 space-y-4" align="end">
            <div class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <Label :for="voiceVolumeId" class="flex items-center gap-1.5">
                  <LucideMic class="size-4 text-muted-foreground" aria-hidden="true" />
                  {{ t("storyPlayer.voiceVolume") }}
                </Label>
                <span class="tabular-nums text-muted-foreground">{{ voiceVolume[0] }}%</span>
              </div>
              <Slider
                :id="voiceVolumeId"
                v-model="voiceVolume"
                :min="0"
                :max="100"
                :step="1"
                :disabled="!voiceOn"
                class="story-volume-slider h-10"
                :aria-label="t('storyPlayer.voiceVolume')"
              />
            </div>
            <div class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <Label :for="bgmVolumeId" class="flex items-center gap-1.5">
                  <LucideMusic class="size-4 text-muted-foreground" aria-hidden="true" />
                  {{ t("storyPlayer.bgmVolume") }}
                </Label>
                <span class="tabular-nums text-muted-foreground">{{ bgmVolume[0] }}%</span>
              </div>
              <Slider
                :id="bgmVolumeId"
                v-model="bgmVolume"
                :min="0"
                :max="100"
                :step="1"
                class="story-volume-slider h-10"
                :aria-label="t('storyPlayer.bgmVolume')"
              />
            </div>
          </PopoverContent>
        </Popover>
        <div class="flex min-w-0 items-center gap-2">
          <LucideLanguages class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Label :id="`${langSelectId}-label`" :for="langSelectId" class="sr-only">{{ t("storyPlayer.textLang") }}</Label>
          <Select :id="langSelectId" v-model="selectedLang">
            <SelectTrigger class="max-w-[min(100%,20rem)]" :aria-labelledby="`${langSelectId}-label`">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in langOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </template>
    </PageHeader>

    <Alert class="rounded-lg bg-card/90">
      <FlaskConical aria-hidden="true" />
      <AlertTitle>{{ t("storyPlayer.beta.title") }}</AlertTitle>
      <AlertDescription>
        <i18n-t keypath="storyPlayer.beta.body" scope="global" tag="p">
          <template #tickets>
            <router-link
              v-if="userStore.isLoggedIn"
              :to="{ name: 'tickets.create' }"
              class="font-medium text-primary underline-offset-4 hover:underline"
            >
              {{ t("storyPlayer.beta.tickets") }}
            </router-link>
            <router-link
              v-else
              :to="{ name: 'user.login', query: { redirect: '/tickets/new' } }"
              class="font-medium text-primary underline-offset-4 hover:underline"
            >
              {{ t("storyPlayer.beta.ticketsLogin") }}
            </router-link>
          </template>
        </i18n-t>
      </AlertDescription>
    </Alert>

    <div
      v-if="resumeOffer"
      class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-card px-3 py-2 text-sm"
      data-testid="story-resume"
    >
      <LucideHistory class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span class="min-w-0 flex-1 truncate">
        {{ t("storyPlayer.resume.lastWatched", { title: resumeOffer.title, episode: resumeOffer.episode }) }}
      </span>
      <div class="flex items-center gap-1">
        <Button size="sm" @click="continueLast">{{ t("storyPlayer.resume.continue") }}</Button>
        <Button size="sm" variant="ghost" @click="forgetLast">{{ t("storyPlayer.resume.dismiss") }}</Button>
      </div>
    </div>

    <div v-if="engineError" class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
      {{ t("storyPlayer.errors.engine", { detail: engineError }) }}
    </div>
    <p v-else-if="aiNotice" class="text-sm text-muted-foreground" aria-live="polite">
      {{ aiNotice }}
    </p>

    <div v-if="stateMessage" class="rounded-lg border bg-card">
      <LoadErrorState
        v-if="stateRetryable"
        :description="stateMessage"
        :detail="stateDetail"
        @retry="retryEpisode"
      />
      <EmptyState v-else :title="stateMessage" size="sm" />
    </div>

    <div ref="host" class="w-full min-w-0" />
  </div>
</template>

<style scoped>
/* touch: the slider's whole 40px row is the hit box; a bigger thumb shows it */
@media (pointer: coarse) {
  .story-volume-slider :deep([data-slot="slider-thumb"]) {
    width: 1.5rem;
    height: 1.5rem;
  }
}
</style>
