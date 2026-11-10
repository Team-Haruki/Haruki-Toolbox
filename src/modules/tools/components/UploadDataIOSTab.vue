<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink, useRoute } from "vue-router"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BellRing, BookOpen, Check, Copy, ExternalLink, Link2, LogIn, LucideChevronDown, PackageCheck, RefreshCw, Scissors, Server, SlidersHorizontal, TabletSmartphone } from "lucide-vue-next"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import UploadPanelHeader from "@/modules/tools/components/upload/UploadPanelHeader.vue"
import UploadStep from "@/modules/tools/components/upload/UploadStep.vue"
import ChoiceCards, { type ChoiceOption } from "@/modules/tools/components/upload/ChoiceCards.vue"
import SettingsRow from "@/shared/components/settings/SettingsRow.vue"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { UploadMode } from "@/modules/tools/lib/ios-module-meta"
import { useIOSModuleGenerator } from "@/modules/tools/composables/useIOSModuleGenerator"

const { t, locale } = useI18n()
const route = useRoute()
const loginRoute = computed(() => ({ name: "user.login", query: { redirect: route.fullPath } }))

const {
  userStore,
  selectedSoftware,
  selectedEndpoint,
  selectedMode,
  selectedRegions,
  selectedDataTypes,
  chunkSize,
  uploadNotifications,
  supportsUploadNotifications,
  uploadNotificationsNeedReinstall,
  isGeneratingCode,
  softwareOptions,
  endpointOptions,
  modeOptions,
  regionOptions,
  dataTypeOptionsWithDesc,
  hasUploadCode,
  isCnRestricted,
  moduleUrl,
  scriptUrl,
  canInstall,
  generateCode,
  regenerateCode,
  copyToClipboard,
  toggleRegion,
  toggleDataType,
  installModule,
} = useIOSModuleGenerator()

// Regenerating invalidates the installed module's code, so it asks first.
const regenerateDialogOpen = ref(false)

// "Sign in and bind an account first" is a reminder only while it is still to do.
const hasVerifiedBinding = computed(() => (userStore.gameAccountBindings ?? []).some((binding) => binding.verified))
const needsPrerequisite = computed(() => !userStore.isLoggedIn || !hasVerifiedBinding.value)

// Proxy first: it is the one to pick when unsure.
const modeChoices = computed<ChoiceOption<UploadMode>[]>(() =>
  [...modeOptions.value]
    .sort((left, right) => Number(right.value === "proxy") - Number(left.value === "proxy"))
    .map((option) => ({
      value: option.value,
      label: option.label,
      hint: t(`tools.iosModules.modeHints.${option.value}`),
      disabled: option.value === "script" && selectedSoftware.value === "qx",
    }))
)

// Server route, chunk size and notifications rarely change: they stay folded
// away, with their current values shown on the handle.
const advancedOpen = ref(false)
const advancedSummary = computed(() => {
  const items = [endpointOptions.value.find((option) => option.value === selectedEndpoint.value)?.label ?? ""]
  if (selectedMode.value === "script") {
    items.push(`${chunkSize.value} ${t("tools.iosModules.sections.chunk.unit")}`)
  }
  if (supportsUploadNotifications.value) {
    items.push(t(uploadNotifications.value ? "tools.iosModules.advanced.notifyOn" : "tools.iosModules.advanced.notifyOff"))
  }
  return items.filter(Boolean)
})

function handleCopyUploadCode() {
  if (!userStore.iosUploadCode) return
  void copyToClipboard(userStore.iosUploadCode, t("tools.iosModules.copyLabel.uploadCode"))
}

function handleCopyModuleUrl() {
  if (!moduleUrl.value) return
  void copyToClipboard(moduleUrl.value, t("tools.iosModules.copyLabel.moduleUrl"))
}

function handleCopyScriptUrl() {
  if (!scriptUrl.value) return
  void copyToClipboard(scriptUrl.value, t("tools.iosModules.copyLabel.scriptUrl"))
}
</script>

