<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Database, Earth, FileText, PackageCheck, Server, Smartphone, Upload, LucideInfo } from "lucide-vue-next"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IOSGeneratedUrlsCard, IOSUploadCodeCard } from "@/modules/tools/components"
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
  <div class="flex w-full flex-1 flex-col items-center justify-center px-0 py-4">
    <div class="mx-auto w-full max-w-6xl space-y-3 sm:space-y-4">
      <Alert class="rounded-md border bg-muted/20 shadow-sm sm:rounded-lg">
        <LucideInfo class="mt-0.5 size-4 shrink-0 text-blue-500" />
        <div class="w-full space-y-1">
          <AlertTitle>{{ t("tools.iosModules.tutorialAlert.title") }}</AlertTitle>
          <AlertDescription class="mt-2 space-y-1.5 leading-relaxed text-muted-foreground">
            <p>
              {{ t("tools.iosModules.tutorialAlert.textBefore") }}
              <a href="https://neo.haruki.seiunx.com/toolbox-tutorial/ios-module.html" target="_blank" rel="noopener noreferrer" class="font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80">
                {{ t("tools.iosModules.tutorialAlert.linkText") }}
              </a>
              {{ t("tools.iosModules.tutorialAlert.textAfter") }}
            </p>
            <p v-if="locale !== 'zh-CN'" class="mt-1 text-xs text-muted-foreground">
              {{ t("tools.iosModules.tutorialAlert.nonZhWarning") }}
            </p>
          </AlertDescription>
        </div>
      </Alert>

      <Card class="gap-3 rounded-lg py-3 xl:gap-6 xl:rounded-xl xl:py-6">
        <CardHeader class="gap-3 px-2 sm:flex-row sm:items-start sm:justify-between sm:px-4 xl:px-6">
          <div class="space-y-1.5">
            <CardTitle class="flex items-center gap-2 text-lg">
              <PackageCheck class="size-5" />
              {{ t("tools.iosModules.title") }}
            </CardTitle>
            <CardDescription>{{ t("tools.iosModules.description") }}</CardDescription>
          </div>
        </CardHeader>

        <CardContent class="px-2 pb-2 sm:px-4 sm:pb-4 xl:px-6 xl:pb-6">
          <div class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-5 xl:items-start">
            <div class="grid gap-3 xl:gap-5">
              <section class="grid gap-3 rounded-md border bg-muted/10 p-2.5 sm:p-3 xl:gap-4 xl:rounded-lg xl:p-4">
                <div class="space-y-1">
                  <h2 class="text-base font-semibold">{{ t("tools.iosModules.layers.basic.title") }}</h2>
                  <p class="text-sm text-muted-foreground">{{ t("tools.iosModules.layers.basic.description") }}</p>
                </div>

                <div class="grid gap-3 sm:gap-4 lg:grid-cols-2">
                  <div class="flex h-full flex-col gap-2 rounded-md border bg-card p-3">
                    <Label class="flex items-center gap-2">
                      <Smartphone class="size-4" />
                      {{ t("tools.iosModules.sections.software.title") }}
                    </Label>
                    <p class="text-sm text-muted-foreground">{{ t("tools.iosModules.sections.software.description") }}</p>
                    <div class="mt-auto">
                      <Select v-model="selectedSoftware">
                        <SelectTrigger class="w-full">
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

                  <div class="flex h-full flex-col gap-2 rounded-md border bg-card p-3">
                    <Label class="flex items-center gap-2">
                      <Server class="size-4" />
                      {{ t("tools.iosModules.sections.endpoint.title") }}
                    </Label>
                    <p class="whitespace-pre-line text-sm text-muted-foreground">{{ t("tools.iosModules.sections.endpoint.description") }}</p>
                    <div class="mt-auto">
                      <Select v-model="selectedEndpoint">
                        <SelectTrigger class="w-full">
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

                  <div class="flex h-full flex-col gap-2 rounded-md border bg-card p-3">
                    <Label class="flex items-center gap-2">
                      <Upload class="size-4" />
                      {{ t("tools.iosModules.sections.mode.title") }}
                    </Label>
                    <p class="whitespace-pre-line text-sm text-muted-foreground">{{ t("tools.iosModules.sections.mode.description") }}</p>
                    <div class="mt-auto">
                      <Select v-model="selectedMode">
                        <SelectTrigger class="w-full">
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
                    </div>
                    <p v-if="selectedSoftware === 'qx'" class="text-sm text-amber-600">
                      {{ t("tools.iosModules.qxScriptWarning") }}
                    </p>
                  </div>

                  <div v-if="selectedMode === 'script'" class="flex h-full flex-col gap-2 rounded-md border bg-card p-3">
                    <Label class="flex items-center gap-2">
                      <FileText class="size-4" />
                      {{ t("tools.iosModules.sections.chunk.title") }}
                    </Label>
                    <p class="whitespace-pre-line text-sm text-muted-foreground">{{ t("tools.iosModules.sections.chunk.description") }}</p>
                    <div class="mt-auto flex items-center gap-2">
                      <Input v-model.number="chunkSize" type="number" min="1" max="10" class="min-w-0 flex-1" />
                      <span class="whitespace-nowrap text-sm text-muted-foreground">{{ t("tools.iosModules.sections.chunk.unit") }}</span>
                    </div>
                  </div>
                </div>
              </section>

              <section class="grid gap-3 rounded-md border bg-muted/10 p-2.5 sm:p-3 xl:gap-4 xl:rounded-lg xl:p-4">
                <div class="space-y-1">
                  <h2 class="text-base font-semibold">{{ t("tools.iosModules.layers.scope.title") }}</h2>
                  <p class="text-sm text-muted-foreground">{{ t("tools.iosModules.layers.scope.description") }}</p>
                </div>

                <div class="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                  <div class="grid gap-2">
                    <div class="space-y-1">
                      <h3 class="flex items-center gap-2 text-sm font-medium">
                        <Earth class="size-4" />
                        {{ t("tools.iosModules.sections.regions.title") }}
                      </h3>
                      <p class="text-sm text-muted-foreground">{{ t("tools.iosModules.sections.regions.description") }}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                      <div
                        v-for="opt in regionOptions"
                        :key="opt.value"
                        class="flex cursor-pointer items-center gap-2 rounded-md border bg-card p-2 transition-colors hover:bg-muted/50"
                        :class="{ 'border-primary bg-primary/5': selectedRegions.includes(opt.value) }"
                        @click="toggleRegion(opt.value)"
                      >
                        <Checkbox
                          :id="`region-${opt.value}`"
                          :model-value="selectedRegions.includes(opt.value)"
                          class="pointer-events-none"
                        />
                        <Label :for="`region-${opt.value}`" class="pointer-events-none flex-1 cursor-pointer">
                          {{ opt.label }}
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div class="grid gap-2">
                    <div class="space-y-1">
                      <h3 class="flex items-center gap-2 text-sm font-medium">
                        <Database class="size-4" />
                        {{ t("tools.iosModules.sections.dataTypes.title") }}
                      </h3>
                      <p class="text-sm text-muted-foreground">{{ t("tools.iosModules.sections.dataTypes.description") }}</p>
                    </div>
                    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div
                        v-for="opt in dataTypeOptionsWithDesc"
                        :key="opt.value"
                        class="flex cursor-pointer flex-col rounded-md border bg-card p-3 transition-colors hover:bg-muted/50"
                        :class="{ 'border-primary bg-primary/5': selectedDataTypes.includes(opt.value) }"
                        @click="toggleDataType(opt.value)"
                      >
                        <div class="flex items-center gap-2">
                          <Checkbox
                            :id="`datatype-${opt.value}`"
                            :model-value="selectedDataTypes.includes(opt.value)"
                            class="pointer-events-none"
                          />
                          <Label :for="`datatype-${opt.value}`" class="pointer-events-none cursor-pointer font-medium">
                            {{ opt.label }}
                          </Label>
                        </div>
                        <p class="ml-6 mt-1 text-xs text-muted-foreground">{{ opt.desc }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <p v-if="isCnRestricted" class="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950">
                {{ t("tools.iosModules.cnRestriction") }}
              </p>
            </div>

            <aside class="grid gap-3 xl:sticky xl:top-20 xl:gap-5">
              <IOSUploadCodeCard
                :upload-code="userStore.iosUploadCode"
                :has-upload-code="hasUploadCode"
                :is-generating-code="isGeneratingCode"
                :is-logged-in="userStore.isLoggedIn"
                @generate="generateCode"
                @copy-upload-code="handleCopyUploadCode"
              />

              <IOSGeneratedUrlsCard
                v-if="moduleUrl"
                :module-url="moduleUrl"
                :script-url="scriptUrl"
                :show-script-url="selectedMode === 'script'"
                @copy-module-url="handleCopyModuleUrl"
                @copy-script-url="handleCopyScriptUrl"
              />

              <section class="grid gap-2 rounded-md border bg-muted/10 p-2.5 sm:p-3 xl:rounded-lg xl:p-4">
                <Button class="flex w-full items-center justify-center gap-2" :disabled="!canInstall" @click="installModule">
                  <PackageCheck />
                  {{ t("tools.iosModules.installButton") }}
                </Button>
                <p class="text-center text-xs text-muted-foreground">
                  {{ t("tools.iosModules.installHint") }}
                </p>
              </section>
            </aside>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
