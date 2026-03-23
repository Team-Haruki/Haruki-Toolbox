<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Database, Earth, FileText, PackageCheck, Server, Smartphone, Upload, LucideInfo } from "lucide-vue-next"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { IOSGeneratedUrlsCard, IOSSelectCard, IOSUploadCodeCard } from "@/modules/tools/components"
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

function handleCopyUploadCode(value: string) {
  void copyToClipboard(value, t("tools.iosModules.copyLabel.uploadCode"))
}

function handleCopyModuleUrl(value: string) {
  void copyToClipboard(value, t("tools.iosModules.copyLabel.moduleUrl"))
}

function handleCopyScriptUrl(value: string) {
  void copyToClipboard(value, t("tools.iosModules.copyLabel.scriptUrl"))
}
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center justify-center gap-4 px-0 py-4">
    <Alert class="w-full max-w-md bg-muted/20">
      <LucideInfo class="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
      <div class="space-y-1 w-full">
        <AlertTitle>{{ t("tools.iosModules.tutorialAlert.title") }}</AlertTitle>
        <AlertDescription class="space-y-1.5 leading-relaxed mt-2 text-muted-foreground">
          <p>
            {{ t("tools.iosModules.tutorialAlert.textBefore") }}
            <a href="https://docs.haruki.seiunx.com/toolboxtutorial/ios-module.html" target="_blank" rel="noopener noreferrer" class="font-medium underline underline-offset-4 text-primary hover:text-primary/80 transition-colors">
              {{ t("tools.iosModules.tutorialAlert.linkText") }}
            </a>
            {{ t("tools.iosModules.tutorialAlert.textAfter") }}
          </p>
          <p v-if="locale !== 'zh-CN'" class="text-xs text-muted-foreground mt-1">
            {{ t("tools.iosModules.tutorialAlert.nonZhWarning") }}
          </p>
        </AlertDescription>
      </div>
    </Alert>

    <Card class="w-full max-w-md space-y-3">
      <CardHeader class="flex flex-row items-center gap-2">
        <PackageCheck class="w-6 h-6 text-primary" />
        <div>
          <CardTitle>{{ t("tools.iosModules.title") }}</CardTitle>
          <CardDescription>{{ t("tools.iosModules.description") }}</CardDescription>
        </div>
      </CardHeader>

      <CardContent class="space-y-4">
        <IOSUploadCodeCard
          :upload-code="userStore.iosUploadCode"
          :has-upload-code="hasUploadCode"
          :is-generating-code="isGeneratingCode"
          :is-logged-in="userStore.isLoggedIn"
          @generate="generateCode"
          @copy-upload-code="handleCopyUploadCode"
        />

        <IOSSelectCard
          v-model="selectedSoftware"
          :title="t('tools.iosModules.sections.software.title')"
          :description="t('tools.iosModules.sections.software.description')"
          :options="softwareOptions"
          :placeholder="t('tools.iosModules.sections.software.placeholder')"
        >
          <template #icon>
            <Smartphone class="h-4 w-4" />
          </template>
        </IOSSelectCard>

        <IOSSelectCard
          v-model="selectedEndpoint"
          :title="t('tools.iosModules.sections.endpoint.title')"
          :description="t('tools.iosModules.sections.endpoint.description')"
          :options="endpointOptions"
          :placeholder="t('tools.iosModules.sections.endpoint.placeholder')"
        >
          <template #icon>
            <Server class="h-4 w-4" />
          </template>
        </IOSSelectCard>

        <IOSSelectCard
          v-model="selectedMode"
          :title="t('tools.iosModules.sections.mode.title')"
          :description="t('tools.iosModules.sections.mode.description')"
          :options="modeOptionsWithDisabled"
          :placeholder="t('tools.iosModules.sections.mode.placeholder')"
        >
          <template #icon>
            <Upload class="h-4 w-4" />
          </template>
          <p v-if="selectedSoftware === 'qx'" class="text-sm text-amber-600">
            {{ t("tools.iosModules.qxScriptWarning") }}
          </p>
        </IOSSelectCard>

        <Card v-if="selectedMode === 'script'">
          <CardHeader class="pb-1">
            <CardTitle class="text-base flex items-center gap-2">
              <FileText class="h-4 w-4" />
              {{ t("tools.iosModules.sections.chunk.title") }}
            </CardTitle>
            <CardDescription class="whitespace-pre-line">{{ t("tools.iosModules.sections.chunk.description") }}</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex items-center gap-2">
              <Input v-model.number="chunkSize" type="number" min="1" max="10" class="flex-1" />
              <span class="text-sm text-muted-foreground whitespace-nowrap">{{ t("tools.iosModules.sections.chunk.unit") }}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-1">
            <CardTitle class="text-base flex items-center gap-2">
              <Earth class="h-4 w-4" />
              {{ t("tools.iosModules.sections.regions.title") }}
            </CardTitle>
            <CardDescription>{{ t("tools.iosModules.sections.regions.description") }}</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div
                v-for="opt in regionOptions"
                :key="opt.value"
                class="flex items-center space-x-2 p-2 rounded-md border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                :class="{ 'border-primary bg-primary/5': selectedRegions.includes(opt.value) }"
                @click="toggleRegion(opt.value)"
              >
                <Checkbox
                  :id="`region-${opt.value}`"
                  :model-value="selectedRegions.includes(opt.value)"
                  class="pointer-events-none"
                />
                <Label :for="`region-${opt.value}`" class="cursor-pointer flex-1 pointer-events-none">
                  {{ opt.label }}
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-1">
            <CardTitle class="text-base flex items-center gap-2">
              <Database class="h-4 w-4" />
              {{ t("tools.iosModules.sections.dataTypes.title") }}
            </CardTitle>
            <CardDescription>{{ t("tools.iosModules.sections.dataTypes.description") }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                v-for="opt in dataTypeOptionsWithDesc"
                :key="opt.value"
                class="flex flex-col p-3 rounded-md border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                :class="{ 'border-primary bg-primary/5': selectedDataTypes.includes(opt.value) }"
                @click="toggleDataType(opt.value)"
              >
                <div class="flex items-center space-x-2">
                  <Checkbox
                    :id="`datatype-${opt.value}`"
                    :model-value="selectedDataTypes.includes(opt.value)"
                    class="pointer-events-none"
                  />
                  <Label :for="`datatype-${opt.value}`" class="cursor-pointer font-medium pointer-events-none">
                    {{ opt.label }}
                  </Label>
                </div>
                <p class="text-xs text-muted-foreground mt-1 ml-6">{{ opt.desc }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p v-if="isCnRestricted" class="text-red-600 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
          {{ t("tools.iosModules.cnRestriction") }}
        </p>

        <IOSGeneratedUrlsCard
          v-if="moduleUrl"
          :module-url="moduleUrl"
          :script-url="scriptUrl"
          :show-script-url="selectedMode === 'script'"
          @copy-module-url="handleCopyModuleUrl"
          @copy-script-url="handleCopyScriptUrl"
        />
      </CardContent>

      <CardFooter class="flex-col gap-2">
        <Button class="w-full flex items-center justify-center gap-2" :disabled="!canInstall" @click="installModule">
          <PackageCheck />
          {{ t("tools.iosModules.installButton") }}
        </Button>
        <p class="text-xs text-muted-foreground text-center">
          {{ t("tools.iosModules.installHint") }}
        </p>
      </CardFooter>
    </Card>
  </div>
</template>
