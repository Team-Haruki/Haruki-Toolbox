<script setup lang="ts">
import { ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExternalLink, FileUp, KeyRound, LucideInfo, MonitorSmartphone, Smartphone } from "lucide-vue-next"
import { UploadDataFileTab, UploadDataInheritTab, UploadDataIOSTab } from "@/modules/tools/components"
import { useUploadDataTool } from "@/modules/tools/composables/useUploadDataTool"
import { loadActiveInheritJob } from "@/modules/tools/lib/inherit-job-storage"
import { useUserStore } from "@/shared/stores/user"

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const HARUKI_PROXY_TUTORIAL_URL = "https://neo.haruki.seiunx.com/haruki-proxy/"

const {
  fileDataType,
  isSubmittingFile,
  uploadProgress,
  uploadStatus,
  selectedFileName,
  uploadAccounts,
  selectedAccount,
  selectedAccountKey,
  targetsLoading,
  targetsFailed,
  disabledReason,
  disabledReasonKind,
  hasVerifiedQQ,
  isCNMySekaiForbidden,
  canSelectSuiteDataType,
  canSelectMySekaiDataType,
  loadUploadTargets,
  onFileChange,
  submitFileUpload,
} = useUploadDataTool()

// Tabs are deep-linkable (`?tab=`): the old /ios-modules route and external
// tutorials keep working. iOS is the recommended path and therefore the default.
const TAB_VALUES = ["ios", "proxy", "inherit", "file"] as const
type TabValue = (typeof TAB_VALUES)[number]
const DEFAULT_TAB: TabValue = "ios"

function normalizeTab(value: unknown): TabValue {
  return (TAB_VALUES as readonly string[]).includes(value as string) ? (value as TabValue) : DEFAULT_TAB
}

const activeTab = ref<TabValue>(normalizeTab(route.query.tab))

watch(activeTab, (tab) => {
  const nextTab = tab === DEFAULT_TAB ? undefined : tab
  if (route.query.tab === nextTab || (route.query.tab == null && nextTab == null)) {
    return
  }
  void router.replace({ query: { ...route.query, tab: nextTab } })
})

watch(
  () => route.query.tab,
  (tab) => {
    activeTab.value = normalizeTab(tab)
  },
)

// An inherit job this browser is following (it may be waiting for the
// owner's confirmation, or showing their new transfer code) takes precedence
// over the default tab.
const userStore = useUserStore()
let jobTabChecked = false
watch(
  () => (userStore.isLoggedIn ? userStore.userId : null),
  (userId) => {
    if (!userId || jobTabChecked) return
    jobTabChecked = true
    if (route.query.tab == null && loadActiveInheritJob(userId)) {
      activeTab.value = "inherit"
    }
  },
  { immediate: true },
)

