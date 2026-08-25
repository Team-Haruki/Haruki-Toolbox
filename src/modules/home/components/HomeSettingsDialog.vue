<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { ensureI18nBundles } from "@/shared/i18n"
import type { Component } from "vue"
import {
  Database,
  Download,
  RefreshCw,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  Smartphone,
  UserRoundCog,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import SekaiDataSettings from "@/modules/home/components/SekaiDataSettings.vue"
import UserDataSettings from "@/modules/home/components/UserDataSettings.vue"
import { useHomeSettings } from "@/modules/home/composables/useHomeSettings"
import { appUpdateState, applyAppUpdate, checkForAppUpdate } from "@/pwa"

interface SettingsSection {
  value: string
  label: string
  description: string
  icon: Component
}

const props = defineProps<{
  open?: boolean
  tab?: string
}>()

const emit = defineEmits<{
  "update:open": [value: boolean]
  "update:tab": [value: string]
}>()

const {
  selectedEndpoint,
  selectedAssetEndpoint,
  selectedTheme,
  selectedLocale,
  selectedReducedVisualEffects,
  selectedHideGameUserId,
  selectedShowUnreleasedContent,
  selectedBlurUnreleasedContent,
  endpointOptions,
  assetEndpointOptions,
  endpointSelectionDisabled,
  endpointUnavailable,
  themeOptions,
  localeOptions,
  selectedEndpointLabel,
  selectedAssetEndpointLabel,
  selectedThemeLabel,
  selectedLocaleLabel,
  latencyChecking,
  latencyTagClass,
  refreshEndpointLatencies,
  resetSettings,
} = useHomeSettings()
const { t, locale } = useI18n()
const internalSettingsDialogOpen = ref(false)
const internalSettingsTab = ref("preferences")
const settingsDialogOpen = computed({
  get: () => props.open ?? internalSettingsDialogOpen.value,
  set: (value: boolean) => {
    internalSettingsDialogOpen.value = value
    emit("update:open", value)
  },
})
const settingsTab = computed({
  get: () => props.tab ?? internalSettingsTab.value,
  set: (value: string) => {
    internalSettingsTab.value = value
    emit("update:tab", value)
  },
})
const visitedSettingsTabs = ref(new Set(["preferences"]))
const currentBuildTimeLabel = computed(() => formatBuildTime(appUpdateState.current.buildTime))
const remoteBuildTimeLabel = computed(() => appUpdateState.remote ? formatBuildTime(appUpdateState.remote.buildTime) : null)

const settingsSections = computed<SettingsSection[]>(() => [
  {
    value: "preferences",
    label: t("homeSettings.tabs.preferences"),
    description: t("homeSettings.sections.preferences"),
    icon: SlidersHorizontal,
  },
  {
    value: "app",
    label: t("homeSettings.tabs.app"),
    description: t("homeSettings.appUpdate.description"),
    icon: Smartphone,
  },
  {
    value: "sekai-data",
    label: t("homeSettings.tabs.sekaiData"),
    description: t("homeSettings.sections.sekaiData"),
    icon: Database,
  },
  {
    value: "user-data",
    label: t("homeSettings.tabs.userData"),
    description: t("homeSettings.userData.description"),
    icon: UserRoundCog,
  },
])

const activeSection = computed(
  () => settingsSections.value.find((section) => section.value === settingsTab.value) ?? settingsSections.value[0]
)

watch(settingsDialogOpen, (open) => {
  if (open) {
    void refreshEndpointLatencies()
    // The Sekai data panel renders userSettings.sekaiData strings; this
    // dialog opens from every page, so pull the bundle on demand.
    void ensureI18nBundles(["user-settings"])
  }
})

watch(settingsTab, (tab) => {
  if (visitedSettingsTabs.value.has(tab)) {
    return
  }

  visitedSettingsTabs.value = new Set([...visitedSettingsTabs.value, tab])
})

function formatBuildTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) {
    return value
  }

  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function hasVisitedSettingsTab(tab: string) {
  return visitedSettingsTabs.value.has(tab)
}
</script>

