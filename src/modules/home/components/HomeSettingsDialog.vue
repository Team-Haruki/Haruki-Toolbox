<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import {
  CloudLightning,
  Download,
  EyeOff,
  Info,
  Network,
  Palette,
  RotateCcw,
  RefreshCw,
  Save,
  Settings,
  Smartphone,
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
  DialogDescription,
  DialogHeader,
  DialogScrollContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SekaiDataSettings from "@/modules/home/components/SekaiDataSettings.vue"
import UserDataSettings from "@/modules/home/components/UserDataSettings.vue"
import { useHomeSettings } from "@/modules/home/composables/useHomeSettings"
import { appUpdateState, applyAppUpdate, checkForAppUpdate } from "@/pwa"

const {
  selectedEndpoint,
  selectedAssetEndpoint,
  selectedTheme,
  selectedLocale,
  selectedReducedVisualEffects,
  selectedHideGameUserId,
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
  visualEffectsIcon,
  latencyTagClass,
  refreshEndpointLatencies,
  saveSettings,
  resetSettings,
} = useHomeSettings()
const { t, locale } = useI18n()
const localeKey = computed(() => locale.value)
const settingsDialogOpen = ref(false)
const currentBuildTimeLabel = computed(() => formatBuildTime(appUpdateState.current.buildTime))
const remoteBuildTimeLabel = computed(() => appUpdateState.remote ? formatBuildTime(appUpdateState.remote.buildTime) : null)

watch(settingsDialogOpen, (open) => {
  if (open) {
    void refreshEndpointLatencies()
  }
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
</script>

<template>
  <Dialog v-model:open="settingsDialogOpen">
    <DialogTrigger as-child>
      <Button type="button" variant="ghost" size="sm" class="gap-2" :aria-label="t('homeSettings.trigger')">
        <Settings class="size-4" />
        <span class="hidden sm:inline">{{ t("homeSettings.trigger") }}</span>
      </Button>
    </DialogTrigger>
    <DialogScrollContent class="max-h-[88vh] overflow-y-auto sm:max-w-[960px]">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Settings class="size-5" />
          {{ t("homeSettings.title") }}
        </DialogTitle>
        <DialogDescription>{{ t("homeSettings.description") }}</DialogDescription>
      </DialogHeader>

      <Tabs default-value="preferences" class="space-y-4">
        <TabsList class="grid w-full grid-cols-4 sm:w-fit">
          <TabsTrigger value="preferences">
            <Settings class="size-4" />
            {{ t("homeSettings.tabs.preferences") }}
          </TabsTrigger>
          <TabsTrigger value="app">
            <Smartphone class="size-4" />
            {{ t("homeSettings.tabs.app") }}
          </TabsTrigger>
          <TabsTrigger value="sekai-data">
            <Network class="size-4" />
            {{ t("homeSettings.tabs.sekaiData") }}
          </TabsTrigger>
          <TabsTrigger value="user-data">
            <EyeOff class="size-4" />
            {{ t("homeSettings.tabs.userData") }}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" class="space-y-5">
          <div class="grid gap-5 md:grid-cols-2">
            <section class="grid h-full content-center gap-2 rounded-md border border-foreground/10 bg-muted/20 p-4 shadow-sm ring-1 ring-foreground/5">
              <Label class="flex items-center gap-2 text-base font-medium">
                <Network class="size-4" />
                {{ t("homeSettings.endpoint.label") }}
              </Label>
              <p class="text-sm text-muted-foreground">
                {{ t("homeSettings.endpoint.help") }}
              </p>
              <Select v-model="selectedEndpoint" :key="`endpoint-${localeKey}`" :disabled="endpointSelectionDisabled || endpointUnavailable">
                <SelectTrigger class="w-full">
                  <SelectValue :key="`endpoint-value-${localeKey}`" :placeholder="t('homeSettings.endpoint.placeholder')">
                    {{ selectedEndpointLabel }}
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
              <p v-if="endpointUnavailable" class="text-sm text-destructive">
                {{ t("homeSettings.endpoint.unavailable") }}
              </p>
            </section>

            <section class="grid h-full content-center gap-2 rounded-md border border-foreground/10 bg-muted/20 p-4 shadow-sm ring-1 ring-foreground/5">
              <Label class="flex items-center gap-2 text-base font-medium">
                <CloudLightning class="size-4" />
                {{ t("homeSettings.assetEndpoint.label") }}
              </Label>
              <p class="text-sm text-muted-foreground">
                {{ t("homeSettings.assetEndpoint.help") }}
              </p>
              <Select v-model="selectedAssetEndpoint" :key="`asset-endpoint-${localeKey}`">
                <SelectTrigger class="w-full">
                  <SelectValue :key="`asset-endpoint-value-${localeKey}`" :placeholder="t('homeSettings.assetEndpoint.placeholder')">
                    {{ selectedAssetEndpointLabel }}
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
            </section>

            <section class="grid h-full content-center gap-2 rounded-md border border-foreground/10 bg-muted/20 p-4 shadow-sm ring-1 ring-foreground/5">
              <Label class="flex items-center gap-2 text-base font-medium">
                <Palette class="size-4" />
                {{ t("homeSettings.theme.label") }}
              </Label>
              <p class="text-sm text-muted-foreground">{{ t("homeSettings.theme.help") }}</p>
              <Select v-model="selectedTheme" :key="`theme-${localeKey}`">
                <SelectTrigger class="w-full">
                  <SelectValue :key="`theme-value-${localeKey}`" :placeholder="t('homeSettings.theme.placeholder')">
                    {{ selectedThemeLabel }}
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
            </section>

            <section class="grid h-full content-center gap-2 rounded-md border border-foreground/10 bg-muted/20 p-4 shadow-sm ring-1 ring-foreground/5">
              <Label class="flex items-center gap-2 text-base font-medium">
                <Info class="size-4" />
                {{ t("homeSettings.locale.label") }}
              </Label>
              <p class="text-sm text-muted-foreground">{{ t("homeSettings.locale.help") }}</p>
              <Select v-model="selectedLocale" :key="`locale-${localeKey}`">
                <SelectTrigger class="w-full">
                  <SelectValue :key="`locale-value-${localeKey}`" :placeholder="t('homeSettings.locale.placeholder')">
                    {{ selectedLocaleLabel }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in localeOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </section>

            <section class="grid h-full content-center gap-4 rounded-md border border-foreground/10 bg-muted/20 p-4 shadow-sm ring-1 ring-foreground/5">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <Label for="dialog-reduced-visual-effects" class="flex items-center gap-2 text-base font-medium">
                    <component :is="visualEffectsIcon" class="size-4" />
                    {{ t("homeSettings.visualEffects.label") }}
                  </Label>
                  <p class="mt-2 text-sm text-muted-foreground">{{ t("homeSettings.visualEffects.help") }}</p>
                </div>
                <Switch id="dialog-reduced-visual-effects" v-model="selectedReducedVisualEffects" class="mt-1 shrink-0" />
              </div>
            </section>

            <section class="grid h-full content-center gap-4 rounded-md border border-foreground/10 bg-muted/20 p-4 shadow-sm ring-1 ring-foreground/5">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <Label for="dialog-hide-game-user-id" class="flex items-center gap-2 text-base font-medium">
                    <EyeOff class="size-4" />
                    {{ t("homeSettings.privacy.hideGameUserIdLabel") }}
                  </Label>
                  <p class="mt-2 text-sm text-muted-foreground">{{ t("homeSettings.privacy.hideGameUserIdHelp") }}</p>
                </div>
                <Switch id="dialog-hide-game-user-id" v-model="selectedHideGameUserId" class="mt-1 shrink-0" />
              </div>
            </section>
          </div>

          <div class="grid gap-2 border-t pt-4 sm:grid-cols-2">
            <Button type="button" class="w-full" @click="saveSettings">
              <Save class="size-4" />
              {{ t("common.save") }}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger as-child>
                <Button type="button" variant="destructive" class="w-full">
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

          <div class="rounded-md border bg-muted/30 p-3">
            <p class="flex items-start gap-2 text-sm text-muted-foreground">
              <Info class="mt-0.5 size-4 shrink-0" />
              <span><strong>{{ t("common.tip") }}: </strong>{{ t("homeSettings.tip.content") }}</span>
            </p>
          </div>
        </TabsContent>

        <TabsContent value="app" class="space-y-4">
          <section class="grid gap-4 rounded-md border border-foreground/10 bg-muted/20 p-4 shadow-sm ring-1 ring-foreground/5">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="space-y-1">
                <h3 class="flex items-center gap-2 text-base font-medium">
                  <Smartphone class="size-4" />
                  {{ t("homeSettings.appUpdate.title") }}
                </h3>
                <p class="text-sm text-muted-foreground">
                  {{ t("homeSettings.appUpdate.description") }}
                </p>
              </div>
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

            <p v-if="appUpdateState.checkedAt" class="text-xs text-muted-foreground">
              {{ t("homeSettings.appUpdate.checkedAt", { time: formatBuildTime(appUpdateState.checkedAt) }) }}
            </p>
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
        </TabsContent>

        <TabsContent value="sekai-data">
          <SekaiDataSettings />
        </TabsContent>

        <TabsContent value="user-data">
          <UserDataSettings />
        </TabsContent>
      </Tabs>
    </DialogScrollContent>
  </Dialog>
</template>
