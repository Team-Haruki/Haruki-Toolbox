<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, Copy, KeyRound, Link2, LucideInfo, PackageCheck, RefreshCw } from "lucide-vue-next"
import { useIOSModuleGenerator } from "@/modules/tools/composables/useIOSModuleGenerator"

const { t, locale } = useI18n()

const {
  userStore,
  selectedSoftware,
  selectedEndpoint,
  selectedMode,
  selectedRegions,
  selectedDataTypes,
  chunkSize,
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
  copyToClipboard,
  toggleRegion,
  toggleDataType,
  installModule,
} = useIOSModuleGenerator()

const modeOptionsWithDisabled = computed(() =>
  modeOptions.value.map((opt) => ({
    ...opt,
    disabled: opt.value === "script" && selectedSoftware.value === "qx",
  }))
)

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
      <CardTitle class="flex items-center gap-2">
        <PackageCheck class="h-6 w-6" />
        {{ t("tools.iosModules.title") }}
      </CardTitle>
      <CardDescription>{{ t("tools.iosModules.description") }}</CardDescription>
    </CardHeader>

    <CardContent class="space-y-6">
      <div class="flex items-start gap-2.5 rounded-md border bg-muted/20 px-3 py-2.5 text-sm">
        <LucideInfo class="mt-0.5 size-4 shrink-0 text-primary" />
        <div class="min-w-0 space-y-0.5">
          <p class="leading-relaxed">
            {{ t("tools.iosModules.tutorialAlert.textBefore") }}
            <a
              href="https://neo.haruki.seiunx.com/toolbox-tutorial/ios-module.html"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
            >
              {{ t("tools.iosModules.tutorialAlert.linkText") }}
            </a>
            {{ t("tools.iosModules.tutorialAlert.textAfter") }}
          </p>
          <p v-if="!locale.startsWith('zh')" class="text-xs text-muted-foreground">
            {{ t("tools.iosModules.tutorialAlert.nonZhWarning") }}
          </p>
        </div>
      </div>

      <section class="space-y-4">
        <header class="flex items-start gap-3">
          <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</span>
          <div class="space-y-0.5">
            <h3 class="text-sm font-semibold leading-6">{{ t("tools.iosModules.steps.configure.title") }}</h3>
            <p class="text-xs text-muted-foreground">{{ t("tools.iosModules.steps.configure.description") }}</p>
          </div>
        </header>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-1.5">
            <Label id="ios-software-label" for="ios-software">{{ t("tools.iosModules.sections.software.title") }}</Label>
            <p class="text-xs text-muted-foreground">{{ t("tools.iosModules.sections.software.description") }}</p>
            <div class="mt-auto pt-1">
              <Select id="ios-software" v-model="selectedSoftware">
                <SelectTrigger class="w-full" aria-labelledby="ios-software-label">
                  <SelectValue :placeholder="t('tools.iosModules.sections.software.placeholder')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in softwareOptions"
                    :key="option.value"
                    :value="option.value"
                    :disabled="option.disabled"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <Label id="ios-endpoint-label" for="ios-endpoint">{{ t("tools.iosModules.sections.endpoint.title") }}</Label>
            <p class="whitespace-pre-line text-xs text-muted-foreground">{{ t("tools.iosModules.sections.endpoint.description") }}</p>
            <div class="mt-auto pt-1">
              <Select id="ios-endpoint" v-model="selectedEndpoint">
                <SelectTrigger class="w-full" aria-labelledby="ios-endpoint-label">
                  <SelectValue :placeholder="t('tools.iosModules.sections.endpoint.placeholder')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in endpointOptions"
                    :key="option.value"
                    :value="option.value"
                    :disabled="option.disabled"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <Label id="ios-mode-label" for="ios-mode">{{ t("tools.iosModules.sections.mode.title") }}</Label>
            <p class="whitespace-pre-line text-xs text-muted-foreground">{{ t("tools.iosModules.sections.mode.description") }}</p>
            <div class="mt-auto space-y-1.5 pt-1">
              <Select id="ios-mode" v-model="selectedMode">
                <SelectTrigger class="w-full" aria-labelledby="ios-mode-label">
                  <SelectValue :placeholder="t('tools.iosModules.sections.mode.placeholder')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in modeOptionsWithDisabled"
                    :key="option.value"
                    :value="option.value"
                    :disabled="option.disabled"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p v-if="selectedSoftware === 'qx'" class="text-xs text-amber-600 dark:text-amber-400">
                {{ t("tools.iosModules.qxScriptWarning") }}
              </p>
            </div>
          </div>

          <div v-if="selectedMode === 'script'" class="flex flex-col gap-1.5">
            <Label for="ios-chunk-size">{{ t("tools.iosModules.sections.chunk.title") }}</Label>
            <p class="whitespace-pre-line text-xs text-muted-foreground">{{ t("tools.iosModules.sections.chunk.description") }}</p>
            <div class="mt-auto flex items-center gap-2 pt-1">
              <Input id="ios-chunk-size" v-model.number="chunkSize" type="number" min="1" max="10" class="min-w-0 flex-1" />
              <span class="whitespace-nowrap text-sm text-muted-foreground">{{ t("tools.iosModules.sections.chunk.unit") }}</span>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section class="space-y-4">
        <header class="flex items-start gap-3">
          <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</span>
          <div class="space-y-0.5">
            <h3 class="text-sm font-semibold leading-6">{{ t("tools.iosModules.steps.scope.title") }}</h3>
            <p class="text-xs text-muted-foreground">{{ t("tools.iosModules.steps.scope.description") }}</p>
          </div>
        </header>

        <div class="flex flex-col gap-1.5">
          <p class="text-sm font-medium">{{ t("tools.iosModules.sections.regions.title") }}</p>
          <p class="text-xs text-muted-foreground">{{ t("tools.iosModules.sections.regions.description") }}</p>
          <div class="flex flex-wrap gap-2 pt-1" role="group" :aria-label="t('tools.iosModules.sections.regions.title')">
            <button
              v-for="opt in regionOptions"
              :key="opt.value"
              type="button"
              class="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors"
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
      </section>

      <Separator />

      <section class="space-y-4">
        <header class="flex items-start gap-3">
          <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">3</span>
          <div class="space-y-0.5">
            <h3 class="text-sm font-semibold leading-6">{{ t("tools.iosModules.steps.install.title") }}</h3>
            <p class="text-xs text-muted-foreground">{{ t("tools.iosModules.steps.install.description") }}</p>
          </div>
        </header>

        <div class="flex flex-col gap-1.5">
          <Label for="ios-upload-code" class="flex items-center gap-2">
            <KeyRound class="size-4" />
            {{ t("tools.iosModules.uploadCode.title") }}
          </Label>
          <p class="text-xs text-muted-foreground">{{ t("tools.iosModules.uploadCode.description") }}</p>
          <div v-if="hasUploadCode" class="flex flex-col gap-2 pt-1 sm:flex-row">
            <div class="flex min-w-0 flex-1 items-center rounded-md border bg-muted/20">
              <Input
                id="ios-upload-code"
                :model-value="userStore.iosUploadCode ?? ''"
                readonly
                class="min-w-0 flex-1 border-0 bg-transparent font-mono text-sm shadow-none focus-visible:ring-0"
              />
              <Button class="mr-1 shrink-0" variant="ghost" size="icon" @click="handleCopyUploadCode">
                <Copy class="size-4" />
              </Button>
            </div>
            <Button
              class="shrink-0"
              variant="outline"
              :disabled="isGeneratingCode || !userStore.isLoggedIn"
              @click="generateCode"
            >
              <RefreshCw class="mr-1 size-4" :class="{ 'animate-spin': isGeneratingCode }" />
              {{ t("tools.iosModules.uploadCode.regenerate") }}
            </Button>
          </div>
          <div v-else class="pt-1">
            <Button
              class="w-full sm:w-auto"
              :disabled="isGeneratingCode || !userStore.isLoggedIn"
              @click="generateCode"
            >
              <RefreshCw class="mr-2 size-4" :class="{ 'animate-spin': isGeneratingCode }" />
              {{ userStore.isLoggedIn ? t("tools.iosModules.uploadCode.generate") : t("tools.iosModules.uploadCode.loginRequired") }}
            </Button>
          </div>
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
                <Button class="mr-1 shrink-0" variant="ghost" size="icon" @click="handleCopyModuleUrl">
                  <Copy class="size-4" />
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
                <Button class="mr-1 shrink-0" variant="ghost" size="icon" @click="handleCopyScriptUrl">
                  <Copy class="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-2 pt-1">
          <Button class="w-full" :disabled="!canInstall" @click="installModule">
            <PackageCheck class="mr-2 size-4" />
            {{ t("tools.iosModules.installButton") }}
          </Button>
          <p class="text-center text-xs text-muted-foreground">
            {{ t("tools.iosModules.installHint") }}
          </p>
        </div>
      </section>
    </CardContent>
  </Card>
</template>
