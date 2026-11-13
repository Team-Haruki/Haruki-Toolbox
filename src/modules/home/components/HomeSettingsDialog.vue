<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { ensureI18nBundles } from "@/shared/i18n"
import type { Component } from "vue"
import {
  CalendarClock,
  CircleAlert,
  CircleArrowUp,
  CircleCheck,
  Clock,
  Database,
  Download,
  Droplets,
  EyeOff,
  Gauge,
  GitCommitHorizontal,
  Languages,
  MicVocal,
  Package,
  RefreshCw,
  RotateCcw,
  Server,
  Settings,
  SlidersHorizontal,
  Smartphone,
  SunMoon,
  Tag,
  UserRoundCog,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import SekaiDataSettings from "@/modules/home/components/SekaiDataSettings.vue"
import SettingsFacts, { type SettingsFact } from "@/shared/components/settings/SettingsFacts.vue"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import SettingsRow, { type SettingsRowTone } from "@/shared/components/settings/SettingsRow.vue"
import UserDataSettings from "@/modules/home/components/UserDataSettings.vue"
import { useHomeSettings } from "@/modules/home/composables/useHomeSettings"
import { appUpdateState, applyAppUpdate, checkForAppUpdate } from "@/pwa"
import { PREFERRED_VOCAL_TYPES } from "@/shared/stores/settings"

interface SettingsSection {
  value: string
  label: string
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
  selectedPreferredVocalType,
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
const resetDialogOpen = ref(false)
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
const currentBuildFacts = computed<SettingsFact[]>(() => [
  { key: "version", label: t("webLayout.footer.version"), value: appUpdateState.current.version, icon: Tag, mono: true },
  { key: "commit", label: t("webLayout.footer.gitCommit"), value: appUpdateState.current.gitCommit, icon: GitCommitHorizontal, mono: true },
  { key: "built", label: t("webLayout.footer.buildTime"), value: formatBuildTime(appUpdateState.current.buildTime), icon: Clock },
])
const remoteBuildFacts = computed<SettingsFact[]>(() => {
  const remote = appUpdateState.remote
  if (!remote) {
    return []
  }
  return [
    { key: "version", label: t("homeSettings.appUpdate.remoteVersion"), value: remote.version, icon: Tag, mono: true },
    { key: "commit", label: t("homeSettings.appUpdate.remoteCommit"), value: remote.gitCommit, icon: GitCommitHorizontal, mono: true },
    { key: "built", label: t("homeSettings.appUpdate.remoteBuildTime"), value: formatBuildTime(remote.buildTime), icon: Clock },
  ]
})

const settingsSections = computed<SettingsSection[]>(() => [
  {
    value: "preferences",
    label: t("homeSettings.tabs.preferences"),
    icon: SlidersHorizontal,
  },
  {
    value: "app",
    label: t("homeSettings.tabs.app"),
    icon: Smartphone,
  },
  {
    value: "sekai-data",
    label: t("homeSettings.tabs.sekaiData"),
    icon: Database,
  },
  {
    value: "user-data",
    label: t("homeSettings.tabs.userData"),
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

// The dialog is the surface: the check runs silently and its outcome shows
// in the status badge / inline text instead of a duplicate toast.
const userCheckFailed = ref(false)
async function runUserUpdateCheck() {
  userCheckFailed.value = false
  await checkForAppUpdate({ silent: true })
  userCheckFailed.value = appUpdateState.lastError !== null
}

// A failed boot-time background check is not the user's doing: it reads as
// "not checked yet" in a neutral tone. Only a check they asked for reports
// its failure, inline rather than as a second toast.
const updateCheckFailed = computed(() => appUpdateState.lastError !== null && userCheckFailed.value)
const updateStatus = computed<{ icon: Component; tone: SettingsRowTone; label: string; help: string }>(() => {
  const help = appUpdateState.checkedAt
    ? t("homeSettings.appUpdate.checkedAt", { time: formatBuildTime(appUpdateState.checkedAt) })
    : t("homeSettings.appUpdate.notCheckedYet")
  if (appUpdateState.updateAvailable) {
    return { icon: CircleArrowUp, tone: "warning", label: t("homeSettings.appUpdate.available"), help }
  }
  if (updateCheckFailed.value) {
    return { icon: CircleAlert, tone: "danger", label: t("homeSettings.appUpdate.lastError"), help }
  }
  return { icon: CircleCheck, tone: "success", label: t("homeSettings.appUpdate.current"), help }
})
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
      class="h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] sm:h-[min(85dvh,44rem)] sm:w-full sm:max-w-4xl"
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
          <!-- Phones: four equal icon+label tabs fit a 390px dialog without
               clipping; the row stays clear of the close button above it. -->
          <div class="shrink-0 border-b pt-10 sm:hidden">
          <nav
            class="grid grid-cols-4 gap-1 px-3 pb-2"
            :aria-label="t('homeSettings.title')"
          >
            <button
              v-for="section in settingsSections"
              :key="section.value"
              type="button"
              :class="[
                'relative flex min-w-0 flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[11px] leading-tight transition-colors',
                settingsTab === section.value
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-accent/60',
              ]"
              :aria-current="settingsTab === section.value ? 'true' : undefined"
              @click="settingsTab = section.value"
            >
              <component :is="section.icon" class="size-4" />
              <span class="w-full truncate text-center">{{ section.label }}</span>
              <span
                v-if="section.value === 'app' && appUpdateState.updateAvailable"
                class="absolute top-1 right-2 size-1.5 rounded-full bg-amber-500"
              />
            </button>
          </nav>
          </div>

          <header class="flex shrink-0 items-center gap-3 border-b px-4 py-3.5 sm:px-5 sm:py-4 sm:pr-14">
            <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
              <component :is="activeSection.icon" class="size-4.5" />
            </span>
            <h2 class="min-w-0 text-base font-semibold">{{ activeSection.label }}</h2>
          </header>

          <div class="@container min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <div v-show="settingsTab === 'preferences'" class="space-y-5">
              <SettingsGroup :title="t('homeSettings.groups.appearance')">
                <SettingsRow
                  :icon="SunMoon"
                  :label="t('homeSettings.theme.label')"
                  label-for="dialog-theme"
                  label-id="dialog-theme-label"
                  stack
                >
                  <Select id="dialog-theme" v-model="selectedTheme" :aria-label="t('homeSettings.theme.label')">
                    <SelectTrigger aria-labelledby="dialog-theme-label" class="w-full @min-[28rem]:w-56">
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
                </SettingsRow>

                <SettingsRow
                  :icon="Languages"
                  :label="t('homeSettings.locale.label')"
                  label-for="dialog-locale"
                  label-id="dialog-locale-label"
                  stack
                >
                  <Select id="dialog-locale" v-model="selectedLocale" :aria-label="t('homeSettings.locale.label')">
                    <SelectTrigger aria-labelledby="dialog-locale-label" class="w-full @min-[28rem]:w-56">
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
                </SettingsRow>

                <SettingsRow
                  :icon="Gauge"
                  :label="t('homeSettings.visualEffects.label')"
                  :help="t('homeSettings.visualEffects.help')"
                  label-for="dialog-reduced-visual-effects"
                >
                  <Switch id="dialog-reduced-visual-effects" v-model="selectedReducedVisualEffects" />
                </SettingsRow>
              </SettingsGroup>

              <SettingsGroup :title="t('homeSettings.groups.network')">
                <template #action>
                  <button
                    type="button"
                    class="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50 pointer-coarse:min-h-10 pointer-coarse:px-2.5"
                    :disabled="latencyChecking"
                    @click="refreshEndpointLatencies"
                  >
                    <RefreshCw :class="['size-3.5', latencyChecking ? 'animate-spin' : '']" />
                    {{ t("homeSettings.endpoint.refreshLatency") }}
                  </button>
                </template>

                <SettingsRow
                  :icon="Server"
                  :label="t('homeSettings.endpoint.label')"
                  :help="t('homeSettings.endpoint.help')"
                  label-for="dialog-endpoint"
                  label-id="dialog-endpoint-label"
                  stack
                >
                  <template v-if="endpointUnavailable" #note>
                    <p class="mt-0.5 text-xs text-destructive">{{ t("homeSettings.endpoint.unavailable") }}</p>
                  </template>
                  <Select id="dialog-endpoint" v-model="selectedEndpoint" :aria-label="t('homeSettings.endpoint.label')" :disabled="endpointSelectionDisabled || endpointUnavailable">
                    <SelectTrigger aria-labelledby="dialog-endpoint-label" class="w-full @min-[28rem]:w-56">
                      <SelectValue :placeholder="t('homeSettings.endpoint.placeholder')">
                        <span class="truncate">{{ selectedEndpointLabel }}</span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="opt in endpointOptions" :key="opt.value" :value="opt.value">
                        <div class="flex w-full min-w-0 items-center justify-between gap-3">
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
                </SettingsRow>

                <SettingsRow
                  :icon="Package"
                  :label="t('homeSettings.assetEndpoint.label')"
                  :help="t('homeSettings.assetEndpoint.help')"
                  label-for="dialog-asset-endpoint"
                  label-id="dialog-asset-endpoint-label"
                  stack
                >
                  <Select id="dialog-asset-endpoint" v-model="selectedAssetEndpoint" :aria-label="t('homeSettings.assetEndpoint.label')">
                    <SelectTrigger aria-labelledby="dialog-asset-endpoint-label" class="w-full @min-[28rem]:w-56">
                      <SelectValue :placeholder="t('homeSettings.assetEndpoint.placeholder')">
                        <span class="truncate">{{ selectedAssetEndpointLabel }}</span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="opt in assetEndpointOptions" :key="opt.value" :value="opt.value">
                        <div class="flex w-full min-w-0 items-center justify-between gap-3">
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
                </SettingsRow>
              </SettingsGroup>

              <SettingsGroup :title="t('homeSettings.groups.privacy')">
                <SettingsRow
                  :icon="EyeOff"
                  :label="t('homeSettings.privacy.hideGameUserIdLabel')"
                  :help="t('homeSettings.privacy.hideGameUserIdHelp')"
                  label-for="dialog-hide-game-user-id"
                >
                  <Switch id="dialog-hide-game-user-id" v-model="selectedHideGameUserId" />
                </SettingsRow>

                <SettingsRow
                  :icon="CalendarClock"
                  :label="t('homeSettings.unreleased.showLabel')"
                  label-for="dialog-show-unreleased-content"
                >
                  <Switch id="dialog-show-unreleased-content" v-model="selectedShowUnreleasedContent" />
                </SettingsRow>

                <SettingsRow
                  :icon="Droplets"
                  :label="t('homeSettings.unreleased.blurLabel')"
                  label-for="dialog-blur-unreleased-content"
                  :dimmed="!selectedShowUnreleasedContent"
                >
                  <Switch
                    id="dialog-blur-unreleased-content"
                    v-model="selectedBlurUnreleasedContent"
                    :disabled="!selectedShowUnreleasedContent"
                  />
                </SettingsRow>
              </SettingsGroup>

              <SettingsGroup :title="t('homeSettings.groups.music')">
                <SettingsRow
                  :icon="MicVocal"
                  :label="t('homeSettings.music.preferredVocal.label')"
                  label-for="dialog-preferred-vocal"
                  label-id="dialog-preferred-vocal-label"
                  stack
                >
                  <Select id="dialog-preferred-vocal" v-model="selectedPreferredVocalType" :aria-label="t('homeSettings.music.preferredVocal.label')">
                    <SelectTrigger aria-labelledby="dialog-preferred-vocal-label" class="w-full @min-[28rem]:w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="option in PREFERRED_VOCAL_TYPES" :key="option" :value="option">
                        {{ t(`homeSettings.music.preferredVocal.options.${option}`) }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </SettingsRow>
              </SettingsGroup>

              <SettingsGroup :title="t('homeSettings.groups.reset')">
                <SettingsRow
                  :icon="RotateCcw"
                  :label="t('homeSettings.reset.label')"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    class="text-destructive hover:text-destructive"
                    @click="resetDialogOpen = true"
                  >
                    <RotateCcw class="size-3.5" />
                    {{ t("common.reset") }}
                  </Button>
                  <ConfirmDialog
                    v-model:open="resetDialogOpen"
                    :title="t('homeSettings.resetDialog.title')"
                    :description="t('homeSettings.resetDialog.description')"
                    :confirm-label="t('homeSettings.resetDialog.confirm')"
                    destructive
                    :on-confirm="resetSettings"
                  />
                </SettingsRow>
              </SettingsGroup>
            </div>

            <div v-show="settingsTab === 'app'" class="space-y-5">
              <SettingsGroup :title="t('homeSettings.appUpdate.installedTitle')">
                <SettingsFacts :items="currentBuildFacts" />
              </SettingsGroup>

              <SettingsGroup :title="t('homeSettings.appUpdate.title')">
                <SettingsRow
                  :icon="updateStatus.icon"
                  :tone="updateStatus.tone"
                  :label="updateStatus.label"
                  :help="updateStatus.help"
                  data-testid="settings-update-status"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    :disabled="appUpdateState.checking || appUpdateState.applying"
                    @click="runUserUpdateCheck"
                  >
                    <RefreshCw :class="['size-3.5', appUpdateState.checking ? 'animate-spin' : '']" />
                    {{ appUpdateState.checking ? t("homeSettings.appUpdate.checking") : t("homeSettings.appUpdate.check") }}
                  </Button>
                </SettingsRow>

                <SettingsFacts v-if="remoteBuildFacts.length" :items="remoteBuildFacts" />

                <template v-if="appUpdateState.updateAvailable || appUpdateState.applying" #footer>
                  <Button type="button" size="sm" :disabled="appUpdateState.applying" @click="applyAppUpdate">
                    <Download :class="['size-3.5', appUpdateState.applying ? 'animate-pulse' : '']" />
                    {{ appUpdateState.applying ? t("homeSettings.appUpdate.updating") : t("homeSettings.appUpdate.update") }}
                  </Button>
                </template>
              </SettingsGroup>
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