<template>
  <Dialog v-model:open="settingsDialogOpen">
    <DialogTrigger as-child>
      <Button type="button" variant="ghost" size="sm" class="gap-2" :aria-label="t('homeSettings.trigger')">
        <Settings class="size-4" />
        <span class="hidden sm:inline">{{ t("homeSettings.trigger") }}</span>
      </Button>
    </DialogTrigger>
    <DialogContent
      class="flex h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:h-[min(85svh,44rem)] sm:w-full sm:max-w-4xl sm:p-0"
    >
      <DialogTitle class="sr-only">{{ t("homeSettings.title") }}</DialogTitle>
      <DialogDescription class="sr-only">{{ t("homeSettings.description") }}</DialogDescription>

      <div class="flex min-h-0 flex-1">
        <aside class="hidden w-52 shrink-0 flex-col border-r bg-muted/40 p-3 sm:flex">
          <div class="flex items-center gap-2 px-2.5 pt-1 pb-3 text-sm font-semibold">
            <Settings class="size-4" />
            {{ t("homeSettings.trigger") }}
          </div>
          <nav class="grid gap-1" :aria-label="t('homeSettings.title')">
            <button
              v-for="section in settingsSections"
              :key="section.value"
              type="button"
              :class="[
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                settingsTab === section.value
                  ? 'bg-background font-medium text-foreground shadow-sm ring-1 ring-border/60'
                  : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
              ]"
              :aria-current="settingsTab === section.value ? 'true' : undefined"
              @click="settingsTab = section.value"
            >
              <component
                :is="section.icon"
                class="size-4 shrink-0"
                :class="settingsTab === section.value ? 'text-primary' : ''"
              />
              <span class="min-w-0 truncate">{{ section.label }}</span>
              <span
                v-if="section.value === 'app' && appUpdateState.updateAvailable"
                class="ml-auto size-1.5 shrink-0 rounded-full bg-amber-500"
              />
            </button>
          </nav>
          <div class="mt-auto px-2.5 pt-3 pb-1 font-mono text-[11px] text-muted-foreground">
            v{{ appUpdateState.current.version }}
          </div>
        </aside>

        <div class="flex min-w-0 flex-1 flex-col">
          <!-- mr-10 ends the scrollport before the absolute close button so
               pills can never scroll underneath it. -->
          <div class="shrink-0 border-b sm:hidden">
          <nav
            class="mr-10 flex gap-1.5 overflow-x-auto px-4 pt-4 pb-3"
            :aria-label="t('homeSettings.title')"
          >
            <button
              v-for="section in settingsSections"
              :key="section.value"
              type="button"
              :class="[
                'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition-colors',
                settingsTab === section.value
                  ? 'border-primary bg-primary font-medium text-primary-foreground'
                  : 'border-border text-muted-foreground',
              ]"
              :aria-current="settingsTab === section.value ? 'true' : undefined"
              @click="settingsTab = section.value"
            >
              <component :is="section.icon" class="size-3.5" />
              {{ section.label }}
              <span
                v-if="section.value === 'app' && appUpdateState.updateAvailable"
                class="size-1.5 rounded-full"
                :class="settingsTab === section.value ? 'bg-primary-foreground' : 'bg-amber-500'"
              />
            </button>
          </nav>
          </div>

          <header class="shrink-0 border-b px-4 py-3.5 sm:px-5 sm:py-4 sm:pr-14">
            <h2 class="text-base font-semibold">{{ activeSection.label }}</h2>
            <p class="mt-0.5 text-sm text-muted-foreground">{{ activeSection.description }}</p>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <div v-show="settingsTab === 'preferences'" class="space-y-5">
              <section>
                <h3 class="px-1 pb-2 text-[13px] font-medium text-muted-foreground">
                  {{ t("homeSettings.groups.appearance") }}
                </h3>
                <div class="divide-y divide-border/60 rounded-lg border bg-muted/20">
                  <div class="flex items-center justify-between gap-4 px-4 py-3">
                    <div class="min-w-0">
                      <p id="dialog-theme-label" class="text-sm font-medium">{{ t("homeSettings.theme.label") }}</p>
                      <p class="mt-0.5 text-xs text-muted-foreground">{{ t("homeSettings.theme.help") }}</p>
                    </div>
                    <Select v-model="selectedTheme">
                      <SelectTrigger id="dialog-theme" aria-labelledby="dialog-theme-label dialog-theme" class="w-36 shrink-0 sm:w-40">
                        <SelectValue :placeholder="t('homeSettings.theme.placeholder')">
                          <span class="truncate">{{ selectedThemeLabel }}</span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="opt in themeOptions" :key="opt.value" :value="opt.value">
                          <div class="flex items-center gap-2">
                            <component :is="opt.icon" class="size-4" />
                            {{ opt.label }}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div class="flex items-center justify-between gap-4 px-4 py-3">
                    <div class="min-w-0">
                      <p id="dialog-locale-label" class="text-sm font-medium">{{ t("homeSettings.locale.label") }}</p>
                      <p class="mt-0.5 text-xs text-muted-foreground">{{ t("homeSettings.locale.help") }}</p>
                    </div>
                    <Select v-model="selectedLocale">
                      <SelectTrigger id="dialog-locale" aria-labelledby="dialog-locale-label dialog-locale" class="w-36 shrink-0 sm:w-40">
                        <SelectValue :placeholder="t('homeSettings.locale.placeholder')">
                          <span class="truncate">{{ selectedLocaleLabel }}</span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="opt in localeOptions" :key="opt.value" :value="opt.value">
                          {{ opt.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div class="flex items-center justify-between gap-4 px-4 py-3">
                    <div class="min-w-0">
                      <Label for="dialog-reduced-visual-effects" class="text-sm font-medium">
                        {{ t("homeSettings.visualEffects.label") }}
                      </Label>
                      <p class="mt-0.5 text-xs text-muted-foreground">{{ t("homeSettings.visualEffects.help") }}</p>
                    </div>
                    <Switch id="dialog-reduced-visual-effects" v-model="selectedReducedVisualEffects" class="shrink-0" />
                  </div>
                </div>
              </section>

              <section>
                <div class="flex items-center justify-between gap-3 px-1 pb-2">
                  <h3 class="text-[13px] font-medium text-muted-foreground">
                    {{ t("homeSettings.groups.network") }}
                  </h3>
                  <button
                    type="button"
                    class="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                    :disabled="latencyChecking"
                    @click="refreshEndpointLatencies"
                  >
                    <RefreshCw :class="['size-3.5', latencyChecking ? 'animate-spin' : '']" />
                    {{ t("homeSettings.endpoint.refreshLatency") }}
                  </button>
                </div>
                <div class="divide-y divide-border/60 rounded-lg border bg-muted/20">
                  <div class="flex items-center justify-between gap-4 px-4 py-3">
                    <div class="min-w-0">
                      <p id="dialog-endpoint-label" class="text-sm font-medium">{{ t("homeSettings.endpoint.label") }}</p>
                      <p class="mt-0.5 text-xs text-muted-foreground">{{ t("homeSettings.endpoint.help") }}</p>
                      <p v-if="endpointUnavailable" class="mt-0.5 text-xs text-destructive">
                        {{ t("homeSettings.endpoint.unavailable") }}
                      </p>
                    </div>
                    <Select v-model="selectedEndpoint" :disabled="endpointSelectionDisabled || endpointUnavailable">
                      <SelectTrigger id="dialog-endpoint" aria-labelledby="dialog-endpoint-label dialog-endpoint" class="w-40 shrink-0 sm:w-56">
                        <SelectValue :placeholder="t('homeSettings.endpoint.placeholder')">
                          <span class="truncate">{{ selectedEndpointLabel }}</span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="opt in endpointOptions" :key="opt.value" :value="opt.value">
                          <div class="flex w-full min-w-64 items-center justify-between gap-3">
                            <div class="flex min-w-0 items-center gap-2">
                              <component :is="opt.icon" class="size-4 shrink-0" />
                              <span class="truncate">{{ opt.label }}</span>
                            </div>
                            <span
                              :class="[
                                'shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium',
                                latencyTagClass(opt.latencyStatus),
                              ]"
                            >
                              {{ opt.latencyLabel }}
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div class="flex items-center justify-between gap-4 px-4 py-3">
                    <div class="min-w-0">
                      <p id="dialog-asset-endpoint-label" class="text-sm font-medium">{{ t("homeSettings.assetEndpoint.label") }}</p>
                      <p class="mt-0.5 text-xs text-muted-foreground">{{ t("homeSettings.assetEndpoint.help") }}</p>
                    </div>
                    <Select v-model="selectedAssetEndpoint">
                      <SelectTrigger id="dialog-asset-endpoint" aria-labelledby="dialog-asset-endpoint-label dialog-asset-endpoint" class="w-40 shrink-0 sm:w-56">
                        <SelectValue :placeholder="t('homeSettings.assetEndpoint.placeholder')">
                          <span class="truncate">{{ selectedAssetEndpointLabel }}</span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="opt in assetEndpointOptions" :key="opt.value" :value="opt.value">
                          <div class="flex w-full min-w-64 items-center justify-between gap-3">
                            <div class="flex min-w-0 items-center gap-2">
                              <component :is="opt.icon" class="size-4 shrink-0" />
                              <span class="truncate">{{ opt.label }}</span>
                            </div>
                            <span
                              :class="[
                                'shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium',
                                latencyTagClass(opt.latencyStatus),
                              ]"
                            >
                              {{ opt.latencyLabel }}
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <section>
                <h3 class="px-1 pb-2 text-[13px] font-medium text-muted-foreground">
                  {{ t("homeSettings.groups.privacy") }}
                </h3>
                <div class="divide-y divide-border/60 rounded-lg border bg-muted/20">
                  <div class="flex items-center justify-between gap-4 px-4 py-3">
                    <div class="min-w-0">
                      <Label for="dialog-hide-game-user-id" class="text-sm font-medium">
                        {{ t("homeSettings.privacy.hideGameUserIdLabel") }}
                      </Label>
                      <p class="mt-0.5 text-xs text-muted-foreground">{{ t("homeSettings.privacy.hideGameUserIdHelp") }}</p>
                    </div>
                    <Switch id="dialog-hide-game-user-id" v-model="selectedHideGameUserId" class="shrink-0" />
                  </div>

                  <div class="flex items-center justify-between gap-4 px-4 py-3">
                    <div class="min-w-0">
                      <Label for="dialog-show-unreleased-content" class="text-sm font-medium">
                        {{ t("homeSettings.unreleased.showLabel") }}
                      </Label>
                      <p class="mt-0.5 text-xs text-muted-foreground">{{ t("homeSettings.unreleased.showHelp") }}</p>
                    </div>
                    <Switch id="dialog-show-unreleased-content" v-model="selectedShowUnreleasedContent" class="shrink-0" />
                  </div>

                  <div
                    class="flex items-center justify-between gap-4 px-4 py-3"
                    :class="selectedShowUnreleasedContent ? '' : 'opacity-50'"
                  >
                    <div class="min-w-0">
                      <Label for="dialog-blur-unreleased-content" class="text-sm font-medium">
                        {{ t("homeSettings.unreleased.blurLabel") }}
                      </Label>
                      <p class="mt-0.5 text-xs text-muted-foreground">{{ t("homeSettings.unreleased.blurHelp") }}</p>
                    </div>
                    <Switch
                      id="dialog-blur-unreleased-content"
                      v-model="selectedBlurUnreleasedContent"
                      :disabled="!selectedShowUnreleasedContent"
                      class="shrink-0"
                    />
                  </div>
                </div>
              </section>

              <div class="flex justify-end pt-1">
                <AlertDialog>
                  <AlertDialogTrigger as-child>
                    <Button type="button" variant="outline" size="sm" class="text-destructive hover:text-destructive">
                      <RotateCcw class="size-4" />
                      {{ t("common.reset") }}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{{ t("homeSettings.resetDialog.title") }}</AlertDialogTitle>
                      <AlertDialogDescription>{{ t("homeSettings.resetDialog.description") }}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{{ t("common.cancel") }}</AlertDialogCancel>
                      <AlertDialogAction class="bg-destructive text-white hover:bg-destructive/90" @click="resetSettings">
                        {{ t("homeSettings.resetDialog.confirm") }}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div v-show="settingsTab === 'app'">
              <section class="grid gap-4 rounded-lg border bg-muted/20 p-4">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span
                    :class="[
                      'inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-xs font-medium',
                      appUpdateState.updateAvailable
                        ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
                    ]"
                  >
                    {{ appUpdateState.updateAvailable ? t("homeSettings.appUpdate.available") : t("homeSettings.appUpdate.current") }}
                  </span>
                  <span v-if="appUpdateState.checkedAt" class="text-xs text-muted-foreground">
                    {{ t("homeSettings.appUpdate.checkedAt", { time: formatBuildTime(appUpdateState.checkedAt) }) }}
                  </span>
                </div>

                <div class="grid gap-3 md:grid-cols-3">
                  <div class="rounded-md border border-border/70 bg-background/60 p-3">
                    <p class="text-xs text-muted-foreground">{{ t("webLayout.footer.version") }}</p>
                    <p class="mt-1 font-mono text-sm font-medium">{{ appUpdateState.current.version }}</p>
                  </div>
                  <div class="rounded-md border border-border/70 bg-background/60 p-3">
                    <p class="text-xs text-muted-foreground">{{ t("webLayout.footer.gitCommit") }}</p>
                    <p class="mt-1 font-mono text-sm font-medium">{{ appUpdateState.current.gitCommit }}</p>
                  </div>
                  <div class="rounded-md border border-border/70 bg-background/60 p-3">
                    <p class="text-xs text-muted-foreground">{{ t("webLayout.footer.buildTime") }}</p>
                    <p class="mt-1 text-sm font-medium">{{ currentBuildTimeLabel }}</p>
                  </div>
                </div>

                <div v-if="appUpdateState.remote" class="grid gap-3 rounded-md border border-dashed bg-background/40 p-3 md:grid-cols-3">
                  <div>
                    <p class="text-xs text-muted-foreground">{{ t("homeSettings.appUpdate.remoteVersion") }}</p>
                    <p class="mt-1 font-mono text-sm font-medium">{{ appUpdateState.remote.version }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-muted-foreground">{{ t("homeSettings.appUpdate.remoteCommit") }}</p>
                    <p class="mt-1 font-mono text-sm font-medium">{{ appUpdateState.remote.gitCommit }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-muted-foreground">{{ t("homeSettings.appUpdate.remoteBuildTime") }}</p>
                    <p class="mt-1 text-sm font-medium">{{ remoteBuildTimeLabel }}</p>
                  </div>
                </div>

                <p v-if="appUpdateState.lastError" class="text-xs text-destructive">
                  {{ t("homeSettings.appUpdate.lastError") }}
                </p>

                <div class="grid gap-2 sm:grid-cols-2">
                  <Button type="button" variant="outline" :disabled="appUpdateState.checking || appUpdateState.applying" @click="checkForAppUpdate()">
                    <RefreshCw :class="['size-4', appUpdateState.checking ? 'animate-spin' : '']" />
                    {{ appUpdateState.checking ? t("homeSettings.appUpdate.checking") : t("homeSettings.appUpdate.check") }}
                  </Button>
                  <Button type="button" :disabled="!appUpdateState.updateAvailable || appUpdateState.applying" @click="applyAppUpdate">
                    <Download :class="['size-4', appUpdateState.applying ? 'animate-pulse' : '']" />
                    {{ appUpdateState.applying ? t("homeSettings.appUpdate.updating") : t("homeSettings.appUpdate.update") }}
                  </Button>
                </div>
              </section>
            </div>

            <div v-if="hasVisitedSettingsTab('sekai-data')" v-show="settingsTab === 'sekai-data'">
              <SekaiDataSettings />
            </div>

            <div v-if="hasVisitedSettingsTab('user-data')" v-show="settingsTab === 'user-data'">
              <UserDataSettings />
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
