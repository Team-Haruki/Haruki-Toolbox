<script setup lang="ts">
import "@/modules/home/home-trays.css"
import { computed, inject, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import { Heart, LucideSearch } from "lucide-vue-next"

import PageHeader from "@/shared/components/PageHeader.vue"
import { OPEN_GLOBAL_SEARCH_KEY } from "@/lib/global-search"
import { useUserStore } from "@/shared/stores/user"
import { useGameAccountSelection, useUserSuite } from "@/shared/sekai/user-snapshot/use-user-suite"
import { suiteUploadTimeToMillis } from "@/shared/sekai/user-snapshot/api"
import HomeAccountStrip from "@/modules/home/components/HomeAccountStrip.vue"
import HomeLiveStage from "@/modules/home/components/HomeLiveStage.vue"
import HomeToolTray, { type HomeToolStatus } from "@/modules/home/components/HomeToolTray.vue"
import { useLiveContent } from "@/modules/home/composables/useLiveContent"
import { HOME_TOOL_URLS, resolveHomeTrays, type HomeTool } from "@/modules/home/lib/home-trays"
import { rankFrequentTools, readToolUsage } from "@/modules/home/lib/tool-usage"

const FREQUENT_LIMIT = 5

const { t, locale } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const openGlobalSearch = inject(OPEN_GLOBAL_SEARCH_KEY, null)

const isLoggedIn = computed(() => userStore.isLoggedIn)
const hasBinding = computed(() =>
  Array.isArray(userStore.gameAccountBindings) && userStore.gameAccountBindings.length > 0
)

const trays = resolveHomeTrays()
// The event tools stand next to the featured event; the other trays follow below.
const eventTray = trays.find((tray) => tray.id === "event")
const referenceTrays = trays.filter((tray) => tray.id !== "event")
const tools: HomeTool[] = trays.flatMap((tray) => tray.tools)
const toolByUrl = new Map(tools.map((tool) => [tool.url, tool]))
// Read from the router so the lock follows the route's own guard.
const signInOnlyUrls = new Set(
  tools
    .filter((tool) => router.resolve(tool.url).matched.some((record) => record.meta.requiresAuth))
    .map((tool) => tool.url)
)

// Light suite subset purely to surface the account's last upload time; the
// cache layer keeps this cheap on repeat visits.
const { selectedAccount } = useGameAccountSelection({ capability: "suite" })
const { uploadTime, status: suiteStatus } = useUserSuite(["userGamedata"], selectedAccount)
const uploadTimeText = computed(() => {
  if (uploadTime.value == null) {
    return null
  }
  return new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeStyle: "short" })
    .format(suiteUploadTimeToMillis(uploadTime.value))
})
// Only claim "no data" once the lookup has answered; a failed lookup says nothing.
const lacksGameData = computed(() =>
  isLoggedIn.value && (!hasBinding.value || (suiteStatus.value === "ready" && uploadTime.value == null))
)

const {
  state: liveState,
  region: liveRegion,
  liveEvent,
  cards: liveCards,
  gachas: liveGachas,
  songs: liveSongs,
  load: loadLiveContent,
} = useLiveContent()

const statuses = computed(() => {
  const result: Record<string, HomeToolStatus | undefined> = {}
  for (const tool of tools) {
    if (!isLoggedIn.value && signInOnlyUrls.has(tool.url)) {
      result[tool.url] = { kind: "lock", text: t("home.status.needsLogin") }
    } else if (tool.needsData && lacksGameData.value) {
      result[tool.url] = { kind: "data", text: t("home.status.needsData") }
    }
  }
  if (liveEvent.value?.phase === "running" && liveEvent.value.timeLabel) {
    result["/rank-border"] ??= { kind: "live", text: liveEvent.value.timeLabel }
  }
  return result
})

// When most of a tray shares one requirement, the tray says it once.
const TRAY_NOTICE_THRESHOLD = 3
const trayNotices = computed(() => {
  const result: Record<string, HomeToolStatus | null> = {}
  for (const tray of trays) {
    const shared = (["lock", "data"] as const)
      .map((kind) => tray.tools.map((tool) => statuses.value[tool.url]).filter((status) => status?.kind === kind))
      .find((matches) => matches.length >= TRAY_NOTICE_THRESHOLD)
    result[tray.id] = shared?.[0] ?? null
  }
  return result
})

