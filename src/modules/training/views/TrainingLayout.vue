<script setup lang="ts">
import { computed, nextTick, provide, ref, shallowRef, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute } from "vue-router"
import { LucideRefreshCw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import GameAccountSelect from "@/shared/components/GameAccountSelect.vue"
import { useScrollEdges, scrollChildIntoView } from "@/composables/useScrollEdges"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { useAccountUploadTime, useGameAccountSelection } from "@/shared/sekai/user-snapshot/use-user-suite"
import { useSuiteRefresh, type SuiteRefreshTask } from "@/shared/sekai/user-snapshot/use-suite-refresh"
import { useUploadTimeText } from "@/shared/sekai/user-snapshot/upload-time"
import type { SekaiRegion } from "@/types"
import { TRAINING_REFRESH_KEY } from "../composables/training-context"
import { TRAINING_PREFETCH_MASTER_FILES } from "../lib/prefetch-master-files"

const { t } = useI18n()
const route = useRoute()

const { selectedAccount } = useGameAccountSelection({ capability: "suite" })
const uploadTime = useAccountUploadTime(selectedAccount)

// Warm the master-data cache for every training tab as soon as the section
// opens, so opening a tab for the first time resolves from cache instead of a
// cold fetch. ensureRegionData dedupes/merges with each page's own request.
const sekaiDataStore = useSekaiDataStore()
const accountRegion = computed<SekaiRegion | null>(() => selectedAccount.value?.server ?? null)

watch(
  accountRegion,
  (region) => {
    if (region == null) {
      return
    }

    void sekaiDataStore
      .ensureRegionData(region, { files: [...TRAINING_PREFETCH_MASTER_FILES], musicMetas: false })
      .catch(() => {})
  },
  { immediate: true },
)

const uploadTimeText = useUploadTimeText(uploadTime)

// The active tab tells the layout how to refresh itself.
const refreshHandler = shallowRef<SuiteRefreshTask | null>(null)
provide(TRAINING_REFRESH_KEY, {
  register(handler) {
    refreshHandler.value = handler
    return () => {
      if (refreshHandler.value === handler) {
        refreshHandler.value = null
      }
    }
  },
})

const { refreshing, refresh } = useSuiteRefresh([() => refreshHandler.value?.()])

const tabs = [
  { name: "training.challenge", labelKey: "training.tabs.challenge" },
  { name: "training.power", labelKey: "training.tabs.power" },
  { name: "training.area", labelKey: "training.tabs.area" },
  { name: "training.bonds", labelKey: "training.tabs.bonds" },
  { name: "training.leader", labelKey: "training.tabs.leader" },
  { name: "training.missions", labelKey: "training.tabs.missions" },
] as const

// The tab strip scrolls on phones: fade the hidden edge and keep the active
// tab in view so the last tabs are never silently cut off.
const tabStrip = ref<HTMLElement | null>(null)
const { edgeClass } = useScrollEdges(tabStrip)

watch(() => route.name, () => {
  void nextTick(() => {
    const active = tabStrip.value?.querySelector<HTMLElement>("[aria-current='page']") ?? null
    scrollChildIntoView(tabStrip.value, active)
  })
}, { immediate: true })
</script>

<template>
  <div class="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col justify-center gap-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t("training.layout.title") }}</h1>
        <p class="text-sm text-muted-foreground">{{ t("training.layout.description") }}</p>
      </div>
      <div class="flex flex-col items-start gap-1.5 sm:items-end">
        <GameAccountSelect capability="suite" />
        <div v-if="selectedAccount" class="flex items-center gap-1 text-xs text-muted-foreground">
          <span v-if="uploadTimeText">{{ t("uploadedGameData.uploadedAt", { time: uploadTimeText }) }}</span>
          <Button
            variant="ghost"
            size="sm"
            class="h-6 gap-1 px-1.5 text-xs text-muted-foreground"
            :disabled="refreshHandler == null || refreshing"
            @click="refresh"
          >
            <LucideRefreshCw :class="['size-3.5', refreshing ? 'animate-spin' : '']" />
            {{ t("training.layout.refresh") }}
          </Button>
        </div>
      </div>
    </div>

    <!-- One scrolling row on phones instead of wrapping into two. -->
    <div :class="['relative -mx-1', edgeClass]">
      <nav
        ref="tabStrip"
        class="flex gap-1 overflow-x-auto border-b border-border px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        :aria-label="t('training.layout.title')"
      >
        <RouterLink
          v-for="tab in tabs"
          :key="tab.name"
          :to="{ name: tab.name }"
          class="shrink-0 whitespace-nowrap rounded-t-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          active-class="border-b-2 border-primary font-medium text-foreground"
        >
          {{ t(tab.labelKey) }}
        </RouterLink>
      </nav>
    </div>

    <RouterView />
  </div>
</template>