<template>
  <Card>
    <CardHeader>
      <UploadPanelHeader :icon="TabletSmartphone" :title="t('tools.iosModules.title')" :description="t('tools.iosModules.description')">
        <p v-if="!locale.startsWith('zh')" class="mt-1 text-xs text-muted-foreground">
          {{ t("tools.iosModules.tutorialAlert.nonZhWarning") }}
        </p>
        <template #action>
          <Button as-child variant="outline" size="sm">
            <a href="https://neo.haruki.seiunx.com/toolbox-tutorial/ios-module.html" target="_blank" rel="noopener noreferrer">
              <BookOpen class="size-4" aria-hidden="true" />
              {{ t("tools.iosModules.tutorialAlert.action") }}
              <ExternalLink class="size-3.5 text-muted-foreground" aria-hidden="true" />
            </a>
          </Button>
        </template>
      </UploadPanelHeader>
    </CardHeader>

    <CardContent class="@container space-y-6">
      <UploadStep :step="1" :title="t('tools.iosModules.steps.configure.title')" :description="t('tools.iosModules.steps.configure.description')">
        <div class="space-y-1.5">
          <p class="text-sm font-medium">{{ t("tools.iosModules.sections.software.title") }}</p>
          <ChoiceCards
            v-model="selectedSoftware"
            name="ios-software"
            :label="t('tools.iosModules.sections.software.title')"
            :options="softwareOptions"
            compact
          />
        </div>

        <div class="space-y-1.5">
          <p class="text-sm font-medium">{{ t("tools.iosModules.sections.mode.title") }}</p>
          <ChoiceCards
            v-model="selectedMode"
            name="ios-mode"
            :label="t('tools.iosModules.sections.mode.title')"
            :options="modeChoices"
          />
          <p v-if="selectedSoftware === 'qx'" class="text-xs text-amber-700 dark:text-amber-300">
            {{ t("tools.iosModules.qxScriptWarning") }}
          </p>
        </div>

        <!-- Rarely changed: closed until asked for, with the current values on the handle. -->
        <Collapsible v-model:open="advancedOpen" class="overflow-hidden rounded-xl border bg-muted/20" data-testid="ios-advanced">
          <CollapsibleTrigger class="flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <span class="flex items-center gap-2 text-sm font-medium">
              <SlidersHorizontal class="size-4 text-muted-foreground" aria-hidden="true" />
              {{ t("tools.iosModules.advanced.title") }}
            </span>
            <span class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              <Badge v-for="item in advancedSummary" :key="item" variant="muted" size="sm">{{ item }}</Badge>
            </span>
            <LucideChevronDown :class="['size-4 shrink-0 text-muted-foreground transition-transform duration-200', advancedOpen ? 'rotate-180' : '']" aria-hidden="true" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div class="divide-y divide-border/60 border-t border-border/60">
              <SettingsRow
                :icon="Server"
                :label="t('tools.iosModules.sections.endpoint.title')"
                :help="t('tools.iosModules.sections.endpoint.description')"
                label-for="ios-endpoint"
                label-id="ios-endpoint-label"
                stack
              >
                <Select id="ios-endpoint" v-model="selectedEndpoint" :aria-label="t('tools.iosModules.sections.endpoint.title')">
                  <SelectTrigger class="w-full @min-[28rem]:w-48" aria-labelledby="ios-endpoint-label">
                    <SelectValue :placeholder="t('tools.iosModules.sections.endpoint.placeholder')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="option in endpointOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </SettingsRow>

              <SettingsRow
                v-if="selectedMode === 'script'"
                :icon="Scissors"
                :label="t('tools.iosModules.sections.chunk.title')"
                :help="t('tools.iosModules.sections.chunk.description')"
                label-for="ios-chunk-size"
                stack
              >
                <div class="flex w-full items-center gap-2 @min-[28rem]:w-48">
                  <Input id="ios-chunk-size" v-model.number="chunkSize" type="number" min="1" max="10" class="min-w-0 flex-1" :aria-label="t('tools.iosModules.sections.chunk.title')" />
                  <span class="whitespace-nowrap text-sm text-muted-foreground">{{ t("tools.iosModules.sections.chunk.unit") }}</span>
                </div>
              </SettingsRow>

              <SettingsRow
                v-if="supportsUploadNotifications"
                :icon="BellRing"
                :label="t('tools.iosModules.sections.notify.title')"
                :help="t(uploadNotificationsNeedReinstall ? 'tools.iosModules.sections.notify.descriptionQx' : 'tools.iosModules.sections.notify.description')"
                label-for="ios-upload-notifications"
              >
                <Switch id="ios-upload-notifications" v-model="uploadNotifications" />
              </SettingsRow>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </UploadStep>

      <Separator />

      <UploadStep :step="2" :title="t('tools.iosModules.steps.scope.title')" :description="t('tools.iosModules.steps.scope.description')">
        <div class="flex flex-col gap-1.5">
          <p class="text-sm font-medium">{{ t("tools.iosModules.sections.regions.title") }}</p>
          <p class="text-xs text-muted-foreground">{{ t("tools.iosModules.sections.regions.description") }}</p>
          <div class="flex flex-wrap gap-2 pt-1" role="group" :aria-label="t('tools.iosModules.sections.regions.title')">
            <button
              v-for="opt in regionOptions"
              :key="opt.value"
              type="button"
              class="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors pointer-coarse:min-h-10"
              :class="selectedRegions.includes(opt.value) ? 'border-primary bg-primary/10 text-primary' : 'bg-muted/20 hover:bg-muted/50'"
              :aria-pressed="selectedRegions.includes(opt.value)"
              @click="toggleRegion(opt.value)"
            >
              <span
                aria-hidden="true"
                class="flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-colors"
                :class="selectedRegions.includes(opt.value) ? 'border-primary bg-primary text-primary-foreground' : 'border-input'"
              >
                <Check v-if="selectedRegions.includes(opt.value)" class="size-3.5" />
              </span>
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <p class="text-sm font-medium">{{ t("tools.iosModules.sections.dataTypes.title") }}</p>
          <p class="text-xs text-muted-foreground">{{ t("tools.iosModules.sections.dataTypes.description") }}</p>
          <div class="grid gap-2 pt-1 sm:grid-cols-2" role="group" :aria-label="t('tools.iosModules.sections.dataTypes.title')">
            <button
              v-for="opt in dataTypeOptionsWithDesc"
              :key="opt.value"
              type="button"
              class="flex cursor-pointer flex-col rounded-md border p-3 text-left transition-colors"
              :class="selectedDataTypes.includes(opt.value) ? 'border-primary bg-primary/5' : 'bg-muted/20 hover:bg-muted/50'"
              :aria-pressed="selectedDataTypes.includes(opt.value)"
              @click="toggleDataType(opt.value)"
            >
              <span class="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  class="flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-colors"
                  :class="selectedDataTypes.includes(opt.value) ? 'border-primary bg-primary text-primary-foreground' : 'border-input'"
                >
                  <Check v-if="selectedDataTypes.includes(opt.value)" class="size-3.5" />
                </span>
                <span class="text-sm font-medium">{{ opt.label }}</span>
              </span>
              <span class="ml-6 mt-1 text-xs text-muted-foreground">{{ opt.desc }}</span>
            </button>
          </div>
        </div>

        <p
          v-if="isCnRestricted"
          class="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700/60 dark:bg-red-900/20 dark:text-red-300"
        >
          {{ t("tools.iosModules.cnRestriction") }}
        </p>
      </UploadStep>

      <Separator />

      <UploadStep :step="3" :title="t('tools.iosModules.steps.code.title')" :description="t('tools.iosModules.uploadCode.description')">
        <template v-if="needsPrerequisite" #note>
          <p class="text-xs font-medium text-amber-700 dark:text-amber-300" data-testid="ios-install-prerequisite">{{ t("tools.iosModules.steps.install.prerequisite") }}</p>
        </template>
        <div>
          <Label for="ios-upload-code" class="sr-only">{{ t("tools.iosModules.uploadCode.title") }}</Label>
          <div v-if="hasUploadCode" class="flex flex-col gap-2 pt-1 sm:flex-row">
            <div class="flex min-w-0 flex-1 items-center rounded-md border bg-muted/20">
              <Input
                id="ios-upload-code"
                :model-value="userStore.iosUploadCode ?? ''"
                readonly
                class="min-w-0 flex-1 border-0 bg-transparent font-mono text-sm shadow-none focus-visible:ring-0"
              />
              <Button
                class="mr-1 shrink-0"
                variant="ghost"
                size="icon"
                :title="t('tools.iosModules.copyAction', { label: t('tools.iosModules.copyLabel.uploadCode') })"
                :aria-label="t('tools.iosModules.copyAction', { label: t('tools.iosModules.copyLabel.uploadCode') })"
                @click="handleCopyUploadCode"
              >
                <Copy class="size-4" aria-hidden="true" />
              </Button>
            </div>
            <Button
              class="shrink-0"
              variant="outline"
              :disabled="isGeneratingCode || !userStore.isLoggedIn"
              @click="regenerateDialogOpen = true"
            >
              <RefreshCw class="mr-1 size-4" :class="{ 'animate-spin': isGeneratingCode }" />
              {{ t("tools.iosModules.uploadCode.regenerate") }}
            </Button>
          </div>
          <div v-else class="pt-1">
            <Button v-if="userStore.isLoggedIn" class="w-full sm:w-auto" :disabled="isGeneratingCode" @click="generateCode">
              <RefreshCw class="mr-2 size-4" :class="{ 'animate-spin': isGeneratingCode }" />
              {{ t("tools.iosModules.uploadCode.generate") }}
            </Button>
            <!-- Signed out: a way in, not a disabled button. -->
            <div v-else class="flex flex-wrap items-center gap-x-3 gap-y-2" data-testid="ios-login-required">
              <span class="text-sm text-muted-foreground">{{ t("tools.iosModules.uploadCode.loginRequired") }}</span>
              <Button as-child variant="outline" size="sm">
                <RouterLink :to="loginRoute">
                  <LogIn class="size-4" aria-hidden="true" />
                  {{ t("tools.iosModules.uploadCode.loginAction") }}
                </RouterLink>
              </Button>
            </div>
          </div>
        </div>
      </UploadStep>

      <Separator />

      <UploadStep :step="4" :title="t('tools.iosModules.steps.install.title')" :description="t('tools.iosModules.steps.install.description')">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button :disabled="!canInstall" @click="installModule">
            <PackageCheck class="size-4" />
            {{ t("tools.iosModules.installButton") }}
          </Button>
          <p class="min-w-0 flex-1 basis-48 text-xs text-muted-foreground">
            {{ t("tools.iosModules.installHint") }}
          </p>
        </div>

        <div v-if="moduleUrl" class="flex flex-col gap-1.5">
          <p class="flex items-center gap-2 text-sm font-medium">
            <Link2 class="size-4" />
            {{ t("tools.iosModules.generatedUrls.title") }}
          </p>
          <p class="text-xs text-muted-foreground">{{ t("tools.iosModules.generatedUrls.description") }}</p>
          <div class="space-y-2 pt-1">
            <div class="space-y-1">
              <p class="text-xs font-medium text-muted-foreground">{{ t("tools.iosModules.generatedUrls.moduleUrl") }}</p>
              <div class="flex min-w-0 items-center rounded-md border bg-muted/20">
                <Input
                  :model-value="moduleUrl"
                  readonly
                  :aria-label="t('tools.iosModules.generatedUrls.moduleUrl')"
                  class="min-w-0 flex-1 border-0 bg-transparent font-mono text-xs shadow-none focus-visible:ring-0"
                />
                <Button
                  class="mr-1 shrink-0"
                  variant="ghost"
                  size="icon"
                  :title="t('tools.iosModules.copyAction', { label: t('tools.iosModules.copyLabel.moduleUrl') })"
                  :aria-label="t('tools.iosModules.copyAction', { label: t('tools.iosModules.copyLabel.moduleUrl') })"
                  @click="handleCopyModuleUrl"
                >
                  <Copy class="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
            <div v-if="selectedMode === 'script' && scriptUrl" class="space-y-1">
              <p class="text-xs font-medium text-muted-foreground">{{ t("tools.iosModules.generatedUrls.scriptUrl") }}</p>
              <div class="flex min-w-0 items-center rounded-md border bg-muted/20">
                <Input
                  :model-value="scriptUrl"
                  readonly
                  :aria-label="t('tools.iosModules.generatedUrls.scriptUrl')"
                  class="min-w-0 flex-1 border-0 bg-transparent font-mono text-xs shadow-none focus-visible:ring-0"
                />
                <Button
                  class="mr-1 shrink-0"
                  variant="ghost"
                  size="icon"
                  :title="t('tools.iosModules.copyAction', { label: t('tools.iosModules.copyLabel.scriptUrl') })"
                  :aria-label="t('tools.iosModules.copyAction', { label: t('tools.iosModules.copyLabel.scriptUrl') })"
                  @click="handleCopyScriptUrl"
                >
                  <Copy class="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <p class="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {{ t("tools.iosModules.steps.install.after") }}
        </p>
      </UploadStep>
    </CardContent>
  </Card>

  <ConfirmDialog
    v-model:open="regenerateDialogOpen"
    :title="t('tools.iosModules.uploadCode.regenerateDialog.title')"
    :description="t('tools.iosModules.uploadCode.regenerateDialog.description')"
    :confirm-label="t('tools.iosModules.uploadCode.regenerateDialog.confirm')"
    :on-confirm="regenerateCode"
  />
</template>
