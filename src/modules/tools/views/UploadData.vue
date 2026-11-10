<script setup lang="ts">
import { ref, watch, type Component } from "vue"
import { RouterLink, useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { Badge, type BadgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUp, KeyRound, LifeBuoy, MonitorSmartphone, TabletSmartphone, Ticket } from "lucide-vue-next"
import PageHeader from "@/shared/components/PageHeader.vue"
import { UploadDataFileTab, UploadDataInheritTab, UploadDataIOSTab, UploadDataProxyTab } from "@/modules/tools/components"
import { useUploadDataTool } from "@/modules/tools/composables/useUploadDataTool"
import { loadActiveInheritJob } from "@/modules/tools/lib/inherit-job-storage"
import { useUserStore } from "@/shared/stores/user"

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

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
  resetUploadOutcome,
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

// The legacy /upload_suite and /upload_mysekai pages land here with the data
// type they were about (`?type=`); it is read once, the selector takes over.
if (route.query.type === "suite" || route.query.type === "mysekai") {
  fileDataType.value = route.query.type
}

watch(activeTab, (tab, previous) => {
  // The file tab's last outcome is about a target the user has now left.
  if (previous === "file") resetUploadOutcome()
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

// The four ways in, in the order we recommend them. The picker is the page's
// tab list: one card per method, with who it is for.
type MethodTag = "recommended" | "fallback" | "advanced"
const METHODS: readonly { value: TabValue; icon: Component; tag: MethodTag }[] = [
  { value: "ios", icon: TabletSmartphone, tag: "recommended" },
  { value: "proxy", icon: MonitorSmartphone, tag: "recommended" },
  { value: "inherit", icon: KeyRound, tag: "fallback" },
  { value: "file", icon: FileUp, tag: "advanced" },
]
const TAG_VARIANT: Record<MethodTag, BadgeVariants["variant"]> = {
  recommended: "default",
  fallback: "amber",
  advanced: "muted",
}
const QQ_GROUPS = [
  { key: "group1Label", id: "730020933" },
  { key: "group2Label", id: "1023178678" },
] as const
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-0 py-4" data-testid="upload-data-page">
    <PageHeader :title="t('tools.uploadData.intro.title')" :description="t('tools.uploadData.intro.description')" />

    <Tabs
      v-model="activeTab"
      class="grid gap-x-6 gap-y-4 lg:grid-cols-[19rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:items-start"
    >
      <!-- Pick a method: who it is for, then what it is. -->
      <div class="min-w-0 lg:col-start-1 lg:row-start-1">
        <p id="upload-methods-label" class="px-0.5 pb-2 text-[13px] font-medium text-muted-foreground">
          {{ t("tools.uploadData.methods.label") }}
        </p>
        <TabsList
          aria-labelledby="upload-methods-label"
          class="grid h-auto w-full grid-cols-2 items-stretch gap-2 rounded-none bg-transparent p-0 lg:grid-cols-1"
        >
          <TabsTrigger
            v-for="method in METHODS"
            :key="method.value"
            :value="method.value"
            :data-testid="`upload-method-${method.value}`"
            class="group h-auto min-w-0 flex-none flex-col items-start justify-start gap-2 whitespace-normal min-[360px]:flex-row min-[360px]:gap-3 rounded-xl border-border bg-card p-3 text-left font-normal text-foreground hover:bg-muted/40 data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-none dark:text-foreground dark:data-[state=active]:border-primary dark:data-[state=active]:bg-primary/10"
          >
            <span
              class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground"
              aria-hidden="true"
            >
              <component :is="method.icon" class="size-4.5" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span class="min-w-0 break-words text-sm font-semibold">{{ t(`tools.uploadData.methods.${method.value}.name`) }}</span>
                <Badge :variant="TAG_VARIANT[method.tag]" size="sm">{{ t(`tools.uploadData.methods.tags.${method.tag}`) }}</Badge>
              </span>
              <span class="mt-0.5 block text-xs text-muted-foreground">{{ t(`tools.uploadData.methods.${method.value}.platform`) }}</span>
              <span class="mt-1 hidden text-xs leading-relaxed text-muted-foreground lg:block">{{ t(`tools.uploadData.methods.${method.value}.note`) }}</span>
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      <div class="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <TabsContent value="ios">
          <UploadDataIOSTab />
        </TabsContent>

        <TabsContent value="proxy">
          <UploadDataProxyTab />
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
      </div>

      <!-- Where to ask: usage questions go to the groups, bugs to tickets. -->
      <aside
        class="min-w-0 rounded-xl border bg-card p-4 lg:col-start-1 lg:row-start-2"
        aria-labelledby="upload-help-title"
        data-testid="upload-help"
      >
        <h2 id="upload-help-title" class="flex items-center gap-2 text-sm font-semibold">
          <LifeBuoy class="size-4 text-muted-foreground" aria-hidden="true" />
          {{ t("tools.uploadData.help.title") }}
        </h2>
        <p class="mt-1 text-xs leading-relaxed text-muted-foreground">{{ t("tools.uploadData.help.description") }}</p>
        <dl class="mt-3 divide-y divide-border/60 rounded-lg border bg-muted/20">
          <div v-for="group in QQ_GROUPS" :key="group.id" class="flex items-center justify-between gap-3 px-3 py-2">
            <dt class="text-xs text-muted-foreground">{{ t("tools.uploadData.groupTitle") }} {{ t(`tools.uploadData.${group.key}`) }}</dt>
            <dd class="select-all font-mono text-sm font-medium tabular-nums">{{ group.id }}</dd>
          </div>
        </dl>
        <Button as-child variant="outline" size="sm" class="mt-3 w-full">
          <RouterLink to="/tickets">
            <Ticket class="size-4" aria-hidden="true" />
            {{ t("tools.uploadData.help.ticket") }}
          </RouterLink>
        </Button>
      </aside>
    </Tabs>
  </div>
</template>