const noticeTileClass = "rounded-md border bg-muted/20 px-3 py-2 text-center"
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center justify-center gap-3 px-0 py-4">
    <!-- What this page is for, before any tab-specific warnings. -->
    <Card class="w-full max-w-2xl">
      <CardHeader class="pb-0">
        <CardTitle class="text-base">{{ t("tools.uploadData.intro.title") }}</CardTitle>
        <CardDescription class="leading-relaxed">{{ t("tools.uploadData.intro.description") }}</CardDescription>
      </CardHeader>
      <CardContent class="pt-3">
        <div class="grid gap-2 sm:grid-cols-3">
          <button type="button" :class="[noticeTileClass, 'transition-colors hover:bg-muted/40']" @click="activeTab = 'ios'">
            <span class="block text-[11px] font-medium text-muted-foreground">{{ t("tools.uploadData.intro.iosPlatform") }}</span>
            <span class="mt-0.5 block text-sm font-semibold">{{ t("tools.uploadData.intro.iosMethod") }}</span>
          </button>
          <a :href="HARUKI_PROXY_TUTORIAL_URL" target="_blank" rel="noopener noreferrer" :class="[noticeTileClass, 'transition-colors hover:bg-muted/40']">
            <span class="block text-[11px] font-medium text-muted-foreground">{{ t("tools.uploadData.intro.proxyPlatform") }}</span>
            <span class="mt-0.5 flex items-center justify-center gap-1 text-sm font-semibold">
              {{ t("tools.uploadData.intro.proxyMethod") }}
              <ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </a>
          <button type="button" :class="[noticeTileClass, 'transition-colors hover:bg-muted/40']" @click="activeTab = 'inherit'">
            <span class="block text-[11px] font-medium text-muted-foreground">{{ t("tools.uploadData.intro.fallbackPlatform") }}</span>
            <span class="mt-0.5 block text-sm font-semibold">{{ t("tools.uploadData.intro.fallbackMethod") }}</span>
          </button>
        </div>
      </CardContent>
    </Card>

    <Tabs v-model="activeTab" class="w-full max-w-2xl">
      <TabsList class="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
        <TabsTrigger value="ios" class="flex min-h-9 items-center gap-1.5 whitespace-normal py-1.5 text-xs sm:text-sm">
          <Smartphone class="h-4 w-4 shrink-0" />
          {{ t("tools.uploadData.tabs.ios") }}
        </TabsTrigger>
        <TabsTrigger value="proxy" class="flex min-h-9 items-center gap-1.5 whitespace-normal py-1.5 text-xs sm:text-sm">
          <MonitorSmartphone class="h-4 w-4 shrink-0" />
          {{ t("tools.uploadData.tabs.proxy") }}
        </TabsTrigger>
        <TabsTrigger value="inherit" class="flex min-h-9 items-center gap-1.5 whitespace-normal py-1.5 text-xs sm:text-sm">
          <KeyRound class="h-4 w-4 shrink-0" />
          {{ t("tools.uploadData.tabs.inherit") }}
        </TabsTrigger>
        <TabsTrigger value="file" class="flex min-h-9 items-center gap-1.5 whitespace-normal py-1.5 text-xs sm:text-sm">
          <FileUp class="h-4 w-4 shrink-0" />
          {{ t("tools.uploadData.tabs.file") }}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="ios">
        <UploadDataIOSTab />
      </TabsContent>

      <TabsContent value="proxy">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <MonitorSmartphone class="h-6 w-6" />
              {{ t("tools.uploadData.proxyTab.title") }}
            </CardTitle>
            <CardDescription>{{ t("tools.uploadData.proxyTab.description") }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <ol class="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>{{ t("tools.uploadData.proxyTab.steps.install") }}</li>
              <li>{{ t("tools.uploadData.proxyTab.steps.bind") }}</li>
              <li>{{ t("tools.uploadData.proxyTab.steps.run") }}</li>
            </ol>
            <Button as-child class="w-full sm:w-auto">
              <a :href="HARUKI_PROXY_TUTORIAL_URL" target="_blank" rel="noopener noreferrer">
                {{ t("tools.uploadData.proxyTab.tutorialButton") }}
                <ExternalLink class="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="inherit">
        <UploadDataInheritTab :can-show-my-sekai-data-type="hasVerifiedQQ" />
      </TabsContent>

      <TabsContent value="file">
        <UploadDataFileTab
          v-model:data-type="fileDataType"
          v-model:selected-account-key="selectedAccountKey"
          :upload-accounts="uploadAccounts"
          :selected-account="selectedAccount"
          :selected-file-name="selectedFileName"
          :targets-loading="targetsLoading"
          :targets-failed="targetsFailed"
          :can-show-my-sekai-data-type="hasVerifiedQQ"
          :can-select-suite-data-type="canSelectSuiteDataType"
          :can-select-my-sekai-data-type="canSelectMySekaiDataType"
          :disabled-reason="disabledReason"
          :disabled-reason-kind="disabledReasonKind"
          :is-cn-my-sekai-forbidden="isCNMySekaiForbidden"
          :is-submitting-file="isSubmittingFile"
          :upload-progress="uploadProgress"
          :upload-status="uploadStatus"
          @file-change="onFileChange"
          @refresh-targets="loadUploadTargets"
          @submit="submitFileUpload"
        />
      </TabsContent>
    </Tabs>

    <Alert variant="default" class="w-full max-w-2xl rounded-lg bg-card/90 px-4 py-3">
      <AlertDescription class="col-start-1 col-end-3 w-full gap-0 justify-items-stretch">
        <div class="flex items-center justify-center gap-2 text-muted-foreground">
          <LucideInfo class="h-4 w-4" />
          <span class="text-xs font-medium">{{ t("tools.uploadData.groupTitle") }}</span>
        </div>

        <div class="mt-2 grid grid-cols-2 gap-2">
          <div :class="noticeTileClass">
            <span class="block text-[11px] font-medium text-muted-foreground">{{ t("tools.uploadData.group1Label") }}</span>
            <span class="mt-0.5 block text-sm font-semibold text-foreground">730020933</span>
          </div>
          <div :class="noticeTileClass">
            <span class="block text-[11px] font-medium text-muted-foreground">{{ t("tools.uploadData.group2Label") }}</span>
            <span class="mt-0.5 block text-sm font-semibold text-foreground">1023178678</span>
          </div>
        </div>
      </AlertDescription>
    </Alert>

  </div>
</template>
