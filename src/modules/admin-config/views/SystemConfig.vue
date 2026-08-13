<script setup lang="ts">
import { computed } from "vue"
import {
  Card,
  CardAction,
  CardTitle,
  CardHeader,
  CardFooter,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
  LucideSave,
  LucideLoader2,
  LucideKeyRound,
  LucideSettings2,
  LucideRefreshCw,
  LucideAlertCircle,
} from "lucide-vue-next"
import { VueMonacoEditor } from "@guolao/vue-monaco-editor"
import { useI18n } from "vue-i18n"
import { storeToRefs } from "pinia"
import { useSettingsStore } from "@/shared/stores/settings"
import { useSystemConfig } from "@/modules/admin-config/composables/useSystemConfig"

const { t } = useI18n()

const settingsStore = useSettingsStore()
const { theme } = storeToRefs(settingsStore)
const monacoTheme = computed(() => {
  if (theme.value === "dark") {
    return "vs-dark"
  }
  if (theme.value === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "vs-dark" : "vs"
  }
  return "vs"
})

const {
  editorOptions,
  apiKeysLoading,
  apiKeysLoadError,
  apiKeysJson,
  apiKeysSaving,
  apiKeysDirty,
  runtimeLoading,
  runtimeLoadError,
  runtimeJson,
  runtimeSaving,
  runtimeDirty,
  loadApiKeys,
  loadRuntimeConfig,
  saveApiKeys,
  saveRuntimeConfig,
} = useSystemConfig()

// UI-only: let the editors follow their resizable containers.
const monacoOptions = { ...editorOptions, automaticLayout: true }
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <!-- API Keys -->
    <Card class="rounded-lg">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <LucideKeyRound class="h-4 w-4 shrink-0 text-muted-foreground" />
          {{ t("adminConfig.publicApiKeys.title") }}
        </CardTitle>
        <CardDescription>{{ t("adminConfig.publicApiKeys.description") }}</CardDescription>
        <CardAction>
          <span
            class="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 transition-opacity duration-200 dark:text-amber-400"
            :class="apiKeysDirty ? 'opacity-100' : 'pointer-events-none opacity-0'"
            :aria-hidden="!apiKeysDirty"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-current" />
            {{ t("adminConfig.unsavedChanges") }}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Skeleton v-if="apiKeysLoading" class="h-64 w-full rounded-md" />
        <div
          v-else-if="apiKeysLoadError"
          class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-10 text-center"
        >
          <LucideAlertCircle class="h-8 w-8 text-muted-foreground/60" />
          <p class="text-sm text-muted-foreground">{{ t("adminConfig.loadError") }}</p>
          <Button variant="outline" size="sm" @click="loadApiKeys">
            <LucideRefreshCw class="mr-1.5 h-3.5 w-3.5" />
            {{ t("adminConfig.retry") }}
          </Button>
        </div>
        <div
          v-else
          class="h-64 max-h-[70vh] min-h-40 w-full resize-y overflow-hidden rounded-md border border-input shadow-sm"
        >
          <VueMonacoEditor
            v-model:value="apiKeysJson"
            language="json"
            :theme="monacoTheme"
            :options="monacoOptions"
          />
        </div>
      </CardContent>
      <CardFooter v-if="!apiKeysLoadError" class="border-t justify-end">
        <Button :disabled="apiKeysLoading || apiKeysSaving || !apiKeysDirty" @click="saveApiKeys">
          <LucideLoader2 v-if="apiKeysSaving" class="w-4 h-4 mr-1 animate-spin" />
          <LucideSave v-else class="w-4 h-4 mr-1" />
          {{ t("common.save") }}
        </Button>
      </CardFooter>
    </Card>

    <!-- Runtime Config -->
    <Card class="rounded-lg">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <LucideSettings2 class="h-4 w-4 shrink-0 text-muted-foreground" />
          {{ t("adminConfig.runtime.title") }}
        </CardTitle>
        <CardDescription>{{ t("adminConfig.runtime.description") }}</CardDescription>
        <CardAction>
          <span
            class="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 transition-opacity duration-200 dark:text-amber-400"
            :class="runtimeDirty ? 'opacity-100' : 'pointer-events-none opacity-0'"
            :aria-hidden="!runtimeDirty"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-current" />
            {{ t("adminConfig.unsavedChanges") }}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Skeleton v-if="runtimeLoading" class="h-96 w-full rounded-md" />
        <div
          v-else-if="runtimeLoadError"
          class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-10 text-center"
        >
          <LucideAlertCircle class="h-8 w-8 text-muted-foreground/60" />
          <p class="text-sm text-muted-foreground">{{ t("adminConfig.loadError") }}</p>
          <Button variant="outline" size="sm" @click="loadRuntimeConfig">
            <LucideRefreshCw class="mr-1.5 h-3.5 w-3.5" />
            {{ t("adminConfig.retry") }}
          </Button>
        </div>
        <div
          v-else
          class="h-96 max-h-[70vh] min-h-40 w-full resize-y overflow-hidden rounded-md border border-input shadow-sm"
        >
          <VueMonacoEditor
            v-model:value="runtimeJson"
            language="json"
            :theme="monacoTheme"
            :options="monacoOptions"
          />
        </div>
      </CardContent>
      <CardFooter v-if="!runtimeLoadError" class="border-t justify-end">
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button :disabled="runtimeLoading || runtimeSaving || !runtimeDirty">
              <LucideLoader2 v-if="runtimeSaving" class="w-4 h-4 mr-1 animate-spin" />
              <LucideSave v-else class="w-4 h-4 mr-1" />
              {{ t("common.save") }}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{ t("adminConfig.runtime.saveDialogTitle") }}</AlertDialogTitle>
              <AlertDialogDescription>
                {{ t("adminConfig.runtime.saveDialogDescription") }}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ t("common.cancel") }}</AlertDialogCancel>
              <AlertDialogAction @click="saveRuntimeConfig">{{ t("adminConfig.runtime.saveDialogConfirm") }}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  </div>
</template>