// The visitor's own most-used tools, from this browser's history only.
const frequentTools = ref<HomeTool[]>([])
onMounted(() => {
  frequentTools.value = rankFrequentTools(readToolUsage(), HOME_TOOL_URLS, FREQUENT_LIMIT)
    .map((url) => toolByUrl.get(url))
    .filter((tool): tool is HomeTool => tool != null)
})

const searchShortcut = computed(() =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K"
)
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-5 px-0 py-4 sm:gap-6" data-testid="home-toolbox">
    <PageHeader :title="t('home.title')" :description="t('home.description')">
      <template v-if="openGlobalSearch" #actions>
        <button
          type="button"
          class="flex h-10 w-full items-center gap-2 rounded-lg border bg-card px-3 text-left text-sm text-muted-foreground shadow-xs outline-none transition-colors hover:border-ring/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:w-80"
          data-testid="home-search"
          @click="openGlobalSearch()"
        >
          <LucideSearch class="size-4 shrink-0" />
          <span class="min-w-0 flex-1 truncate">{{ t("home.search.placeholder") }}</span>
          <kbd class="hidden rounded border bg-muted px-1.5 py-0.5 font-sans text-[11px] font-medium pointer-fine:inline">
            {{ searchShortcut }}
          </kbd>
        </button>
      </template>
    </PageHeader>

    <HomeLiveStage
      :state="liveState"
      :region="liveRegion"
      :live-event="liveEvent"
      :cards="liveCards"
      :gachas="liveGachas"
      :songs="liveSongs"
      @load="loadLiveContent"
    >
      <template v-if="eventTray" #aside>
        <HomeToolTray :tray="eventTray" :statuses="statuses" :notice="trayNotices[eventTray.id]" layout="side" />
      </template>
    </HomeLiveStage>

    <HomeAccountStrip :is-logged-in="isLoggedIn" :has-binding="hasBinding" :upload-time-text="uploadTimeText" />

    <!-- The visitor's own shortcuts; hidden until there is a habit to show. -->
    <nav
      v-if="frequentTools.length >= 2"
      class="-my-1 flex items-center gap-2 overflow-x-auto py-1 sm:flex-wrap sm:overflow-visible"
      :aria-label="t('home.frequent')"
      data-testid="home-frequent"
    >
      <span class="mr-1 shrink-0 text-xs font-semibold text-muted-foreground">{{ t("home.frequent") }}</span>
      <RouterLink
        v-for="tool in frequentTools"
        :key="tool.url"
        :to="tool.url"
        :data-home-tray="tool.tray"
        class="home-tray-cell inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border bg-card pl-1.5 pr-3.5 text-sm font-medium shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-10"
      >
        <span class="home-tray-well flex size-6 items-center justify-center rounded-full" aria-hidden="true">
          <component :is="tool.icon" class="size-3.5" />
        </span>
        {{ t(tool.titleKey) }}
      </RouterLink>
    </nav>

    <HomeToolTray
      v-for="tray in referenceTrays"
      :key="tray.id"
      :tray="tray"
      :statuses="statuses"
      :notice="trayNotices[tray.id]"
    />

    <!-- Guide banner for About/Sponsorship -->
    <router-link to="/sponsors" class="w-full group block outline-none rounded-xl focus-visible:ring-2 focus-visible:ring-ring">
      <div class="relative overflow-hidden rounded-xl border border-primary/25 bg-primary/5 p-4 transition-colors duration-300 hover:border-primary/50 hover:bg-primary/10">
        <div class="flex items-center gap-4">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform duration-300">
            <Heart class="h-5 w-5 fill-primary/15 group-hover:fill-primary/30 transition-colors" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
                {{ t("home.aboutBanner.badge") }}
              </span>
            </div>
            <p class="text-sm font-semibold text-foreground mt-1.5 leading-snug">
              {{ t("home.aboutBanner.title") }}
              <span class="inline-block text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
            </p>
          </div>
        </div>
      </div>
    </router-link>
  </div>
</template>
