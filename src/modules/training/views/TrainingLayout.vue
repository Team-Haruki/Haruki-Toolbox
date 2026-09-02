<script setup lang="ts">
import { computed, provide, shallowRef, watch } from "vue"
import { useI18n } from "vue-i18n"
import { LucideRefreshCw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import GameAccountSelect from "@/shared/components/GameAccountSelect.vue"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { useAccountUploadTime, useGameAccountSelection } from "@/shared/sekai/user-snapshot/use-user-suite"
import { suiteUploadTimeToMillis } from "@/shared/sekai/user-snapshot/api"
import type { SekaiRegion } from "@/types"
import { TRAINING_REFRESH_KEY } from "../composables/training-context"
import { TRAINING_PREFETCH_MASTER_FILES } from "../lib/prefetch-master-files"

const { t, locale } = useI18n()

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

const uploadTimeText = computed(() => {
  if (uploadTime.value == null) {
    return null
  }

  return new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeStyle: "short" })
    .format(suiteUploadTimeToMillis(uploadTime.value))
})

// The active tab tells the layout how to refresh itself.
const refreshHandler = shallowRef<(() => void) | null>(null)
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

const tabs = [
  { name: "training.challenge", labelKey: "training.tabs.challenge" },
  { name: "training.power", labelKey: "training.tabs.power" },
  { name: "training.area", labelKey: "training.tabs.area" },
  { name: "training.bonds", labelKey: "training.tabs.bonds" },
  { name: "training.leader", labelKey: "training.tabs.leader" },
  { name: "training.missions", labelKey: "training.tabs.missions" },
] as const
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
          <span v-if="uploadTimeText">{{ t("training.layout.dataAsOf", { time: uploadTimeText }) }}</span>
          <Button
            variant="ghost"
            size="sm"
            class="h-6 gap-1 px-1.5 text-xs text-muted-foreground"
            :disabled="refreshHandler == null"
            @click="refreshHandler?.()"
          >
            <LucideRefreshCw class="size-3.5" />
            {{ t("training.layout.refresh") }}
          </Button>
        </div>
      </div>
    </div>

    <!-- One scrolling row on phones instead of wrapping into two. -->
    <nav
      class="-mx-1 flex gap-1 overflow-x-auto border-b border-border px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

    <RouterView />
  </div>
</template>
