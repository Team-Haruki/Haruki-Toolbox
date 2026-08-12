<script setup lang="ts">
import { ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExternalLink, FileUp, KeyRound, LucideInfo, Smartphone } from "lucide-vue-next"
import { UploadDataFileTab, UploadDataInheritTab, UploadDataIOSTab } from "@/modules/tools/components"
import { useUploadDataTool } from "@/modules/tools/composables/useUploadDataTool"

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const {
  fileDataType,
  inheritDataType,
  inheritServer,
  inheritId,
  inheritPassword,
  rememberInherit,
  isSubmittingFile,
  isSubmittingInherit,
  uploadProgress,
  uploadStatus,
  boundAccounts,
  selectedAccountKey,
  disabledReason,
  isCNMySekaiForbidden,
  canSelectMySekaiDataType,
  onFileChange,
  setRememberInherit,
  submitFileUpload,
  submitInheritUpload,
} = useUploadDataTool()

// The iOS module tab is deep-linkable (`?tab=ios`) so the old /ios-modules
// route and external tutorials keep working after the page merge.
const TAB_VALUES = ["file", "inherit", "ios"] as const
type TabValue = (typeof TAB_VALUES)[number]
const DEFAULT_TAB: TabValue = "inherit"

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

const noticeTileClass = "rounded-md border bg-muted/20 px-3 py-2 text-center"
const tutorialLinkClass = "group rounded-md border bg-background/70 px-3 py-2 text-center transition-colors hover:border-blue-200 hover:bg-blue-50 dark:hover:border-blue-900 dark:hover:bg-blue-950/40"
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center justify-center gap-3 px-0 py-4">
    <Tabs v-model="activeTab" class="w-full max-w-2xl">
      <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="inherit" class="flex items-center gap-2">
          <KeyRound class="h-4 w-4" />
          {{ t("tools.uploadData.tabs.inherit") }}
        </TabsTrigger>
        <TabsTrigger value="file" class="flex items-center gap-2">
          <FileUp class="h-4 w-4" />
          {{ t("tools.uploadData.tabs.file") }}
        </TabsTrigger>
        <TabsTrigger value="ios" class="flex items-center gap-2">
          <Smartphone class="h-4 w-4" />
          {{ t("tools.uploadData.tabs.ios") }}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="inherit">
        <UploadDataInheritTab
          v-model:data-type="inheritDataType"
          v-model:inherit-server="inheritServer"
          v-model:inherit-id="inheritId"
          v-model:inherit-password="inheritPassword"
          :remember-inherit="rememberInherit"
          :is-submitting-inherit="isSubmittingInherit"
          @update:remember-inherit="setRememberInherit"
          @submit="submitInheritUpload"
        />
      </TabsContent>

      <TabsContent value="file">
        <UploadDataFileTab
          v-model:data-type="fileDataType"
          v-model:selected-account-key="selectedAccountKey"
          :bound-accounts="boundAccounts"
          :can-select-my-sekai-data-type="canSelectMySekaiDataType"
          :disabled-reason="disabledReason"
          :is-cn-my-sekai-forbidden="isCNMySekaiForbidden"
          :is-submitting-file="isSubmittingFile"
          :upload-progress="uploadProgress"
          :upload-status="uploadStatus"
          @file-change="onFileChange"
          @submit="submitFileUpload"
        />
      </TabsContent>

      <TabsContent value="ios">
        <UploadDataIOSTab />
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

        <div class="mt-2 border-t pt-2">
          <div class="mb-2 text-center text-[11px] font-medium text-muted-foreground">
            {{ t("tools.uploadData.tutorialNotice.title") }}
          </div>

          <div class="grid grid-cols-2 gap-2">
            <a href="https://neo.haruki.seiunx.com/haruki-proxy/" target="_blank" rel="noopener noreferrer" :class="tutorialLinkClass">
              <span class="block text-[11px] font-medium text-muted-foreground">
                {{ t("tools.uploadData.tutorialNotice.androidProxy.platform") }}
              </span>
              <span class="mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-foreground transition-colors group-hover:text-blue-700 dark:group-hover:text-blue-300">
                {{ t("tools.uploadData.tutorialNotice.androidProxy.linkText") }}
                <ExternalLink class="h-3.5 w-3.5" />
              </span>
            </a>

            <button type="button" :class="tutorialLinkClass" @click="activeTab = 'ios'">
              <span class="block text-[11px] font-medium text-muted-foreground">
                {{ t("tools.uploadData.tutorialNotice.iosModule.platform") }}
              </span>
              <span class="mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-foreground transition-colors group-hover:text-blue-700 dark:group-hover:text-blue-300">
                {{ t("tools.uploadData.tutorialNotice.iosModule.linkText") }}
              </span>
            </button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  </div>
</template>
